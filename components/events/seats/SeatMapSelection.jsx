// components/events/seats/SeatMapSelection.jsx

'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';
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
   selectReserveError,
  clearReserveError,
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
  } = useSelector((state) => state.seatSelection);

  const reserveError = useSelector(selectReserveError);

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
        .then(() => {})
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
  const [localSelectionTimer, setLocalSelectionTimer] = useState(null);
  
  const [showReserveErrorModal, setShowReserveErrorModal] = useState(false);

  // ✅ NEW: Track scroll position to prevent jump on re-render
  const scrollContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollRestoreTimeoutRef = useRef(null);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce(
    (sum, qty) => sum + qty,
    0
  );

  

  // ✅ ENHANCED: Better scroll position preservation using useLayoutEffect
  useLayoutEffect(() => {
    if (scrollContainerRef.current && scrollPosition > 0) {
      // Clear any pending scroll restore
      if (scrollRestoreTimeoutRef.current) {
        clearTimeout(scrollRestoreTimeoutRef.current);
      }

      // Use requestAnimationFrame for smooth restoration
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollPosition;
        }
      });
    }
  });



  // ✅ ENHANCED: Debounced scroll position saving
  const handleScroll = useCallback((e) => {
    const newScrollPosition = e.target.scrollLeft;

    // Clear any pending scroll restore to avoid conflicts
    if (scrollRestoreTimeoutRef.current) {
      clearTimeout(scrollRestoreTimeoutRef.current);
    }

    // Debounce scroll position updates
    scrollRestoreTimeoutRef.current = setTimeout(() => {
      setScrollPosition(newScrollPosition);
    }, 50);
  }, []);

  // ✅ ENHANCED: Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollRestoreTimeoutRef.current) {
        clearTimeout(scrollRestoreTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup local timer on unmount
useEffect(() => {
  return () => {
    if (localSelectionTimer) {
      clearTimeout(localSelectionTimer);
    }
  };
}, []);

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

  // Local timer to clear partial selections after 2 minutes of inactivity
useEffect(() => {
  // Clear any existing timer
  if (localSelectionTimer) {
    clearTimeout(localSelectionTimer);
    setLocalSelectionTimer(null);
  }

  // Only start timer for partial selections (not complete or empty)
  const shouldStartLocalTimer =
    selectedSeats.length > 0 &&
    selectedSeats.length < requiredSeats &&
    !currentReservation &&
    !pendingReservation &&
    !isLoading;

  if (shouldStartLocalTimer) {
    console.log(`⏰ Starting local timer for partial selection: ${selectedSeats.length}/${requiredSeats} seats`);
    
    const timerId = setTimeout(() => {
      console.log('🧹 Local timer expired - clearing partial selection');
      dispatch(clearSelection());
      setLocalSelectionTimer(null);
    }, 30 * 1000); // 30 seconds  ← CHANGE THIS LINE

    setLocalSelectionTimer(timerId);
  }

  // Cleanup function
  return () => {
    if (localSelectionTimer) {
       console.log('🔄 Clearing existing local timer');
      clearTimeout(localSelectionTimer);
       setLocalSelectionTimer(null);
    }
  };
}, [selectedSeats.length, requiredSeats, currentReservation, pendingReservation, isLoading, dispatch]);

  // Handles seat selection/deselection with validation for availability, limits, and loading states.
  const handleSeatClick = (seatId, seatStatus) => {
    // Prevent selection if loading or seat is unavailable
    if (isLoading || pendingReservation || pendingAutoRelease) return;

    if (
      seatStatus === 'booked' ||
      seatStatus === 'disabled' ||
      seatStatus === 'reserved'
    )
      return;

    // Check if seat is being held by another user
    if (seatStatus === 'selected-by-other') return;

    const isCurrentlySelected = selectedSeats.includes(seatId);

    // Validate selection limit
    if (!isCurrentlySelected && selectedSeats.length >= requiredSeats) {
       setShowReserveErrorModal(true);
      return;
    }

    // Validate seat exists in layout
    const seatDetails = findSeatInLayout(seatId);
    if (!seatDetails) {
       setShowReserveErrorModal(true);
      return;
    }

    // ✅ SINGLE CLEAR LOG
    console.log(
      `🎯 SeatMapSelection: Seat clicked: ${seatId} | Status: ${seatStatus}`
    );

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



 

  // Handles reserve error modal OK button
  const handleReserveErrorOk = () => {
    setShowReserveErrorModal(false);
    dispatch(clearReserveError());
    dispatch(clearSelection());
    router.push(`/events/seats/${eventId}`);
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

  // ✅ ENHANCED: Handles manual seat reservation with scroll position preservation
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0 || pendingReservation) {
      return;
    }

    // ✅ SAFETY NET: Check if seats are still available before API call
  const conflictSeats = selectedSeats.filter(seatId => {
    const seatDetails = findSeatInLayout(seatId);
    return seatDetails?.seat.status === 'selected' && 
           seatDetails?.seat.reservedBy?.toString() !== userId?.toString();
  });
  
  if (conflictSeats.length > 0) {
    console.log('🚨 Seats taken by others:', conflictSeats);
    dispatch(clearSelection());
    setShowReserveErrorModal(true);
    return; // STOP - no API call
  }

    // ✅ SAVE: Capture current scroll position before state changes
    const currentScrollPosition = scrollContainerRef.current?.scrollLeft || 0;
    if (currentScrollPosition > 0) {
      setScrollPosition(currentScrollPosition);
    }

    // Validate seat count matches ticket count
    if (selectedSeats.length !== requiredSeats) {
      setShowReserveErrorModal(true);
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
      setShowReserveErrorModal(true);
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

      // ✅ RESTORE: Restore scroll position after successful reservation
      setTimeout(() => {
        if (scrollContainerRef.current && currentScrollPosition > 0) {
          scrollContainerRef.current.scrollLeft = currentScrollPosition;
        }
      }, 100);
    } catch (error) {
      console.error('❌ Failed to reserve seats:', error);
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
      console.log(
        'ℹ️ No active reservation to release, just clearing selection'
      );
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

  // Handle reserve errors
  useEffect(() => {
    console.log('🔍 Reserve error useEffect triggered:', { reserveError, showReserveErrorModal });
    if (reserveError) {
      console.log('🚨 Reserve error detected, showing modal:', reserveError);
      setShowReserveErrorModal(true);
    }
  }, [reserveError]);

  return (
    <div className="space-y-3">
      {/* Compact Status Bar - Responsive for mobile */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:px-4 sm:py-2.5">
        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Title */}
            <h3 className="text-sm font-semibold text-gray-900">Select Your Seats</h3>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            {/* Selection count - always visible as guidance */}
            <div className="text-sm font-medium text-gray-700">
              {selectedSeats.length}/{requiredSeats} selected
            </div>
            
            {/* Show seat numbers and timer only when seats are selected */}
            {selectedSeats.length > 0 && (
              <>
                {/* Seat numbers */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="truncate max-w-[200px]">{selectedSeats.join(', ')}</span>
                </div>
                
                {/* Timer - only show when reservation is active */}
                {currentReservation?.reservedUntil && (
                  <>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <SeatReservationTimer
                      expiryTime={currentReservation.reservedUntil}
                      onExpire={handleTimerExpire}
                      eventId={eventId}
                      pauseWhenNavigating={true}
                      compact={true}
                    />
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Toggle layout button */}
            {event.seatingLayoutImage?.url && (
              <button
                onClick={() => setShowSeatingImage(!showSeatingImage)}
                className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                {showSeatingImage ? 'Hide' : 'Show'} Layout
              </button>
            )}
            
            {/* Clear button - only when seats selected */}
            {selectedSeats.length > 0 && (
              <button
                onClick={handleClearSelection}
                disabled={isLoading || pendingReservation}
                className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout - Stacked */}
        <div className="sm:hidden">
          {/* Title and controls row */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Select Your Seats</h3>
            <div className="flex items-center gap-2">
              {/* Toggle layout button */}
              {event.seatingLayoutImage?.url && (
                <button
                  onClick={() => setShowSeatingImage(!showSeatingImage)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {showSeatingImage ? 'Hide' : 'Show'} Layout
                </button>
              )}
              
              {/* Clear button - only when seats selected */}
              {selectedSeats.length > 0 && (
                <button
                  onClick={handleClearSelection}
                  disabled={isLoading || pendingReservation}
                  className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Selection status */}
          <div className="space-y-1.5">
            {/* Selection count */}
            <div className="text-sm font-medium text-gray-700">
              {selectedSeats.length}/{requiredSeats} selected
            </div>
            
            {/* Seat numbers - only when seats selected */}
            {selectedSeats.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="truncate">{selectedSeats.join(', ')}</span>
              </div>
            )}
            
            {/* Timer - only when reservation active */}
            {currentReservation?.reservedUntil && (
              <SeatReservationTimer
                expiryTime={currentReservation.reservedUntil}
                onExpire={handleTimerExpire}
                eventId={eventId}
                pauseWhenNavigating={true}
                compact={true}
              />
            )}
          </div>
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

      {/* ✅ MOBILE ENHANCED: Improved seat map with horizontal scrolling */}
      <div className="relative bg-white border border-gray-200 rounded-lg max-w-full mx-auto">
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
          <div>
            {/* ✅ MOBILE ENHANCED: Compact stage indicator */}
            <div className="text-center py-2 border-b border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50">
              <div className="inline-block bg-gray-800 text-white px-6 py-1.5 rounded text-xs font-semibold tracking-wider">
                STAGE
              </div>
            </div>

            {/* ✅ MOBILE ENHANCED: Horizontal scrollable seat container */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-hidden"
              onScroll={handleScroll}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 #F7FAFC',
                scrollBehavior: 'smooth',
              }}
            >
              <style jsx>{`
                .seat-container::-webkit-scrollbar {
                  height: 8px;
                }
                .seat-container::-webkit-scrollbar-track {
                  background: #f7fafc;
                  border-radius: 4px;
                }
                .seat-container::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 4px;
                }
                .seat-container::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}</style>

              <div className="seat-container min-w-max p-3 space-y-1">
                {seatingLayout.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}-${row.rowLabel}`}
                    className="flex items-center gap-1 min-w-max"
                  >
                    {/* Left row label - compact */}
                    <div className="w-6 text-center font-semibold text-gray-600 text-xs flex-shrink-0 sticky left-0 bg-white z-10 pr-1">
                      {row.rowLabel}
                    </div>

                    {/* Seats container - tighter spacing with section grouping */}
                    <div className="flex items-center gap-0.5 min-w-max px-1">
                      {(row.seats || [])
                        .reduce((acc, seat, seatIndex) => {
                          // Add section separator every 10 seats
                          if (seatIndex > 0 && seatIndex % 10 === 0) {
                            acc.push(
                              <div key={`separator-${seatIndex}`} className="w-2 h-8 flex items-center justify-center">
                                <div className="w-px h-6 bg-gray-300"></div>
                              </div>
                            );
                          }

                          // Use backend seatId - fail if not present
                          const seatId = seat.seatId;
                          if (!seatId) {
                            console.error(
                              '❌ Missing seatId for seat:',
                              seat,
                              'in row:',
                              row.rowLabel
                            );
                            return acc; // Skip rendering this seat
                          }

                          const seatStatus = getSeatStatus(seat, seatId);

                          acc.push(
                            <SeatButton
                              key={`${seatId}-${seatIndex}`}
                              seat={{ ...seat, seatId }}
                              row={row}
                              isSelected={selectedSeats.includes(seatId)}
                              isReservedByUser={currentReservation?.seatIds?.includes(
                                seatId
                              )}
                              onClick={() =>
                                handleSeatClick(seatId, seatStatus)
                              }
                              disabled={
                                isLoading ||
                                pendingReservation ||
                                pendingAutoRelease
                              }
                              userId={userId}
                            />
                          );

                          return acc;
                        }, [])}
                    </div>

                    {/* Right row label - compact */}
                    <div className="w-6 text-center font-semibold text-gray-600 text-xs flex-shrink-0 sticky right-0 bg-white z-10 pl-1">
                      {row.rowLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll hint for mobile - More subtle */}
            <div className="md:hidden bg-gray-50 px-4 py-1.5 text-center">
              <div className="text-[10px] text-gray-500">
                ← Swipe to view all seats →
              </div>
            </div>
          </div>
        )}

        {/* ✅ MOBILE ENHANCED: Better loading overlay */}
        {(isLoading || pendingReservation || pendingAutoRelease) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 font-medium">
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



      {/* Reserve Error Modal */}
      {console.log('🔍 Modal render check:', { showReserveErrorModal, reserveError })}
      {showReserveErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
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
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Booking Conflict has Occurred
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                 The seats you selected are no longer available. Another user may have selected them. Please choose different seats.
              </p>
              <button
                onClick={handleReserveErrorOk}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}      
    </div>
    
  );
};

export default SeatMapSelection;