// app/events/seats/[eventId]/page.jsx
// New version without Redux for seat management

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeatMapWithSocket from '@/components/events/seats/SeatMapWithSocket';
import SeatLegend from '@/components/events/seats/SeatLegend';
import ReservationTimer from '@/components/events/ReservationTimer';
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa';

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
      if (!selectedEvent?._id || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${selectedEvent._id}/reservation`,
          { withCredentials: true }
        );

        if (response.data.success && response.data.reservation) {
          const res = response.data.reservation;
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
            setSelectedSeats(res.seatIds);
          }
        } else {
          // No reservation found
          setError('Please select tickets first');
          setTimeout(() => {
            router.push(`/events/tickets/${eventId}`);
          }, 2000);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // No reservation found
          setError('Please select tickets first');
          setTimeout(() => {
            router.push(`/events/tickets/${eventId}`);
          }, 2000);
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
    if (!reservation) return;
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservation._id}/seats`,
        { seatIds: newSelectedSeats },
        { withCredentials: true }
      );
      
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting to ticket selection...</p>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    router.push(`/checkout/events/${eventId}`);
  };

  // Handle back navigation
  const handleBackToTickets = () => {
    router.push(`/events/tickets/${eventId}`);
  };

  const canProceed = reservation && selectedSeats.length === ticketRequirement.total;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
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
    </div>
  );
};

export default SeatSelectionPage;