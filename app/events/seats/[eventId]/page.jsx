// app/events/seats/[eventId]/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSeatAvailability,
  setCurrentEvent,
  setSessionId,
  resetSeatSelection
} from '@/store/slices/events/seatSelectionSlice';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeatMapSelection from '@/components/events/seats/SeatMapSelection';
import SeatSelectionSummary from '@/components/events/seats/SeatSelectionSummary';
import SeatLegend from '@/components/events/seats/SeatLegend';
import SeatReservationTimer from '@/components/events/seats/SeatReservationTimer';
import SeatDebugInfo from '@/components/events/seats/SeatDebugInfo';
import SeatSelectionFallback from '@/components/events/seats/SeatSelectionFallback';

const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [ticketSelection, setTicketSelection] = useState(null);
  const [initializationError, setInitializationError] = useState(null);

  // Redux state
  const { 
    seatingLayout, 
    selectedSeats, 
    isLoading, 
    error,
    currentReservation 
  } = useSelector((state) => state.seatSelection);
  
  const { selectedEvent } = useSelector((state) => state.events);

  // Initialize page data
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Validate ticket selection from sessionStorage
        const storedSelection = sessionStorage.getItem('ticketSelection');
        if (!storedSelection) {
          setInitializationError('No ticket selection found. Please select tickets first.');
          return;
        }

        const parsedSelection = JSON.parse(storedSelection);
        
        // Validate ticket selection data
        if (parsedSelection.eventId !== eventId || !parsedSelection.hasSeatingLayout) {
          setInitializationError('Invalid ticket selection for this event.');
          return;
        }

        // Check if ticket selection is not too old (30 minutes)
        const selectionAge = Date.now() - parsedSelection.timestamp;
        if (selectionAge > 30 * 60 * 1000) {
          setInitializationError('Ticket selection has expired. Please select tickets again.');
          return;
        }

        setTicketSelection(parsedSelection);

        // Generate session ID
        const sessionId = `seat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch(setSessionId(sessionId));

        // Set current event context
        dispatch(setCurrentEvent({ 
          eventId, 
          maxSeatsPerSelection: Object.values(parsedSelection.tickets).reduce((sum, qty) => sum + qty, 0)
        }));

        // Fetch event details if not already loaded
        if (!selectedEvent || selectedEvent._id !== eventId) {
          await dispatch(fetchEventById(eventId)).unwrap();
        }

        // Fetch seat availability
        const seatData = await dispatch(fetchSeatAvailability(eventId)).unwrap();
        console.log('🎯 Seat data loaded:', seatData);

        // Validate seat data structure
        if (!seatData.seatingLayout || !Array.isArray(seatData.seatingLayout)) {
          throw new Error('Invalid seating layout data received from server');
        }

        // Log seat structure for debugging
        console.log('🎯 Seating layout structure:', {
          rows: seatData.seatingLayout.length,
          firstRowSeats: seatData.seatingLayout[0]?.seats?.length || 0,
          sampleSeat: seatData.seatingLayout[0]?.seats?.[0]
        });

      } catch (error) {
        console.error('❌ Error initializing seat selection:', error);
        setInitializationError(error.message || 'Failed to load seat selection data');
      }
    };

    if (eventId) {
      initializePage();
    }

    // Cleanup on unmount
    return () => {
      dispatch(resetSeatSelection());
    };
  }, [eventId, dispatch, selectedEvent]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/events/views/${eventId}`);
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (!ticketSelection || selectedSeats.length === 0) {
      alert('Please select your seats before proceeding.');
      return;
    }

    // Update ticket selection with seat information
    const updatedSelection = {
      ...ticketSelection,
      selectedSeats,
      reservationId: currentReservation?.reservationId,
      timestamp: Date.now()
    };

    sessionStorage.setItem('ticketSelection', JSON.stringify(updatedSelection));
    router.push(`/checkout/events/${eventId}`);
  };

  // Loading state
  if (isLoading || !selectedEvent || !ticketSelection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading seat selection...</p>
        </div>
      </div>
    );
  }

  // Error state - show fallback component
  if (initializationError || error) {
    return (
      <SeatSelectionFallback 
        event={selectedEvent} 
        ticketSelection={ticketSelection}
        error={initializationError || error}
      />
    );
  }

  // Check if seating layout is empty or invalid
  if (selectedEvent && ticketSelection && (!seatingLayout || seatingLayout.length === 0)) {
    return (
      <SeatSelectionFallback 
        event={selectedEvent} 
        ticketSelection={ticketSelection}
        error="No seating layout has been configured for this event."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back button and event info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h1>
                <p className="text-sm text-gray-500">Select your seats</p>
              </div>
            </div>

            {/* Reservation timer */}
            <SeatReservationTimer />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Seat map - takes up most space */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <SeatMapSelection event={selectedEvent} ticketSelection={ticketSelection} />
            </div>
          </div>

          {/* Sidebar with summary and legend */}
          <div className="lg:col-span-1 space-y-6">
            <SeatSelectionSummary 
              event={selectedEvent} 
              ticketSelection={ticketSelection}
              onProceedToCheckout={handleProceedToCheckout}
            />
            <SeatLegend />
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <SeatSelectionSummary 
          event={selectedEvent} 
          ticketSelection={ticketSelection}
          onProceedToCheckout={handleProceedToCheckout}
          compact={true}
        />
      </div>

      {/* Debug info (development only) */}
      <SeatDebugInfo event={selectedEvent} ticketSelection={ticketSelection} />
    </div>
  );
};

export default SeatSelectionPage;