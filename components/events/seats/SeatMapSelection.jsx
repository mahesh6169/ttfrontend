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
  fetchSeatAvailability,
  selectSeat,
  deselectSeat,
  selectHasActiveReservation,
  selectReservationTimeLeft,
} from '@/store/slices/events/seatSelectionSlice';
import SeatButton from './SeatButton';
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

  // Handles automatic reservation release when the timer expires, with fallback to clear selection.
  const handleTimerExpire = useCallback(() => {
if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
      dispatch(
        releaseReservation({
          eventId: eventId,
          seatIds: currentReservation.seatIds,
          sessionId: currentReservation.sessionId || sessionId,
        })
      )
        .then(() => {
})
        .catch((error) => {
          console.error('❌ Failed to release expired reservation:', error);
        });
    } else {
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


  // Automatically reserves seats when user selects exactly the required number of seats.
  useEffect(() => {
    const shouldAutoReserve =
      selectedSeats.length > 0 &&
      selectedSeats.length === requiredSeats &&
      !currentReservation &&
      !pendingReservation &&
      !isLoading;

    if (shouldAutoReserve) {
handleReserveSeats();
    }
  }, [
    selectedSeats,
    requiredSeats,
    currentReservation,
    pendingReservation,
    isLoading,
  ]);

  // Automatically releases reservation when user deselects seats below the required count.
  useEffect(() => {
    const shouldAutoRelease =
      selectedSeats.length < requiredSeats && // Less than required seats
      selectedSeats.length >= 0 && // Valid count
      currentReservation && // Has active reservation
      currentReservation.seatIds && // Has reserved seats
      currentReservation.seatIds.length > 0 && // Not empty
      !pendingReservation && // Not currently processing reservation
      !pendingAutoRelease && // ✅ NEW: Not currently processing auto-release
      !isLoading; // Not loading

    if (shouldAutoRelease) {
      console.log(
        '🔓 Auto-releasing reservation due to incomplete selection:',
        {
          selectedSeats: selectedSeats.length,
          required: requiredSeats,
          reservedSeats: currentReservation.seatIds,
        }
      );
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

  // Handles seat selection/deselection with validation for availability, limits, and loading states.
const handleSeatClick = (seatId, seatStatus) => {
  // Prevent selection if loading or seat is unavailable
  if (isLoading || pendingReservation || pendingAutoRelease) return;

  if (
    seatStatus === 'booked' ||
    seatStatus === 'disabled' ||
    seatStatus === 'reserved'
  ) return;

  // Check if seat is being held by another user
  if (seatStatus === 'selected-by-other') return;

  const isCurrentlySelected = selectedSeats.includes(seatId);

  // Validate selection limit
  if (!isCurrentlySelected && selectedSeats.length >= requiredSeats) {
    alert(
      selectedSeats.length === requiredSeats
        ? `You have selected all ${requiredSeats} required seats. Deselect a seat first if you want to choose a different one.`
        : `You can only select ${requiredSeats} seat${
            requiredSeats !== 1 ? 's' : ''
          } total. Please deselect some seats first.`
    );
    return;
  }

  // Validate seat exists in layout
  const seatDetails = findSeatInLayout(seatId);
  if (!seatDetails) {
    alert('This seat is no longer available. Please refresh the page.');
    return;
  }

  // ✅ SINGLE CLEAR LOG
  console.log(`🎯 SeatMapSelection: Seat clicked: ${seatId} | Status: ${seatStatus}`);

  // Proceed with selection or deselection
  if (isCurrentlySelected) {
    dispatch(deselectSeat(seatId));
    console.log(`🗑️ SeatMapSelection:  called deslect for seat ${seatId}`);
  } else {
    dispatch(selectSeat(seatId));
    console.log(`✅ SeatMapSelection: called selectSeat for seat ${seatId}`);
  }
};


  // Utility function to locate seat details within the seating layout structure.
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

  // Manages automatic reservation release with loading state and error handling.
  const handleAutoRelease = async () => {
    if (
      !currentReservation?.seatIds ||
      currentReservation.seatIds.length === 0
    ) {
      console.log('🔓 No active reservation to auto-release');
      dispatch(clearSelection()); // Just clear locally
      return;
    }

    // ✅ NEW: Set loading state for auto-release
    setPendingAutoRelease(true);
    console.log(
      '🔓 Starting auto-release process for reservation:',
      currentReservation.reservationId
    );

    try {
      const releaseData = {
        eventId: eventId,
        seatIds: currentReservation.seatIds,
        sessionId: currentReservation.sessionId || sessionId,
      };

      await dispatch(releaseReservation(releaseData)).unwrap();
} catch (error) {
      console.error('❌ Auto-release failed:', error);

      // Enhanced error handling
      if (error.message && error.message.includes('not found')) {
dispatch(clearSelection());
      } else {
        console.error(
          '🚨 Unexpected auto-release error, may need manual intervention'
        );
      }
    } finally {
      // ✅ NEW: Always clear loading state
      setPendingAutoRelease(false);
    }
  };

  // Handles manual seat reservation with comprehensive validation and error messaging.
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0 || pendingReservation) {
return;
    }

    // Validate seat count matches ticket count
    if (selectedSeats.length !== requiredSeats) {
      const message = `Please select exactly ${requiredSeats} seat${
        requiredSeats !== 1 ? 's' : ''
      } for your ${requiredSeats} ticket${
        requiredSeats !== 1 ? 's' : ''
      }. Currently selected: ${selectedSeats.length}`;
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
const reservationData = {
        eventId: eventId,
        seatIds: selectedSeats,
        sessionId: sessionId || `web_${Date.now()}`,
        ticketTypeId: null, // Add if needed for specific ticket types
      };

      const result = await dispatch(reserveSeats(reservationData)).unwrap();
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

// Clears selected seats and releases any active reservations when user manually clears selection.
  const handleClearSelection = async () => {
    if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
      console.log('🔓 Manually releasing current reservation:', {
        reservationId: currentReservation.reservationId,
        seatCount: currentReservation.seatIds.length,
        seatsToRelease: currentReservation.seatIds,
      });

      try {
        await dispatch(
          releaseReservation({
            eventId: eventId,
            seatIds: currentReservation.seatIds,
            sessionId: currentReservation.sessionId || sessionId,
          })
        ).unwrap();
      } catch (error) {
        console.error('❌ Failed to release reservation manually:', error);
        // Continue with clearing selection even if release fails
      }
    } else {
      console.log('ℹ️ No active reservation to release, just clearing selection');
    }

    dispatch(clearSelection());
  };

  // Determines seat status (selected, reserved, booked, etc.) based on user selection and backend data.
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

  // Renders error state with user-friendly message and refresh option when seat loading fails.
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
                            isReservedByUser={currentReservation?.seatIds?.includes(
                              seatId
                            )}
                            onClick={() => handleSeatClick(seatId, seatStatus)}
                            disabled={
                              isLoading ||
                              pendingReservation ||
                              pendingAutoRelease
                            } // ✅ ENHANCED: Include auto-release loading
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
                {pendingAutoRelease
                  ? 'Releasing seats...'
                  : pendingReservation
                  ? 'Reserving seats...'
                  : 'Loading...'}
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
    pauseWhenNavigating={true}  // ✅ NEW: Pause timer during navigation
  />
)}
        </div>
      )}
    </div>
  );
}

export default SeatMapSelection;
