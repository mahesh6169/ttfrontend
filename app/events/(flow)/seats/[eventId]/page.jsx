// app/events/seats/[eventId]/page.jsx
// New version without Redux for seat management

'use client';

import React, { useEffect, useState } from 'react';
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
  // Live seat selection (display only) — the map reports every change so the
  // page can show the count/list on the same row as the timer.
  const [liveSeats, setLiveSeats] = useState([]);

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

  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      console.log('🔍 [SeatSelection] Starting reservation fetch...');
      console.log('   - Event ID:', selectedEvent?._id);
      console.log('   - User ID:', user?._id || user?.id);
      
      if (!selectedEvent?._id || !user) {
        console.log('❌ [SeatSelection] Missing event or user, skipping reservation fetch');
        setIsLoading(false);
        return;
      }

      try {
        const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${selectedEvent._id}/reservation`;
        console.log('📡 [SeatSelection] Fetching reservation from:', url);
        
        const response = await axios.get(url, { withCredentials: true });
        
        console.log('✅ [SeatSelection] Reservation response:', response.data);

        if (response.data.success && response.data.reservation) {
          const res = response.data.reservation;
          console.log('📋 [SeatSelection] Reservation found:', {
            id: res._id,
            status: res.status,
            seatIds: res.seatIds,
            tickets: res.tickets,
            expiresAt: res.expiresAt
          });
          
          setReservation(res);
          
          // Set selected tickets from reservation
          const tickets = res.tickets || [];
          setSelectedTickets(tickets);
          
          // Calculate totals
          const totals = {
            totalQuantity: tickets.reduce((sum, t) => sum + t.quantity, 0),
            totalPrice: res.totalAmount || 0
          };
          setTicketTotals(totals);
          
          // Set selected seats if any
          if (res.seatIds && res.seatIds.length > 0) {
            console.log('🪑 [SeatSelection] Setting selected seats:', res.seatIds);
            setSelectedSeats(res.seatIds);
          } else {
            console.log('⚠️ [SeatSelection] No seats in reservation');
          }
        } else {
          console.log('⚠️ [SeatSelection] No reservation found or unsuccessful response');
          // No reservation found
          setError('Please select tickets first');
          setTimeout(() => {
            router.push(`/events/tickets/${eventId}`);
          }, 2000);
        }
      } catch (error) {
        console.error('❌ [SeatSelection] Error fetching reservation:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.config?.headers
        });
        
        if (error.response?.status === 404) {
          console.log('🔄 [SeatSelection] 404 - No reservation found, redirecting to tickets page');
          // No reservation found
          setError('Please select tickets first');
          setTimeout(() => {
            router.push(`/events/tickets/${eventId}`);
          }, 2000);
        } else if (error.response?.status === 401) {
          console.log('🚫 [SeatSelection] 401 - Unauthorized, possible API key issue');
          setError('Authentication failed - please refresh the page');
        } else {
          console.error('Error fetching reservation:', error);
          setError('Failed to load reservation data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservation();
  }, [selectedEvent?._id, eventId, user, router]);

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
          {liveSeats.length > 0 && (
            <div className="flex max-w-full items-start gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 px-2 py-1 rounded-md">
              <MdEventSeat className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {liveSeats.join(', ')}
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
            onSelectionChange={setLiveSeats}
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
                {liveSeats.length} of {ticketRequirement.total} seats selected
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