// components/events/seats/SeatMapSelection.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import {
  toggleSeat,
  reserveSeats,
  releaseReservation,
  clearSelection,
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  setSessionId,
  fetchSeatAvailability,
  selectSeat,
  deselectSeat,
} from '@/store/slices/events/seatSelectionSlice';
import SeatButton from './SeatButton';
import socket from '@/config/socket';
import SeatReservationTimer from './SeatReservationTimer';

const SeatMapSelection = ({ event, ticketSelection }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const handleTimerExpire = () => {
  if (currentReservation?.reservationId && currentReservation?.reservedUntil) {
    dispatch(releaseReservation({
      eventId: currentEventId,
      reservationId: currentReservation.reservationId
    }));
  }
};

const {
  seatingLayout,
  selectedSeats,
  currentReservation,
  maxSeatsPerSelection,
  sessionId,
  isLoading,
  currentEventId, // ✅ ADD THIS LINE
} = useSelector((state) => state.seatSelection);

  const { user } = useSelector((state) => state.user);
  const userId = user?._id;

  const [pendingReservation, setPendingReservation] = useState(false);
  const [showSeatingImage, setShowSeatingImage] = useState(false);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce(
    (sum, qty) => sum + qty,
    0
  );

  // Utility function to generate consistent seat IDs
  const generateSeatId = (seat, row, seatIndex) => {
    // First priority: use backend's seatId field (A-1, B-2, etc.)
    if (seat.seatId) {
      return seat.seatId;
    }

    // Second priority: use backend's id field
    if (seat.id) {
      return seat.id;
    }

    // Fallback: generate from row and seat number to match backend format
    const rowLabel = row.rowLabel || row.label || `R${seatIndex + 1}`;
    const seatNumber = seat.seatNumber || seat.number || seatIndex + 1;
    return `${rowLabel}-${seatNumber}`;
  };

  // Auto-reserve seats when selection changes
  useEffect(() => {
    if (
      selectedSeats.length > 0 &&
      selectedSeats.length === requiredSeats &&
      !currentReservation
    ) {
      handleReserveSeats();
    }
  }, [selectedSeats, requiredSeats, currentReservation]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!event?._id) return;

    // Wait for socket to be connected (SocketListener handles connection)
    const checkAndJoinRoom = () => {
      if (socket.connected) {
        // Join event room
        socket.emit('seat:join_event', event._id);
        console.log('Joined seat selection room for event:', event._id);
      } else {
        console.log('Waiting for socket connection...');
        // Retry after a short delay
        setTimeout(checkAndJoinRoom, 500);
      }
    };

    checkAndJoinRoom();

    // Listen for seat updates from other users
    const handleSeatUpdate = (data) => {
      console.log('Received seat update:', data);
      dispatch(handleRemoteSeatUpdate(data));
    };

    const handleUserDisconnect = (data) => {
      console.log('User disconnected:', data.userId);
      dispatch(handleUserDisconnected(data));
    };

    socket.on('seat:status_changed', handleSeatUpdate);
    socket.on('seat:user_disconnected', handleUserDisconnect);

    const handleCleanupCompleted = () => {
      console.log('Seat cleanup completed, refreshing availability');
      // Refresh seat availability from backend
      dispatch(fetchSeatAvailability(event._id));
    };

    socket.on('seat:cleanup_completed', handleCleanupCompleted);

    // Cleanup
    return () => {
      if (socket.connected) {
        socket.emit('seat:leave_event', event._id);
      }
      socket.off('seat:status_changed', handleSeatUpdate);
      socket.off('seat:user_disconnected', handleUserDisconnect);
      socket.off('seat:cleanup_completed', handleCleanupCompleted);
      console.log('Left seat selection room');
    };
  }, [event?._id, dispatch]);

  // Handle socket reconnection
  useEffect(() => {
    if (!event?._id) return;

    const handleReconnect = () => {
      console.log('Socket reconnected, rejoining event room');
      socket.emit('seat:join_event', event._id);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socket.on('connect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [event?._id]);

  const handleSeatClick = (seatId, seatStatus) => {
    // Prevent selection if loading or seat is occupied/disabled
    if (isLoading || seatStatus === 'occupied' || seatStatus === 'disabled') {
      return;
    }

    // Better seat limit validation
    const isCurrentlySelected = selectedSeats.includes(seatId);

    if (!isCurrentlySelected && selectedSeats.length >= requiredSeats) {
      alert(
        `You can only select ${requiredSeats} seat${
          requiredSeats !== 1 ? 's' : ''
        } for your ${requiredSeats} ticket${
          requiredSeats !== 1 ? 's' : ''
        }. Please deselect a seat first if you want to choose a different one.`
      );
      return;
    }

    // Validate seat exists in layout before dispatching
    let seatExists = false;
    let seatDetails = null;

    for (const row of seatingLayout) {
      const seat = row.seats?.find((s) => {
        const currentSeatId = generateSeatId(s, row, 0);
        return currentSeatId === seatId;
      });
      if (seat) {
        seatExists = true;
        seatDetails = {
          row: row.rowLabel,
          seatNumber: seat.seatNumber || seat.number,
          status: seat.status,
        };
        break;
      }
    }

    if (!seatExists) {
      console.error('Attempted to select non-existent seat:', seatId);
      alert('This seat is no longer available. Please refresh the page.');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      dispatch(deselectSeat(seatId));

      // Release only the deselected seat
      if (currentReservation?.reservationId) {
        dispatch(
          releaseReservation({
            eventId: event._id,
            reservationId: currentReservation.reservationId,
          })
        );
      }
    } else {
      dispatch(selectSeat(seatId));
    }

    // Emit to other users (optimistic update)
    if (socket.connected) {
      socket.emit('seat:status_update', {
        eventId: event._id,
        seatId: seatId,
        status: isCurrentlySelected ? 'available' : 'selected',
        userId: userId, // Add userId to the emit
      });
    } else {
      console.warn('Socket not connected, seat update not broadcast');
    }
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0 || pendingReservation) return;

    // Validate seat count matches ticket count
    if (selectedSeats.length !== requiredSeats) {
      alert(
        `Please select exactly ${requiredSeats} seat${
          requiredSeats !== 1 ? 's' : ''
        } for your ${requiredSeats} ticket${
          requiredSeats !== 1 ? 's' : ''
        }. Currently selected: ${selectedSeats.length}`
      );
      return;
    }

    // Validate that all selected seats exist in the seating layout
    const invalidSeats = [];
    const validatedSeats = [];

    for (const seatId of selectedSeats) {
      let seatExists = false;
      for (const row of seatingLayout) {
        const seat = row.seats?.find((s) => {
          const currentSeatId = generateSeatId(s, row, 0);
          return currentSeatId === seatId;
        });
        if (seat) {
          seatExists = true;
          validatedSeats.push({
            seatId,
            row: row.rowLabel,
            seatNumber: seat.seatNumber || seat.number,
            status: seat.status,
          });
          break;
        }
      }
      if (!seatExists) {
        invalidSeats.push(seatId);
      }
    }

    if (invalidSeats.length > 0) {
      console.error('Invalid seats found:', invalidSeats);
      alert(
        'Some selected seats are no longer available. Please refresh and try again.'
      );
      dispatch(clearSelection());
      return;
    }

    setPendingReservation(true);
    try {
      const reservationData = {
        eventId: event._id,
        seatIds: selectedSeats,
        sessionId: sessionId || `web_${Date.now()}`,
      };

      const result = await dispatch(reserveSeats(reservationData)).unwrap();
    } catch (error) {
      console.error('Failed to reserve seats:', error);

      // More specific error handling
      if (error.message && error.message.includes('not found')) {
        alert(
          'One or more selected seats are no longer available. The page will refresh.'
        );
        window.location.reload();
      } else if (error.message && error.message.includes('reserved')) {
        alert(
          'Some seats have been reserved by another user. Please select different seats.'
        );
        dispatch(clearSelection());
      } else {
        alert('Failed to reserve seats. Please try again.');
        dispatch(clearSelection());
      }
    } finally {
      setPendingReservation(false);
    }
  };

  const handleClearSelection = async () => {
    if (currentReservation) {
      try {
        await dispatch(
          releaseReservation({
            eventId: event._id,
            reservationId: currentReservation.reservationId,
          })
        ).unwrap();
      } catch (error) {
        console.error('Failed to release reservation:', error);
      }
    }
    dispatch(clearSelection());
  };

  const getSeatStatus = (seat, seatId) => {
    // Priority 1: Check if explicitly selected in current session (this drives visual state)
    const isSelected = selectedSeats.includes(seatId);
    if (isSelected) return 'selected';

    // Priority 2: Check if reserved by current user
    const isReservedByUser = currentReservation?.seatIds.includes(seatId);
    if (isReservedByUser) return 'selected';

    // Priority 3: Check backend seat status (from seatingLayout)
    if (seat.status === 'occupied') return 'occupied';
    if (seat.status === 'disabled') return 'disabled';

    // Priority 4: Check if reserved by another user
    if (seat.reservedBy && seat.reservedUntil > new Date()) return 'reserved';

    // Default: available
    return 'available';
  };

  const totalSeats = seatingLayout.reduce(
    (total, row) => total + (row.seats?.length || 0),
    0
  );



  return (
    <div className="space-y-4">
      {/* Top controls - compact */}
      <div className="flex items-center justify-end">
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
              disabled={isLoading}
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
                  key={rowIndex}
                  className="flex items-center justify-center space-x-2"
                >
                  {/* Row label */}
                  <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                    {row.rowLabel}
                  </div>

                  {/* Seats */}
                  <div className="flex space-x-1">
                    {(row.seats || []).map((seat, seatIndex) => {
                      // Generate consistent seat ID
                      const seatId = generateSeatId(seat, row, seatIndex);
                      const seatWithId = { ...seat, seatId };

                      return (
                        <SeatButton
                          key={seatId}
                          seat={seatWithId}
                          row={row}
                          isSelected={selectedSeats.includes(seatId)}
                          isReservedByUser={currentReservation?.seatIds.includes(
                            seatId
                          )}
                          onClick={() =>
                            handleSeatClick(
                              seatId,
                              getSeatStatus(seatWithId, seatId)
                            )
                          }
                          disabled={isLoading || pendingReservation}
                          userId={userId}
                        />
                      );
                    })}
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
        {(isLoading || pendingReservation) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                {pendingReservation ? 'Reserving seats...' : 'Loading...'}
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
            />
          )}
        </div>
      )}

      {/* Venue stats */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>
          Venue capacity: {totalSeats} seats • {event.venue}
        </p>
      </div>
      {/* Socket connection status */}
      <div className="fixed bottom-4 left-4 flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-lg border">
        <div
          className={`w-3 h-3 rounded-full ${
            socket.connected ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`}
        ></div>
        <span className="text-xs text-gray-600">
          {socket.connected ? 'Live updates active' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
};

export default SeatMapSelection;
