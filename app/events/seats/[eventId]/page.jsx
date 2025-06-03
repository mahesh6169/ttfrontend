// app/events/seats/[eventId]/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSeatAvailability,
  setCurrentEvent,
  setSessionId,
  resetSeatSelection,
  selectSelectedSeats,
  selectIsLoading as selectSeatLoading,
  selectError as selectSeatError,
  selectCurrentReservation
} from '@/store/slices/events/seatSelectionSlice';
import { 
  updateSeatInfo,
  setCurrentStep,
  selectTicketPurchase,
  selectSelectedTickets,
  selectTicketTotals,
  selectSeatInfo
} from '@/store/slices/events/ticketPurchaseSlice';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeatMapSelection from '@/components/events/seats/SeatMapSelection';
import SeatSelectionSummary from '@/components/events/seats/SeatSelectionSummary';
import SeatLegend from '@/components/events/seats/SeatLegend';
import SeatReservationTimer from '@/components/events/seats/SeatReservationTimer';
import SeatDebugInfo from '@/components/events/seats/SeatDebugInfo';
import SeatSelectionFallback from '@/components/events/seats/SeatSelectionFallback';
import SeatSocketListener from '@/components/events/seats/SeatSocketListener';

const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [initializationError, setInitializationError] = useState(null);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // Redux state from both slices
  const { 
    seatingLayout, 
    isLoading: seatLoading, 
    error: seatError,
    currentReservation 
  } = useSelector((state) => state.seatSelection);
  
  const selectedSeats = useSelector(selectSelectedSeats);
  const { selectedEvent } = useSelector((state) => state.events);
  
  // Ticket purchase state
  const ticketPurchaseState = useSelector(selectTicketPurchase);
  const selectedTickets = useSelector(selectSelectedTickets);
  const totals = useSelector(selectTicketTotals);
  const seatInfo = useSelector(selectSeatInfo);

  // Initialize page data
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check if we have a valid ticket purchase session
        const hasValidSession = ticketPurchaseState.sessionActive && 
                               ticketPurchaseState.eventId === eventId &&
                               selectedTickets.length > 0;

        let ticketSelection = null;

        if (hasValidSession) {
          ticketSelection = {
            eventId: ticketPurchaseState.eventId,
            tickets: selectedTickets.reduce((acc, ticket) => {
              acc[ticket.ticketTypeId] = ticket.quantity;
              return acc;
            }, {}),
            totals: totals,
            hasSeatingLayout: seatInfo.requiresSeats,
            timestamp: Date.now()
          };
        } else {
          // Fallback: Check sessionStorage
          const storedSelection = sessionStorage.getItem('ticketSelection');
          if (!storedSelection) {
            setInitializationError('No ticket selection found. Please select tickets first.');
            return;
          }

          ticketSelection = JSON.parse(storedSelection);
          
          // Validate ticket selection data
          if (ticketSelection.eventId !== eventId || !ticketSelection.hasSeatingLayout) {
            setInitializationError('Invalid ticket selection for this event.');
            return;
          }

          // Check if ticket selection is not too old (30 minutes)
          const selectionAge = Date.now() - ticketSelection.timestamp;
          if (selectionAge > 30 * 60 * 1000) {
            setInitializationError('Ticket selection has expired. Please select tickets again.');
            return;
          }
        }

        // Validate that seating is required
        if (!ticketSelection.hasSeatingLayout) {
          setInitializationError('This event does not require seat selection.');
          return;
        }

        // Calculate total seats needed
        const totalSeatsNeeded = Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0);

        // Generate session ID for seat selection
        const sessionId = `seat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        dispatch(setSessionId(sessionId));

        // Set current event context for seat selection
        dispatch(setCurrentEvent({ 
          eventId, 
          maxSeatsPerSelection: totalSeatsNeeded
        }));

        // Update ticket purchase slice with seat coordination info
        dispatch(updateSeatInfo({
          requiresSeats: true,
          seatCount: totalSeatsNeeded,
          selectedSeats: [] // Will be updated as user selects seats
        }));

        // Update current step in ticket purchase flow
        dispatch(setCurrentStep('seat-selection'));

        // Fetch event details if not already loaded
        if (!selectedEvent || selectedEvent._id !== eventId) {
          await dispatch(fetchEventById(eventId)).unwrap();
        }

        // Fetch seat availability
        const seatData = await dispatch(fetchSeatAvailability(eventId)).unwrap();

        // Validate seat data structure
        if (!seatData.seatingLayout || !Array.isArray(seatData.seatingLayout)) {
          throw new Error('Invalid seating layout data received from server');
        }

        setInitializationAttempted(true);

      } catch (error) {
        console.error('Error initializing seat selection:', error);
        setInitializationError(error.message || 'Failed to load seat selection data');
      }
    };

    if (eventId && !initializationAttempted) {
      initializePage();
    }

    // Cleanup on unmount
    return () => {
      if (initializationAttempted) {
        dispatch(resetSeatSelection());
      }
    };
  }, [eventId, dispatch, selectedEvent, ticketPurchaseState.sessionActive, 
      ticketPurchaseState.eventId, selectedTickets, totals, seatInfo.requiresSeats, initializationAttempted]);

  // Sync selected seats between slices
  useEffect(() => {
    if (selectedSeats.length > 0) {
      dispatch(updateSeatInfo({
        selectedSeats: selectedSeats,
        seatCount: selectedSeats.length
      }));
    }
  }, [selectedSeats, dispatch]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/events/views/${eventId}`);
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) {
      alert('Please select your seats before proceeding.');
      return;
    }

    // Validate seat count matches ticket count
    const expectedSeatCount = seatInfo.seatCount || 0;
    if (selectedSeats.length !== expectedSeatCount) {
      alert(`Please select exactly ${expectedSeatCount} seat${expectedSeatCount !== 1 ? 's' : ''}.`);
      return;
    }

    // Update ticket purchase slice with final seat selection
    dispatch(updateSeatInfo({
      selectedSeats: selectedSeats,
      reservationId: currentReservation?.reservationId,
      seatCount: selectedSeats.length
    }));

    // Set step to details (so checkout page shows the form)
    dispatch(setCurrentStep('details'));

    // Update sessionStorage as fallback during transition
    const currentSelection = sessionStorage.getItem('ticketSelection');
    if (currentSelection) {
      const updatedSelection = {
        ...JSON.parse(currentSelection),
        selectedSeats,
        reservationId: currentReservation?.reservationId,
        timestamp: Date.now()
      };
      sessionStorage.setItem('ticketSelection', JSON.stringify(updatedSelection));
    }

    // Navigate to checkout
    router.push(`/checkout/events/${eventId}`);
  };

  // Get ticket selection for display (prioritize Redux, fallback to sessionStorage)
  const getTicketSelectionForDisplay = () => {
    if (ticketPurchaseState.sessionActive && selectedTickets.length > 0) {
      // Use Redux data
      return {
        eventId: ticketPurchaseState.eventId,
        tickets: selectedTickets.reduce((acc, ticket) => {
          acc[ticket.ticketTypeId] = ticket.quantity;
          return acc;
        }, {}),
        totals: totals,
        hasSeatingLayout: seatInfo.requiresSeats,
        timestamp: Date.now()
      };
    } else {
      // Fallback to sessionStorage
      const stored = sessionStorage.getItem('ticketSelection');
      return stored ? JSON.parse(stored) : null;
    }
  };

  const ticketSelection = getTicketSelectionForDisplay();

  // Loading state
  if (seatLoading || !selectedEvent || !ticketSelection) {
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
  if (initializationError || seatError) {
    return (
      <SeatSelectionFallback 
        event={selectedEvent} 
        ticketSelection={ticketSelection}
        error={initializationError || seatError}
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
                <p className="text-sm text-gray-500">
                  Select {seatInfo.seatCount || 'your'} seat{(seatInfo.seatCount || 0) !== 1 ? 's' : ''}
                  {seatInfo.seatCount > 0 && ` (${selectedSeats.length}/${seatInfo.seatCount} selected)`}
                </p>
              </div>
            </div>

            {/* Reservation timer */}
            <SeatReservationTimer />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SeatSocketListener />
        <div className="space-y-6">
          
          {/* Row 1: Seating Legend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SeatLegend />
          </div>
          
          {/* Row 2: Seat Selection - Full width seat map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Select Your Seats</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose {seatInfo.seatCount || 'your'} seat{(seatInfo.seatCount || 0) !== 1 ? 's' : ''} • 
                {seatInfo.seatCount > 0 && ` ${selectedSeats.length}/${seatInfo.seatCount} selected`}
              </p>
            </div>
            <SeatMapSelection event={selectedEvent} ticketSelection={ticketSelection} />
          </div>
          
          {/* Row 3: Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SeatSelectionSummary 
              event={selectedEvent} 
              ticketSelection={ticketSelection}
              onProceedToCheckout={handleProceedToCheckout}
              selectedSeatsCount={selectedSeats.length}
              requiredSeatsCount={seatInfo.seatCount || 0}
              canProceed={selectedSeats.length === (seatInfo.seatCount || 0) && selectedSeats.length > 0}
              horizontal={true} // Pass this prop to make it horizontal layout
            />
          </div>
          
        </div>
      </div>

      {/* Mobile sticky footer - keep this for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <SeatSelectionSummary 
          event={selectedEvent} 
          ticketSelection={ticketSelection}
          onProceedToCheckout={handleProceedToCheckout}
          selectedSeatsCount={selectedSeats.length}
          requiredSeatsCount={seatInfo.seatCount || 0}
          canProceed={selectedSeats.length === (seatInfo.seatCount || 0) && selectedSeats.length > 0}
          compact={true}
        />
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <SeatDebugInfo 
          event={selectedEvent} 
          ticketSelection={ticketSelection}
          reduxState={{
            ticketPurchase: ticketPurchaseState,
            selectedTickets,
            seatInfo,
            selectedSeats: selectedSeats.length
          }}
        />
      )}
    </div>
  );
};

export default SeatSelectionPage;