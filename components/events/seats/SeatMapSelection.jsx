// components/events/seats/SeatMapSelection.jsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import {
  toggleSeat,
  reserveSeats,
  releaseReservation,
  clearSelection,
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  handleSeatCleanup,
  setSessionId,
  fetchSeatAvailability,
  selectSeat,
  deselectSeat,
  selectHasActiveReservation,
  selectReservationTimeLeft,
} from '@/store/slices/events/seatSelectionSlice';
import SeatButton from './SeatButton';
import socket from '@/config/socket';
import SeatReservationTimer from './SeatReservationTimer';

const SeatMapSelection = ({ event, ticketSelection, eventId }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    seatingLayout,
    selectedSeats,
    currentReservation,
    maxSeatsPerSelection,
    sessionId,
    isLoading,
    error,
  } = useSelector((state) => state.seatSelection);

  const { user } = useSelector((state) => state.user);
  const userId = user?._id;

  // ✅ FIXED: Enhanced timer expiration handling
  const handleTimerExpire = useCallback(() => {
    console.log('⏰ Timer expired, releasing reservation');

    if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
      dispatch(
        releaseReservation({
          eventId: eventId,
          seatIds: currentReservation.seatIds,
          sessionId: currentReservation.sessionId || sessionId,
        })
      )
        .then(() => {
          console.log('🔓 Reservation released due to timeout');
        })
        .catch((error) => {
          console.error('❌ Failed to release expired reservation:', error);
        });
    } else {
      console.warn('⚠️ Timer expired but no reservation data found');
      // Clear selection as fallback
      dispatch(clearSelection());
    }
  }, [dispatch, currentReservation, eventId, sessionId]);

  const [pendingReservation, setPendingReservation] = useState(false);
  const [showSeatingImage, setShowSeatingImage] = useState(false);
  const [pendingAutoRelease, setPendingAutoRelease] = useState(false);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce(
    (sum, qty) => sum + qty,
    0
  );

  // ✅ IMPROVED: Auto-reserve with better validation
  useEffect(() => {
    const shouldAutoReserve =
      selectedSeats.length > 0 &&
      selectedSeats.length === requiredSeats &&
      !currentReservation &&
      !pendingReservation &&
      !isLoading;

    if (shouldAutoReserve) {
      console.log('🎫 Auto-reserving seats:', selectedSeats);
      handleReserveSeats();
    }
  }, [
    selectedSeats,
    requiredSeats,
    currentReservation,
    pendingReservation,
    isLoading,
  ]);

// ✅ ENHANCED: Auto-release when deselecting to incomplete count with loading state
useEffect(() => {
  const shouldAutoRelease =
    selectedSeats.length < requiredSeats &&  // Less than required seats
    selectedSeats.length >= 0 &&             // Valid count
    currentReservation &&                     // Has active reservation
    currentReservation.seatIds &&            // Has reserved seats
    currentReservation.seatIds.length > 0 && // Not empty
    !pendingReservation &&                   // Not currently processing reservation
    !pendingAutoRelease &&                   // ✅ NEW: Not currently processing auto-release
    !isLoading;                              // Not loading

  if (shouldAutoRelease) {
    console.log('🔓 Auto-releasing reservation due to incomplete selection:', {
      selectedSeats: selectedSeats.length,
      required: requiredSeats,
      reservedSeats: currentReservation.seatIds
    });
    handleAutoRelease();
  }
}, [
  selectedSeats.length,
  requiredSeats,
  currentReservation,
  pendingReservation,
  pendingAutoRelease, // ✅ NEW: Include in dependencies
  isLoading,
]);

  // ✅ ENHANCED: Socket connection with better error handling
  useEffect(() => {
    if (!eventId) {
      console.warn('⚠️ No eventId provided for socket connection');
      return;
    }

    // Generate session ID if not exists
    if (!sessionId) {
      const newSessionId = `web_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      dispatch(setSessionId(newSessionId));
      console.log('🆔 Generated new session ID:', newSessionId);
    }

    const connectToRoom = () => {
      if (socket.connected) {
        socket.emit('seat:join_event', eventId);
        console.log(`🔌 Joined seat room for event: ${eventId}`);
      } else {
        console.log('⏳ Waiting for socket connection...');
        setTimeout(connectToRoom, 1000); // Retry after 1 second
      }
    };

    connectToRoom();

    // ✅ FIXED: Updated socket event handlers for new backend structure
    const handleSeatUpdate = (data) => {
      console.log('📡 Received seat update:', data);
      dispatch(handleRemoteSeatUpdate(data));
    };

    const handleUserDisconnect = (data) => {
      console.log('👤 User disconnected:', data.userId);
      dispatch(handleUserDisconnected(data));
    };

    const handleCleanupCompleted = (data) => {
      console.log('🧹 Seat cleanup completed:', data);
      dispatch(handleSeatCleanup(data));

      // Refresh seat availability after cleanup
      if (data.seatsReleased > 0) {
        dispatch(fetchSeatAvailability(eventId));
      }
    };

    // Register event listeners
    socket.on('seat:status_changed', handleSeatUpdate);
    socket.on('seat:user_disconnected', handleUserDisconnect);
    socket.on('seat:cleanup_completed', handleCleanupCompleted);

    // Cleanup function
    return () => {
      if (socket.connected) {
        socket.emit('seat:leave_event', eventId);
        console.log(`🔌 Left seat room for event: ${eventId}`);
      }
      socket.off('seat:status_changed', handleSeatUpdate);
      socket.off('seat:user_disconnected', handleUserDisconnect);
      socket.off('seat:cleanup_completed', handleCleanupCompleted);
    };
  }, [eventId, dispatch, sessionId]);

  // ✅ ENHANCED: Socket reconnection handling
  useEffect(() => {
    if (!eventId) return;

    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, rejoining event room');
      socket.emit('seat:join_event', eventId);
      // Refresh seat availability after reconnection
      dispatch(fetchSeatAvailability(eventId));
    };

    const handleDisconnect = () => {
      console.log('🔌 Socket disconnected');
    };

    socket.on('connect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [eventId, dispatch]);

// ✅ ENHANCED: Improved seat click handling with symmetric auto-management
const handleSeatClick = (seatId, seatStatus) => {
  console.log(`🪑 Seat clicked: ${seatId}, status: ${seatStatus}`);

  // Prevent selection if loading or seat is unavailable
 if (isLoading || pendingReservation || pendingAutoRelease) {
    const operation = pendingAutoRelease ? 'releasing reservation' : 
                     pendingReservation ? 'reserving seats' : 'loading';
    console.log(`⏳ Ignoring click - ${operation} in progress`);
    return;
  }

  if (
    seatStatus === 'booked' ||
    seatStatus === 'disabled' ||
    seatStatus === 'reserved'
  ) {
    console.log(`🚫 Cannot select seat ${seatId} - status: ${seatStatus}`);
    return;
  }

  // Check if seat is being held by another user
  if (seatStatus === 'selected-by-other') {
    console.log(`👥 Seat ${seatId} is being held by another user`);
    return;
  }

  const isCurrentlySelected = selectedSeats.includes(seatId);

  // ✅ NEW: Enhanced selection limit validation with better messaging
  if (!isCurrentlySelected && selectedSeats.length >= requiredSeats) {
    // More helpful message for users
    const message = selectedSeats.length === requiredSeats 
      ? `You have selected all ${requiredSeats} required seats. Deselect a seat first if you want to choose a different one.`
      : `You can only select ${requiredSeats} seat${requiredSeats !== 1 ? 's' : ''} total. Please deselect some seats first.`;
    
    alert(message);
    return;
  }

  // Validate seat exists in layout
  const seatDetails = findSeatInLayout(seatId);
  if (!seatDetails) {
    console.error('❌ Attempted to select non-existent seat:', seatId);
    alert('This seat is no longer available. Please refresh the page.');
    return;
  }

  // ✅ ENHANCED: Handle seat selection/deselection with auto-management awareness
  if (isCurrentlySelected) {
    console.log(`🔄 Deselecting seat: ${seatId} (will trigger auto-release if needed)`);
    dispatch(deselectSeat(seatId));
    
    // ✅ NEW: Provide immediate feedback about what will happen
    const newCount = selectedSeats.length - 1;
    if (newCount < requiredSeats && currentReservation) {
      console.log(`ℹ️ Deselection will trigger auto-release (${newCount}/${requiredSeats} seats)`);
    }
  } else {
    console.log(`✅ Selecting seat: ${seatId} (will trigger auto-reserve if complete)`);
    dispatch(selectSeat(seatId));
    
    // ✅ NEW: Provide immediate feedback about what will happen
    const newCount = selectedSeats.length + 1;
    if (newCount === requiredSeats && !currentReservation) {
      console.log(`ℹ️ Selection will trigger auto-reservation (${newCount}/${requiredSeats} seats)`);
    }
  }

  // ✅ ENHANCED: Improved socket event with operation context
  if (socket.connected) {
    socket.emit('seat:status_update', {
      eventId: eventId,
      seatId: seatId,
      status: isCurrentlySelected ? 'available' : 'selected',
      userId: userId,
      sessionId: sessionId,
      timestamp: new Date(),
      // ✅ NEW: Add context for auto-management
      operationType: isCurrentlySelected ? 'deselect' : 'select',
      willTriggerAutoAction: isCurrentlySelected 
        ? (selectedSeats.length - 1 < requiredSeats && currentReservation)
        : (selectedSeats.length + 1 === requiredSeats && !currentReservation)
    });
  } else {
    console.warn('⚠️ Socket not connected, seat update not broadcast');
  }
};

  // ✅ NEW: Helper function to find seat in layout
  const findSeatInLayout = (seatId) => {
    for (const row of seatingLayout) {
      const seat = row.seats?.find((s) => s.seatId === seatId);
      if (seat) {
        return {
          seat,
          row: row.rowLabel,
          seatNumber: seat.seatNumber || seat.number,
          status: seat.status,
        };
      }
    }
    return null;
  };

// ✅ ENHANCED: Auto-release helper function with loading state management
const handleAutoRelease = async () => {
  if (!currentReservation?.seatIds || currentReservation.seatIds.length === 0) {
    console.log('⏸️ Cannot auto-release - no reservation found');
    return;
  }

  // ✅ NEW: Set loading state for auto-release
  setPendingAutoRelease(true);
  console.log('🔓 Starting auto-release process for reservation:', currentReservation.reservationId);

  try {
    const releaseData = {
      eventId: eventId,
      seatIds: currentReservation.seatIds,
      sessionId: currentReservation.sessionId || sessionId,
    };

    await dispatch(releaseReservation(releaseData)).unwrap();
    console.log('✅ Auto-release completed successfully');
  } catch (error) {
    console.error('❌ Auto-release failed:', error);
    
    // Enhanced error handling
    if (error.message && error.message.includes('not found')) {
      console.log('ℹ️ Reservation already released, clearing local state');
      dispatch(clearSelection());
    } else {
      console.error('🚨 Unexpected auto-release error, may need manual intervention');
    }
  } finally {
    // ✅ NEW: Always clear loading state
    setPendingAutoRelease(false);
  }
};

  // ✅ ENHANCED: Improved seat reservation with better error handling
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0 || pendingReservation) {
      console.log('⏸️ Cannot reserve - no seats selected or already pending');
      return;
    }

    // Validate seat count matches ticket count
    if (selectedSeats.length !== requiredSeats) {
      const message = `Please select exactly ${requiredSeats} seat${
        requiredSeats !== 1 ? 's' : ''
      } for your ${requiredSeats} ticket${
        requiredSeats !== 1 ? 's' : ''
      }. Currently selected: ${selectedSeats.length}`;

      console.warn('⚠️ Seat count mismatch:', message);
      alert(message);
      return;
    }

    // Validate all selected seats exist and are available
    const invalidSeats = [];
    const validatedSeats = [];

    for (const seatId of selectedSeats) {
      const seatDetails = findSeatInLayout(seatId);
      if (!seatDetails) {
        invalidSeats.push(seatId);
      } else if (
        seatDetails.status !== 'available' &&
        seatDetails.status !== 'selected'
      ) {
        invalidSeats.push(seatId);
      } else {
        validatedSeats.push(seatDetails);
      }
    }

    if (invalidSeats.length > 0) {
      console.error('❌ Invalid seats found:', invalidSeats);
      alert(
        'Some selected seats are no longer available. Please refresh and try again.'
      );
      dispatch(clearSelection());
      return;
    }

    setPendingReservation(true);

    try {
      console.log('🎫 Starting seat reservation process...');

      const reservationData = {
        eventId: eventId,
        seatIds: selectedSeats,
        sessionId: sessionId || `web_${Date.now()}`,
        ticketTypeId: null, // Add if needed for specific ticket types
      };

      const result = await dispatch(reserveSeats(reservationData)).unwrap();
      console.log('✅ Seats reserved successfully:', result);
    } catch (error) {
      console.error('❌ Failed to reserve seats:', error);

      // Enhanced error handling with specific messages
      if (error.message) {
        if (error.message.includes('not found')) {
          alert(
            'One or more selected seats are no longer available. The page will refresh.'
          );
          window.location.reload();
        } else if (
          error.message.includes('reserved') ||
          error.message.includes('selected')
        ) {
          alert(
            'Some seats have been reserved by another user. Please select different seats.'
          );
          dispatch(clearSelection());
        } else if (error.message.includes('expired')) {
          alert('Your session has expired. Please refresh and try again.');
          window.location.reload();
        } else {
          alert(`Failed to reserve seats: ${error.message}`);
          dispatch(clearSelection());
        }
      } else {
        alert('Failed to reserve seats. Please try again.');
        dispatch(clearSelection());
      }
    } finally {
      setPendingReservation(false);
    }
  };

// ✅ ENHANCED: Improved clear selection with explicit reservation release
const handleClearSelection = async () => {
  console.log('🗑️ Manual clear selection triggered...');

  // ✅ NEW: More informative logging
  if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
    console.log('🔓 Manually releasing current reservation:', {
      reservationId: currentReservation.reservationId,
      seatCount: currentReservation.seatIds.length,
      seatsToRelease: currentReservation.seatIds
    });
    
    try {
      await dispatch(
        releaseReservation({
          eventId: eventId,
          seatIds: currentReservation.seatIds,
          sessionId: currentReservation.sessionId || sessionId,
        })
      ).unwrap();
      console.log('✅ Manual reservation release successful');
    } catch (error) {
      console.error('❌ Failed to release reservation manually:', error);
      // Continue with clearing selection even if release fails
    }
  } else {
    console.log('ℹ️ No active reservation to release, just clearing selection');
  }

  dispatch(clearSelection());
};

  // ✅ IMPROVED: Enhanced seat status detection
  const getSeatStatus = (seat, seatId) => {
    // Priority 1: Check if selected in current session
    const isSelectedByUser = selectedSeats.includes(seatId);
    if (isSelectedByUser) return 'selected';

    // Priority 2: Check if reserved by current user
    const isReservedByUser = currentReservation?.seatIds?.includes(seatId);
    if (isReservedByUser) return 'selected';

    // Priority 3: Check backend seat status
    if (seat.status === 'booked') return 'booked';
    if (seat.status === 'disabled') return 'disabled';
    if (seat.status === 'reserved') return 'reserved';

    // Priority 4: Check if held by another user (with valid expiry)
    if (seat.status === 'selected' && seat.reservedBy && seat.reservedUntil) {
      const isExpired = new Date(seat.reservedUntil) <= new Date();
      if (!isExpired && seat.reservedBy !== userId) {
        return 'selected-by-other';
      }
    }

    // Default: available
    return 'available';
  };

  const totalSeats = seatingLayout.reduce(
    (total, row) => total + (row.seats?.length || 0),
    0
  );

  // ✅ IMPROVED: Error handling display
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <svg
            className="w-8 h-8 text-red-600 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Seat Selection Error
          </h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top controls - compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Socket status indicator */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div
              className={`w-2 h-2 rounded-full ${
                socket.connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span>{socket.connected ? 'Live updates' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Toggle seating layout image */}
          {event.seatingLayoutImage?.url && (
            <button
              onClick={() => setShowSeatingImage(!showSeatingImage)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showSeatingImage ? 'Hide' : 'Show'} Layout Image
            </button>
          )}

          {/* Clear selection */}
          {selectedSeats.length > 0 && (
            <button
              onClick={handleClearSelection}
              disabled={isLoading || pendingReservation}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Seating layout image (if toggled) */}
      {showSeatingImage && event.seatingLayoutImage?.url && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Venue Layout Reference
          </h3>
          <img
            src={event.seatingLayoutImage.url}
            alt="Seating Layout"
            className="max-w-full h-auto rounded border border-gray-300"
          />
        </div>
      )}

      {/* Seat map - maximized space */}
      <div className="relative">
        {seatingLayout.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            <p className="text-gray-500">
              No seating layout available for this event
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Stage indicator */}
            <div className="text-center mb-6">
              <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded-lg text-sm font-medium">
                🎭 STAGE
              </div>
            </div>

            <div className="min-w-fit mx-auto space-y-3 p-4">
              {seatingLayout.map((row, rowIndex) => (
                <div
                  key={`row-${rowIndex}-${row.rowLabel}`}
                  className="flex items-center justify-center space-x-2"
                >
                  {/* Row label */}
                  <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                    {row.rowLabel}
                  </div>

                  {/* Seats */}
                  <div className="flex space-x-1">
                    {(row.seats || [])
                      .map((seat, seatIndex) => {
                        // Use backend seatId - fail if not present
                        const seatId = seat.seatId;
                        if (!seatId) {
                          console.error(
                            '❌ Missing seatId for seat:',
                            seat,
                            'in row:',
                            row.rowLabel
                          );
                          return null; // Skip rendering this seat
                        }

                        const seatStatus = getSeatStatus(seat, seatId);

                        return (
                          <SeatButton
  key={`${seatId}-${seatIndex}`}
  seat={{ ...seat, seatId }}
  row={row}
  isSelected={selectedSeats.includes(seatId)}
  isReservedByUser={currentReservation?.seatIds?.includes(seatId)}
  onClick={() => handleSeatClick(seatId, seatStatus)}
  disabled={isLoading || pendingReservation || pendingAutoRelease} // ✅ ENHANCED: Include auto-release loading
  userId={userId}
/>
                        );
                      })
                      .filter(Boolean)}
                  </div>

                  {/* Row label (right side) */}
                  <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                    {row.rowLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(isLoading || pendingReservation || pendingAutoRelease) && (
  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
      <p className="mt-2 text-sm text-gray-600">
        {pendingAutoRelease ? 'Releasing seats...' : 
         pendingReservation ? 'Reserving seats...' : 
         'Loading...'}
      </p>
            </div>
          </div>
        )}
      </div>

      {/* Selection progress - compact */}
      {requiredSeats > 0 && (
        <div
          className={`border rounded-lg p-3 ${
            selectedSeats.length === requiredSeats
              ? 'bg-green-50 border-green-200'
              : selectedSeats.length > requiredSeats
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className={`w-4 h-4 mr-2 ${
                  selectedSeats.length === requiredSeats
                    ? 'text-green-600'
                    : selectedSeats.length > requiredSeats
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    selectedSeats.length === requiredSeats
                      ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  }
                />
              </svg>
              <span
                className={`text-sm font-medium ${
                  selectedSeats.length === requiredSeats
                    ? 'text-green-800'
                    : selectedSeats.length > requiredSeats
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}
              >
                {selectedSeats.length === 0
                  ? `Click on available seats to select them (need ${requiredSeats})`
                  : selectedSeats.length < requiredSeats
                  ? `Select ${requiredSeats - selectedSeats.length} more seat${
                      requiredSeats - selectedSeats.length !== 1 ? 's' : ''
                    } (${selectedSeats.length}/${requiredSeats})`
                  : selectedSeats.length === requiredSeats
                  ? `Perfect! All ${requiredSeats} seats selected: ${selectedSeats.join(
                      ', '
                    )}`
                  : `Too many seats selected! Please deselect ${
                      selectedSeats.length - requiredSeats
                    } seat${
                      selectedSeats.length - requiredSeats !== 1 ? 's' : ''
                    }`}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-medium ${
                  selectedSeats.length === requiredSeats
                    ? 'text-green-800'
                    : selectedSeats.length > requiredSeats
                    ? 'text-red-800'
                    : 'text-blue-800'
                }`}
              >
                {selectedSeats.length}/{requiredSeats}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current reservation info */}
      {currentReservation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Seats reserved! Complete your purchase within the time limit.
            </span>
          </div>
          {currentReservation?.reservedUntil && (
            <SeatReservationTimer
              expiryTime={currentReservation.reservedUntil}
              onExpire={handleTimerExpire}
              eventId={eventId}
            />
          )}
        </div>
      )}

      {/* Venue stats */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>
          Venue capacity: {totalSeats} seats • {event.venue}
        </p>
        {sessionId && (
          <p className="text-xs text-gray-400 mt-1">
            Session: {sessionId.substring(0, 12)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default SeatMapSelection;
