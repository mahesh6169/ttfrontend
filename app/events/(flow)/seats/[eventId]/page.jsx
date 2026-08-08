// app/events/seats/[eventId]/page.jsx
// New version without Redux for seat management

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';
import SeatMapWithSocket from '@/components/events/seats/SeatMapWithSocket';
import SeatLegend from '@/components/events/seats/SeatLegend';
import ReservationTimer from '@/components/events/ReservationTimer';
import { FaShoppingCart, FaTimes } from 'react-icons/fa';
import { MdEventSeat } from 'react-icons/md';

// Helper function to get optimized image URL (same pattern as SingleEventCard)
const getOptimizedImageUrl = (imageObj) => {
  if (!imageObj) return null;
  if (typeof imageObj === 'string') return imageObj;
  
  // Use pre-optimized URLs from backend
  if (imageObj.optimizedUrls) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? imageObj.optimizedUrls.mobile : imageObj.optimizedUrls.desktop;
  }
  
  // Fallback to original URL
  return imageObj.url || null;
};

const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Redux state - only for event data
  const { user } = useSelector((state) => state.user);
  const { selectedEvent, status: eventStatus } = useSelector((state) => state.events);

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [reservation, setReservation] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [ticketTotals, setTicketTotals] = useState({ totalQuantity: 0, totalPrice: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Calculate ticket requirement
  const ticketRequirement = {
    total: ticketTotals?.totalQuantity || 0,
    types: selectedTickets?.reduce((acc, ticket) => {
      acc[ticket.ticketTypeId] = ticket.quantity;
      return acc;
    }, {}) || {}
  };

  // Fetch event data
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
  }, [eventId, dispatch]);

  // Fetch the reservation and derive the LIVE required-seat count. Reused on mount and whenever the
  // page regains focus, so the count always reflects the current reservation - the buyer may have
  // changed their ticket quantity on the tickets page since this page was last shown
  // (featureplans/fix-events-seatcount-sync.md D1).
  const fetchReservation = useCallback(async () => {
    if (!selectedEvent?._id || !user) {
      setIsLoading(false);
      return;
    }
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${selectedEvent._id}/reservation`;
      // Cache-bust so a return visit never reads a stale browser-cached reservation.
      const response = await axios.get(url, { withCredentials: true, params: { _t: Date.now() } });

      if (response.data.success && response.data.reservation) {
        const res = response.data.reservation;
        const tickets = res.tickets || [];
        const required = tickets.reduce((sum, t) => sum + t.quantity, 0);

        // Reconcile held seats DOWN to the live count (buyer lowered their ticket quantity after
        // holding seats): persist the trimmed list through the existing seat-update path - it clears
        // the old holds and re-holds only the kept seats, so the exact-match Proceed gate is
        // satisfiable and the buyer is never stuck above the new count (D4).
        let seatIds = res.seatIds || [];
        if (seatIds.length > required) {
          const keep = seatIds.slice(0, required);
          try {
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${selectedEvent._id}/reservation/${res._id}/seats`,
              { seatIds: keep },
              { withCredentials: true }
            );
          } catch (e) {
            console.error('Failed to reconcile seats to the lowered count:', e);
          }
          seatIds = keep;
          res.seatIds = keep;
        }

        setReservation(res);
        setSelectedTickets(tickets);
        setTicketTotals({ totalQuantity: required, totalPrice: res.totalAmount || 0 });
        setSelectedSeats(seatIds);
      } else {
        setError('Please select tickets first');
        setTimeout(() => { router.push(`/events/tickets/${eventId}`); }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Please select tickets first');
        setTimeout(() => { router.push(`/events/tickets/${eventId}`); }, 2000);
      } else if (error.response?.status === 401) {
        setError('Authentication failed - please refresh the page');
      } else {
        console.error('Error fetching reservation:', error);
        setError('Failed to load reservation data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent?._id, user, eventId, router]);

  // Fetch on mount / when the event + user resolve.
  useEffect(() => { fetchReservation(); }, [fetchReservation]);

  // Re-fetch whenever the page regains focus (tab return / restore), so the required-seat count and
  // held seats stay in sync with a quantity change made on the tickets page.
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible') fetchReservation(); };
    window.addEventListener('focus', onShow);
    document.addEventListener('visibilitychange', onShow);
    return () => {
      window.removeEventListener('focus', onShow);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [fetchReservation]);

  // Handle seat selection updates
  const handleSeatsUpdated = async (newSelectedSeats) => {
    console.log('🪑 [SeatSelection] Updating seats:', {
      newSeats: newSelectedSeats,
      reservationId: reservation?._id
    });
    
    if (!reservation) {
      console.log('❌ [SeatSelection] No reservation to update');
      return;
    }
    
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservation._id}/seats`;
      console.log('📡 [SeatSelection] Updating seats at:', url);
      
      const response = await axios.put(
        url,
        { seatIds: newSelectedSeats },
        { withCredentials: true }
      );
      
      console.log('✅ [SeatSelection] Seat update response:', response.data);
      
      if (response.data.success) {
        setSelectedSeats(newSelectedSeats);
        // Keep the reservation's seatIds in sync with the live selection. The seat map's periodic
        // refresh (fetchSeatData) restores its selection from this list, so if it lagged behind, a
        // just-picked seat would briefly lose its "selected" colour until the next poll.
        setReservation((prev) => (prev ? { ...prev, seatIds: newSelectedSeats } : prev));
      }
    } catch (error) {
      console.error('Error updating seats:', error);
      setError('Failed to update seat selection');
    }
  };

  // Handle loading states
  if (eventStatus === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to ticket selection...</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <EmptyState
        title="Event not found"
        description="This event may have been removed, or the link is incorrect."
        actionLabel="Browse events"
        actionHref="/events"
      />
    );
  }


  // Handle checkout navigation
  const handleProceedToCheckout = () => {
    if (!reservation || selectedSeats.length !== ticketRequirement.total) {
      return;
    }

    // Navigate to checkout
    router.push(`/events/checkout/${eventId}`);
  };

  // Handle back navigation
  const handleBackToTickets = () => {
    router.push(`/events/tickets/${eventId}`);
  };

  const canProceed = reservation && selectedSeats.length === ticketRequirement.total;

  return (
    <div>
      <div className="w-full pb-24">
        {/* Page toolbar (design-system.md section 8): Back pinned left, title centred in the SAME
            row. Back is the shared secondary button; title is the flat H1 (18px bold). */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute left-0">
            <BackButton onClick={handleBackToTickets} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Select Seats
          </h1>
        </div>

        {/* Header: three stacked rows — timer, the selected seats, then the legend. Same on desktop
            and mobile. The "N of M seats selected" count lives in the sticky bar. */}
        <div data-testid="seats-status-row" className="flex flex-col items-center gap-2 mb-4">
          {/* No Clear — deselect on the map to change seats. */}
          {reservation && (
            <ReservationTimer
              expiresAt={reservation.expiresAt}
              eventId={selectedEvent._id}
              reservationId={reservation._id}
              mode="seats"
              showClear={false}
              onExpire={() => {
                router.push(`/events/tickets/${eventId}`);
              }}
              onClear={() => {
                setSelectedSeats([]);
                router.push(`/events/tickets/${eventId}`);
              }}
            />
          )}

          {/* The specific seats picked (variable length — wraps here, fully visible on mobile). */}
          {selectedSeats.length > 0 && (
            <div className="flex max-w-full items-start gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 px-2 py-1 rounded-md">
              <MdEventSeat className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {selectedSeats.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Legend — its own row, centred, immediately above the map. */}
        <div data-testid="seats-legend" className="flex justify-center mb-4">
          <SeatLegend />
        </div>

        {/* Seat map (layout / selection / socket unchanged). */}
        <div data-testid="seats-map">
          <SeatMapWithSocket
            event={selectedEvent}
            ticketRequirement={ticketRequirement}
            eventId={eventId}
            userId={user?._id}
            existingReservation={reservation}
            onSeatsChange={handleSeatsUpdated}
            hasVenueLayout={selectedEvent?.seatingLayoutImage?.length > 0}
            onVenueClick={() => { setCurrentImageIndex(0); setIsFullscreen(true); }}
          />
        </div>
      </div>

      {/* Sticky action bar (matches the tickets page): the seat-selection count on the left, the
          primary Proceed to Payment on the right, pinned to the bottom edge. The mobile bottom nav
          is hidden on the flow, so this owns the bottom edge; the content carries pb-24 so nothing
          hides behind it. The inner band matches BaseContentShell (max-w-5xl + gutters). */}
      {reservation && (
        <div
          data-testid="seats-cta-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white safe-area-inset-pb"
        >
          <div className="w-full max-w-5xl mx-auto px-2 md:px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {selectedSeats.length} of {ticketRequirement.total} seats selected
              </p>
            </div>
            <button
              onClick={handleProceedToCheckout}
              disabled={!canProceed}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                canProceed
                  ? 'bg-teal-700 hover:bg-teal-800'
                  : 'bg-teal-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <FaShoppingCart className="text-sm" />
              <span>Proceed to Payment</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Fullscreen Modal for Seating Images */}
      {isFullscreen && selectedEvent?.seatingLayoutImage?.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img
            src={getOptimizedImageUrl({
              ...selectedEvent.seatingLayoutImage[currentImageIndex],
              optimizedUrls: {
                ...selectedEvent.seatingLayoutImage[currentImageIndex].optimizedUrls,
                desktop: selectedEvent.seatingLayoutImage[currentImageIndex].optimizedUrls?.fullscreen || 
                         selectedEvent.seatingLayoutImage[currentImageIndex].optimizedUrls?.desktop
              }
            }) || selectedEvent.seatingLayoutImage[currentImageIndex].url}
            alt={`Venue Seating Layout ${currentImageIndex + 1}`}
            className="object-contain w-[95vw] h-[95vh] sm:w-[90vw] sm:h-[90vh] rounded shadow-2xl"
          />
          
          {/* Navigation for multiple images */}
          {selectedEvent.seatingLayoutImage.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => 
                  prev === 0 ? selectedEvent.seatingLayoutImage.length - 1 : prev - 1
                )}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-slate-800 p-2 rounded-full shadow-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentImageIndex((prev) => 
                  (prev + 1) % selectedEvent.seatingLayoutImage.length
                )}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-slate-800 p-2 rounded-full shadow-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 text-slate-800 p-2 rounded-full shadow-lg transition-all"
          >
            <FaTimes size={24} />
          </button>
          
          {/* Image counter */}
          {selectedEvent.seatingLayoutImage.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {selectedEvent.seatingLayoutImage.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeatSelectionPage;