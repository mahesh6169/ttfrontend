// app/events/seats/[eventId]/page.jsx
// New version without Redux for seat management

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeatMapWithSocket from '@/components/events/seats/SeatMapWithSocket';
import SeatLegend from '@/components/events/seats/SeatLegend';
import ReservationTimer from '@/components/events/ReservationTimer';
import { FaShoppingCart, FaArrowLeft, FaTimes } from 'react-icons/fa';

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
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting to ticket selection...</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-600">Event not found</p>
      </div>
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
      <div className="w-full">
        {/* Back to Tickets Button - Same as tickets page */}
        <div className="mb-3 sm:mb-6">
          <button
            onClick={handleBackToTickets}
            className="inline-flex items-center px-2.5 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium rounded-md sm:rounded-lg transition-colors"
          >
            <FaArrowLeft className="mr-1 sm:mr-2 text-[10px] sm:text-base" />
            <span className="text-xs sm:text-base">Back</span>
          </button>
        </div>

        {/* Single Column Layout - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
          {/* Centered Title */}
          <h1 className="text-lg sm:text-2xl font-semibold sm:font-bold text-gray-900 text-center mb-3 sm:mb-6">
            Select Seats
          </h1>
          
          {/* Seat Legend - Horizontal layout */}
          <div className="mb-3 sm:mb-6">
            <SeatLegend />
          </div>
          
          {/* Reservation Timer */}
          {reservation && (
            <ReservationTimer
              expiresAt={reservation.expiresAt}
              eventId={selectedEvent._id}
              reservationId={reservation._id}
              mode="seats"
              onExpire={() => {
                router.push(`/events/tickets/${eventId}`);
              }}
              onClear={() => {
                setSelectedSeats([]);
                router.push(`/events/tickets/${eventId}`);
              }}
            />
          )}
          
          {/* Venue Seating Layout - Small Thumbnail with Click to Enlarge */}
          {selectedEvent?.seatingLayoutImage && selectedEvent.seatingLayoutImage.length > 0 && (
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-medium text-gray-700">
                  Venue Layout:
                </h2>
                <div 
                  className="relative group cursor-pointer rounded overflow-hidden border border-gray-300 hover:border-blue-500 transition-all"
                  onClick={() => {
                    setCurrentImageIndex(0);
                    setIsFullscreen(true);
                  }}
                >
                  <img
                    src={getOptimizedImageUrl(selectedEvent.seatingLayoutImage[0])}
                    alt="Venue Seating Layout"
                    className="w-16 h-12 sm:w-20 sm:h-14 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">
                      🔍
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Click to enlarge</span>
                {selectedEvent.seatingLayoutImage.length > 1 && (
                  <span className="text-xs text-gray-500">
                    ({selectedEvent.seatingLayoutImage.length} images)
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Seat Map */}
          <div className="mb-3 sm:mb-6">
            <SeatMapWithSocket
              event={selectedEvent}
              ticketRequirement={ticketRequirement}
              eventId={eventId}
              userId={user?._id}
              existingReservation={reservation}
              onSeatsChange={handleSeatsUpdated}
            />
          </div>
          
          
          {/* Proceed to Checkout Button - Same style as tickets page */}
          <button
            onClick={handleProceedToCheckout}
            disabled={!canProceed}
            className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium sm:font-semibold text-sm sm:text-base flex items-center justify-center transition-all ${
              canProceed
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaShoppingCart className="mr-1.5 sm:mr-2 text-sm sm:text-base" />
            <span className="text-sm sm:text-base">Proceed to Payment</span>
          </button>
        </div>
      </div>
      
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
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setCurrentImageIndex((prev) => 
                  (prev + 1) % selectedEvent.seatingLayoutImage.length
                )}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
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
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
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