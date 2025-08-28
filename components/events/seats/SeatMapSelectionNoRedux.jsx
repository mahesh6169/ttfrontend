// components/events/seats/SeatMapSelectionNoRedux.jsx
// Version without Redux - uses backend as source of truth

'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef
} from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineClock } from 'react-icons/hi';
import { AiOutlineHourglass } from 'react-icons/ai';
import axios from 'axios';

import SeatButton from './SeatButton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const SeatMapSelectionNoRedux = forwardRef(({ 
  event, 
  ticketRequirement, // { total: 4, types: { adult: 2, child: 2 } }
  eventId,
  userId,
  existingReservation,  // Reservation from tickets page
  onSeatsSelected,      // Callback when seats are selected
  socketConnected,
  socketJoinedRoom,
  onSocketUpdate
}, ref) => {
  const router = useRouter();

  // Local state instead of Redux
  const [seatingLayout, setSeatingLayout] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  // Use existing reservation from parent instead of local state
  const reservation = existingReservation;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingOperation, setPendingOperation] = useState(false);
  const [showReserveErrorModal, setShowReserveErrorModal] = useState(false);
  const [reserveErrorMessage, setReserveErrorMessage] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Refs
  const scrollContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Calculate required seats
  const requiredSeats = ticketRequirement?.total || 0;

  // Ensure session ID exists
  useEffect(() => {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  // Save reservation to sessionStorage when it changes
  useEffect(() => {
    if (reservation && reservation.seatIds) {
      const reservationData = {
        reservationId: reservation._id || reservation.reservationId,
        eventId: eventId,
        seatIds: reservation.seatIds,
        seats: reservation.seats,
        reservedUntil: reservation.reservedUntil || reservation.expiresAt,
        sessionId: reservation.sessionId,
        createdAt: reservation.createdAt,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem(`seatReservation_${eventId}`, JSON.stringify(reservationData));
    } else {
      // Clear reservation if none exists
      sessionStorage.removeItem(`seatReservation_${eventId}`);
    }
  }, [reservation, eventId]);

  // Check for existing reservation on mount
  useEffect(() => {
    const savedReservation = sessionStorage.getItem(`seatReservation_${eventId}`);
    if (savedReservation && !reservation) {
      try {
        const parsed = JSON.parse(savedReservation);
        // Check if reservation is still valid
        if (parsed.reservedUntil && new Date(parsed.reservedUntil) > new Date()) {
          console.log('Found valid reservation in sessionStorage:', parsed);
          // setReservation(parsed); // Using parent reservation
          setSelectedSeats(parsed.seatIds || []);
        } else {
          // Expired reservation in storage, clear it
          sessionStorage.removeItem(`seatReservation_${eventId}`);
        }
      } catch (error) {
        console.error('Error parsing saved reservation:', error);
        sessionStorage.removeItem(`seatReservation_${eventId}`);
      }
    }
  }, [eventId]);

  // Fetch seat data and user's reservation
  const fetchSeatData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch seat layout
      const seatResponse = await axios.get(
        `${API_BASE_URL}/events/${eventId}/seats`,
        { withCredentials: true }
      );
      
      if (seatResponse.data.success) {
        setSeatingLayout(seatResponse.data.seatingLayout || []);
      }

      // Use existing reservation passed from parent
      if (existingReservation && existingReservation.seatIds && existingReservation.seatIds.length > 0) {
        setSelectedSeats(existingReservation.seatIds);
      }

      setError(null);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Failed to fetch seat data:', err);
      setError('Failed to load seat data');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Expose fetchSeatData to parent via ref
  useImperativeHandle(ref, () => ({
    fetchSeatData
  }), [fetchSeatData]);

  // Initial load
  useEffect(() => {
    fetchSeatData();
  }, [fetchSeatData]);

  // REMOVED - We now notify parent only when all seats are selected or cleared
  // useEffect(() => {
  //   if (onSeatsSelected) {
  //     onSeatsSelected(selectedSeats);
  //   }
  // }, [selectedSeats, onSeatsSelected]);

  // REMOVED - Parent manages reservation now
  // useEffect(() => {
  //   if (onReservationChange) {
  //     onReservationChange(reservation);
  //   }
  // }, [reservation, onReservationChange]);

  // Poll for updates (reduced frequency when using sockets)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only poll if we haven't fetched recently (prevents excessive calls)
      const now = Date.now();
      if (now - lastFetchTime > 5000) {
        fetchSeatData();
      }
    }, 10000); // Poll every 10 seconds as backup
    return () => clearInterval(interval);
  }, [fetchSeatData, lastFetchTime]);


  // Hold individual seat (5 min timer)
  const holdSeat = async (seatId) => {
    try {
      console.log(`Attempting to hold seat: ${seatId}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/seats/hold`,
        { seatId },
        { 
          withCredentials: true,
          headers: {
            'x-session-id': sessionStorage.getItem('sessionId') || 'web'
          }
        }
      );
      
      if (response.data.success) {
        console.log(`Successfully held seat: ${seatId}`);
        return true;
      } else {
        console.log(`Failed to hold seat: ${seatId}`, response.data);
        return false;
      }
    } catch (error) {
      console.error('Failed to hold seat:', error);
      console.error('Hold seat error details:', {
        seatId,
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      return false;
    }
  };

  // Release individual seat hold
  const releaseSeatHold = async (seatId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/events/${eventId}/seats/hold`,
        {
          data: { seatId },
          withCredentials: true,
          headers: {
            'x-session-id': sessionStorage.getItem('sessionId') || 'web'
          }
        }
      );
    } catch (error) {
      console.error('Failed to release seat hold:', error);
    }
  };

  // DEPRECATED - Seat updates are now handled via parent component's onSeatsSelected callback
  // The parent component (seats page) manages the reservation and calls the proper
  // reservation API endpoints (/events/:id/reservation/:id/seats)

  // Handle seat click
  const handleSeatClick = async (seatId, seatStatus) => {
    if (pendingOperation || isLoading) return;

    if (seatStatus === 'booked' || seatStatus === 'disabled' || seatStatus === 'reserved') {
      return;
    }

    if (seatStatus === 'selected-by-other') {
      return;
    }

    const isCurrentlySelected = selectedSeats.includes(seatId);

    // Handle deselection
    if (isCurrentlySelected) {
      // Release the hold
      await releaseSeatHold(seatId);
      const newSelectedSeats = selectedSeats.filter(id => id !== seatId);
      setSelectedSeats(newSelectedSeats);
      
      // Update reservation to remove this seat
      if (onSeatsSelected) {
        await onSeatsSelected(newSelectedSeats);
      }
      return;
    }

    // Handle selection
    if (selectedSeats.length >= requiredSeats) {
      setReserveErrorMessage(`You can only select ${requiredSeats} seats`);
      setShowReserveErrorModal(true);
      return;
    }

    // Hold the seat
    setPendingOperation(true);
    const holdSuccess = await holdSeat(seatId);
    setPendingOperation(false);

    if (!holdSuccess) {
      setReserveErrorMessage('This seat is no longer available');
      setShowReserveErrorModal(true);
      await fetchSeatData(); // Refresh to show latest state
      return;
    }

    const newSelectedSeats = [...selectedSeats, seatId];
    setSelectedSeats(newSelectedSeats);

    // Update reservation with new seat selection
    if (onSeatsSelected) {
      try {
        await onSeatsSelected(newSelectedSeats);
      } catch (error) {
        console.error('Failed to update reservation with seats:', error);
        // On error, release the hold and revert
        await releaseSeatHold(seatId);
        setSelectedSeats(selectedSeats);
        await fetchSeatData();
      }
    }
  };


  // Get seat status based on backend data
  const getSeatStatus = (seat, seatId) => {
    // Check backend status first
    if (seat.status === 'booked') return 'booked';
    if (seat.status === 'disabled') return 'disabled';
    if (seat.status === 'reserved') return 'reserved';

    // Check if this seat is selected by current user
    if (seat.status === 'selected' && seat.reservedBy && seat.reservedUntil) {
      const isExpired = new Date(seat.reservedUntil) <= new Date();
      
      if (!isExpired) {
        if (seat.reservedBy.toString() === userId?.toString()) {
          return 'selected'; // User's own selection
        } else {
          return 'selected-by-other'; // Someone else's selection
        }
      }
    }

    // For optimistic updates during hold
    if (selectedSeats.includes(seatId) && seat.status === 'available') {
      return 'selected';
    }

    return 'available';
  };

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollPosition(e.target.scrollLeft);
  }, []);

  // Restore scroll position
  useLayoutEffect(() => {
    if (scrollContainerRef.current && scrollPosition > 0) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollPosition;
        }
      });
    }
  });

  // Check if can proceed to checkout
  const canProceed = reservation && selectedSeats.length === requiredSeats;

  // Handle socket updates from parent
  useEffect(() => {
    if (socketConnected && socketJoinedRoom) {
      // When socket is ready, fetch latest data
      const now = Date.now();
      if (now - lastFetchTime > 1000) { // Prevent rapid fetches
        fetchSeatData();
      }
    }
  }, [socketConnected, socketJoinedRoom, fetchSeatData, lastFetchTime]);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Loading State */}
      {(!socketConnected || !socketJoinedRoom || isLoading) && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <AiOutlineHourglass className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading seats...</p>
          </div>
        </div>
      )}
      
      {/* Status Bar */}
      <div className="border-t border-gray-200 pt-2 sm:pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Selection count */}
            <div className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              {selectedSeats.length}/{requiredSeats} Seats Selected
            </div>
            
            {/* Show seat numbers when seats are selected */}
            {selectedSeats.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 min-w-0">
                <span className="truncate">{selectedSeats.join(', ')}</span>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Seat Map */}
      <div className={`relative border border-gray-200 rounded-md sm:rounded-lg max-w-full mx-auto ${
        (isLoading || pendingOperation) ? 'opacity-50 pointer-events-none' : ''
      }`}>
        {seatingLayout.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No seating layout available</p>
          </div>
        ) : (
          <div>
            {/* Stage indicator */}
            <div className="text-center py-3 sm:py-4 mb-4">
              <div className="inline-block bg-gray-800 text-white px-8 sm:px-16 py-2 sm:py-3 rounded text-xs sm:text-sm font-semibold tracking-wider">
                STAGE
              </div>
            </div>

            {/* Scrollable seat container */}
            <div
              ref={scrollContainerRef}
              className="overflow-auto pb-3"
              onScroll={handleScroll}
            >
              <div className="seat-container flex flex-col gap-2 sm:gap-3 px-2 sm:px-4 pb-2 sm:pb-4 min-w-fit mx-auto">
                {seatingLayout.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}-${row.rowLabel}`}
                    className="flex items-center gap-1.5 sm:gap-3 justify-center"
                  >
                    {/* Row label */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700 text-xs sm:text-sm border-2 border-gray-300 shadow-sm">
                      {row.rowLabel}
                    </div>

                    {/* Seats in row */}
                    <div className="flex gap-1 sm:gap-1.5">
                      {(row.seats || []).map((seat, seatIndex) => {
                        const seatId = seat.seatId;
                        if (!seatId) return null;

                        const seatStatus = getSeatStatus(seat, seatId);

                        return (
                          <SeatButton
                            key={`${seatId}-${seatIndex}`}
                            seat={{ ...seat, seatId }}
                            row={row}
                            isSelected={selectedSeats.includes(seatId)}
                            isReservedByUser={false}
                            onClick={() => handleSeatClick(seatId, seatStatus)}
                            disabled={pendingOperation || isLoading}
                            userId={userId}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(isLoading || pendingOperation) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 font-medium">
                {pendingOperation ? 'Processing...' : 'Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Modal */}
      {showReserveErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 lg:p-6 max-w-xs sm:max-w-sm mx-auto shadow-xl">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-red-600"
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
              
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                Seat Selection Error
              </h3>
              
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 lg:mb-6">
                {reserveErrorMessage}
              </p>
              
              <button
                onClick={() => {
                  setShowReserveErrorModal(false);
                  setReserveErrorMessage('');
                }}
                className="w-full bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SeatMapSelectionNoRedux.displayName = 'SeatMapSelectionNoRedux';

export default SeatMapSelectionNoRedux;