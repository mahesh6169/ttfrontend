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
import { FaCheckCircle } from 'react-icons/fa';
import axios from '@/utils/axiosConfig';

import SeatButton from './SeatButton';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Selection is gated below this scale (seats too small to tap comfortably). Fitted view of a big hall
// sits below it; a normal-sized hall fits at ~1 and stays selectable. Tunable in the feel-pass.
const SELECT_THRESHOLD = 0.6;
const MAX_SCALE = 2.5;

const SeatMapSelectionNoRedux = forwardRef(({ 
  event, 
  ticketRequirement, // { total: 4, types: { adult: 2, child: 2 } }
  eventId,
  userId,
  existingReservation,  // Reservation from tickets page
  onSeatsSelected,      // Callback when all seats selected / cleared
  onSelectionChange,    // Display-only: fires on every selection change (page shows the count)
  hasVenueLayout,       // whether the event has a venue-layout image
  onVenueClick,         // opens the venue-layout fullscreen (state lives on the page)
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

  // Zoom/pan (react-zoom-pan-pinch) replaces the old drag-to-scroll.
  const viewportRef = useRef(null);   // the fixed map viewport (measured for fit)
  const contentRef = useRef(null);    // the hall content (natural size, unaffected by transform)
  const zoomApiRef = useRef(null);    // TransformWrapper instance
  const [scale, setScale] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [everZoomed, setEverZoomed] = useState(false);
  const anchorYRef = useRef(0); // screen-y of the hall's centre; the +/- controls zoom toward it
  const transformRef = useRef({ scale: 1, positionX: 0, positionY: 0 }); // last-known transform
  const canSelect = scale >= SELECT_THRESHOLD;

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

  // Update selected seats when existingReservation changes
  useEffect(() => {
    if (existingReservation && existingReservation.seatIds && existingReservation.seatIds.length > 0) {
      console.log('🔄 [SeatMap] Updating selected seats from reservation:', existingReservation.seatIds);
      setSelectedSeats(existingReservation.seatIds);
    }
  }, [existingReservation]);

  // Display-only: keep the parent's live count in sync on every selection change.
  useEffect(() => {
    if (onSelectionChange) onSelectionChange(selectedSeats);
  }, [selectedSeats, onSelectionChange]);

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

    // Zoom-gated: below the tap-size threshold, a tap does not select (it only pans/zooms). The hint
    // chip tells the buyer to zoom in first. At/above the threshold, selection behaves as before.
    if (!canSelect) return;

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

  // Panning + zooming are handled by react-zoom-pan-pinch (see the render). A drag pans; a click (no
  // movement) selects - the library's own move threshold distinguishes them.

  // Fit the whole hall into the viewport on load (and when the layout changes). offsetWidth/Height are
  // layout sizes unaffected by the CSS transform, so they give the content's natural dimensions.
  const fitToView = useCallback(() => {
    const vp = viewportRef.current;
    const content = contentRef.current;
    const api = zoomApiRef.current;
    if (!vp || !content || !api) return;
    const cw = content.offsetWidth || 1;
    const ch = content.offsetHeight || 1;
    const vw = vp.clientWidth;
    // The container's maximum height (viewport-relative); the container shrinks to the hall below this.
    const maxH = Math.round((window.innerHeight || 800) * (window.innerWidth < 640 ? 0.6 : 0.7));
    // Fill the width (small margin) rather than floating small; height overflow is pannable.
    const fit = Math.min((vw * 0.96) / cw, 1);
    const safeFit = Number.isFinite(fit) && fit > 0 ? fit : 1;
    const fittedH = ch * safeFit;
    const x = Math.max(0, (vw - cw * safeFit) / 2); // horizontally centred = the shared centreline
    const y = 8; // stage top-aligned; the space below the hall is deliberate zoom room (item 21)
    anchorYRef.current = y + fittedH / 2; // the +/- controls zoom toward the hall, not the empty room
    setFitScale(safeFit);
    setScale(safeFit);
    api.setTransform(x, y, safeFit, 0);
    transformRef.current = { scale: safeFit, positionX: x, positionY: y };
  }, []);

  // Zoom by the +/- controls: keep the hall anchored (react-zoom-pan-pinch's own zoomIn zooms toward the
  // container centre, which is empty zoom room below a short top-aligned hall - that would push the seats
  // out of view). Anchoring on the hall centre keeps the middle seats put as you zoom in.
  const zoomBy = useCallback((delta) => {
    const api = zoomApiRef.current;
    const vp = viewportRef.current;
    if (!api || !vp) return;
    const ts = transformRef.current;
    const oldScale = ts.scale || 1;
    const newScale = Math.max(fitScale, Math.min(MAX_SCALE, oldScale + delta));
    if (newScale === oldScale) return;
    const px = vp.clientWidth / 2;
    const py = anchorYRef.current || vp.clientHeight / 2;
    const k = newScale / oldScale;
    const newX = px - (px - (ts.positionX || 0)) * k;
    const newY = py - (py - (ts.positionY || 0)) * k;
    api.setTransform(newX, newY, newScale, 150);
    transformRef.current = { scale: newScale, positionX: newX, positionY: newY };
    setScale(newScale);
    if (newScale >= SELECT_THRESHOLD) setEverZoomed(true);
  }, [fitScale]);

  useLayoutEffect(() => {
    if (seatingLayout.length > 0 && !isLoading) {
      // Wait a frame so the content has laid out before measuring.
      const id = requestAnimationFrame(fitToView);
      return () => cancelAnimationFrame(id);
    }
  }, [seatingLayout, isLoading, fitToView]);

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
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Consistent scrollbar styling */
        .seat-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .seat-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .seat-container::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
          transition: none;
        }
        
        .seat-container::-webkit-scrollbar-thumb:hover {
          background: #cbd5e0;
        }
        
        .seat-container::-webkit-scrollbar-thumb:active {
          background: #cbd5e0;
        }
      `}</style>
      {/* Loading State */}
      {(!socketConnected || !socketJoinedRoom || isLoading) && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <AiOutlineHourglass className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-600">Loading seats...</p>
          </div>
        </div>
      )}
      
      {/* Selection count + reservation timer now live at page level (SeatSelectionPage) */}

      {/* Seat Map - one zoomable/pannable canvas (react-zoom-pan-pinch). The old drag-to-scroll and
          per-row overflow are gone; the whole hall fits on load, then pinch/wheel/drag to explore. */}
      <div
        ref={viewportRef}
        data-testid="seat-map-viewport"
        className={`relative border border-slate-200 rounded-md sm:rounded-lg max-w-full mx-auto h-[65vh] overflow-hidden bg-slate-50 ${
          (isLoading || pendingOperation) ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {seatingLayout.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-500">No seating layout available</p>
          </div>
        ) : (
          <TransformWrapper
            ref={zoomApiRef}
            minScale={fitScale}
            maxScale={MAX_SCALE}
            initialScale={1}
            limitToBounds={false}
            doubleClick={{ mode: 'zoomIn', step: 0.7 }}
            wheel={{ step: 0.05 }}
            panning={{ velocityDisabled: true }}
            onTransformed={(_r, s) => { transformRef.current = { scale: s.scale, positionX: s.positionX, positionY: s.positionY }; setScale(s.scale); if (s.scale >= SELECT_THRESHOLD) setEverZoomed(true); }}
          >
            {() => (
              <>
                {/* Fixed chrome - stays put outside the zoom layer */}
                {hasVenueLayout && (
                  <button type="button" onClick={onVenueClick} className="absolute left-2 top-2 z-20 rounded bg-white/90 px-2 py-1 text-xs font-medium text-teal-700 shadow border border-slate-200 hover:text-teal-800">Venue Layout</button>
                )}
                <div className="absolute right-2 top-2 z-20 flex flex-col gap-1">
                  <button type="button" onClick={() => zoomBy(0.3)} aria-label="Zoom in" className="h-8 w-8 rounded-full bg-white shadow border border-slate-200 text-slate-700">+</button>
                  <button type="button" onClick={() => zoomBy(-0.3)} aria-label="Zoom out" className="h-8 w-8 rounded-full bg-white shadow border border-slate-200 text-slate-700">-</button>
                  <button type="button" onClick={fitToView} aria-label="Fit view" className="h-8 w-8 rounded-full bg-white shadow border border-slate-200 text-[10px] text-slate-700">Fit</button>
                </div>
                {!canSelect && !everZoomed && (
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-white shadow" data-testid="zoom-hint">
                    Pinch or double-tap to zoom in and pick seats
                  </div>
                )}
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-max">
                  <div ref={contentRef} className="px-4 py-4">
                    {/* STAGE anchors the hall: full-width bar at the top, zooms/pans with the map */}
                    <div data-testid="stage-bar" className="mb-4 w-full rounded bg-slate-800 py-2 text-center text-xs sm:text-sm font-semibold tracking-[0.3em] text-white">STAGE</div>
                {seatingLayout.map((row, rowIndex) => {
                  return (
                    <div
                      key={`row-${rowIndex}-${row.rowLabel}`}
                      className="flex items-center mb-2 sm:mb-3"
                    >
                      {/* Left row label (one per end; no sticky - it travels with the row under zoom/pan) */}
                      <div className="w-8 sm:w-10 flex-shrink-0 text-center">
                        <span data-testid="row-label" className="font-bold text-slate-700 text-xs sm:text-sm px-1 py-0.5 rounded inline-block">
                          {row.rowLabel}
                        </span>
                      </div>

                      {/* Seats - one shared centreline, uniform rhythm (amphitheater padding retired) */}
                      <div className="flex-1 flex justify-center px-2">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          {(row.seats || []).map((seat, seatIndex) => {
                            const seatId = seat.seatId;
                            if (!seatId) return null;

                            const seatStatus = getSeatStatus(seat, seatId);
                            // Cosmetic walkway "after seat N" (1-based). A fixed-width empty spacer, no
                            // data, no handler, no key of its own - it just splits the row into blocks
                            // and rides along in the same horizontal scroll.
                            const hasWalkwayAfter = Array.isArray(row.walkwayPositions) && row.walkwayPositions.includes(seatIndex + 1);

                            return (
                              <React.Fragment key={`${seatId}-${seatIndex}`}>
                                <SeatButton
                                  seat={{ ...seat, seatId }}
                                  row={row}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isReservedByUser={false}
                                  onClick={() => handleSeatClick(seatId, seatStatus)}
                                  disabled={pendingOperation || isLoading}
                                  userId={userId}
                                />
                                {hasWalkwayAfter && (
                                  <div className="w-4 sm:w-6 shrink-0 self-stretch" aria-hidden="true" data-walkway="true" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Right row label */}
                      <div className="w-8 sm:w-10 flex-shrink-0 text-center">
                        <span data-testid="row-label" className="font-bold text-slate-700 text-xs sm:text-sm px-1 py-0.5 rounded inline-block">
                          {row.rowLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}

        {/* Loading overlay */}
        {(isLoading || pendingOperation) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-600 font-medium">
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
              
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
                Seat Selection Error
              </h3>
              
              <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4 lg:mb-6">
                {reserveErrorMessage}
              </p>
              
              <button
                onClick={() => {
                  setShowReserveErrorModal(false);
                  setReserveErrorMessage('');
                }}
                className="w-full bg-teal-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors"
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