// app/events/seats/[eventId]/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRef, useCallback } from 'react';

import { 
  fetchSeatAvailability,
  setCurrentEvent,
  setSessionId,
  resetSeatSelection,
  selectSelectedSeats,
  selectIsLoading as selectSeatLoading,
  selectError as selectSeatError,
  selectCurrentReservation,
  releaseReservation,
  clearSelection

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
import SeatLegend from '@/components/events/seats/SeatLegend';
import SeatDebugInfo from '@/components/events/seats/SeatDebugInfo';
import SeatSelectionFallback from '@/components/events/seats/SeatSelectionFallback';
import SeatSocketListener from '@/components/events/seats/SeatSocketListener';
import { FaShoppingCart } from 'react-icons/fa';

const SeatSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [initializationError, setInitializationError] = useState(null);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

   const latestReservationRef = useRef();
const isNavigatingToCheckoutRef = useRef(false);

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

        // ✅ ADD: Validate that loaded event matches URL parameter
        validateEventId(selectedEvent || await dispatch(fetchEventById(eventId)).unwrap(), eventId);

        // Fetch seat availability
        const seatData = await dispatch(fetchSeatAvailability(eventId)).unwrap();
        // Log the fetched seat data
        console.log('🪑SeatSelectionPage: Fetched seat data:', {
          eventId,
          seatData,
          seatingLayoutLength: seatData?.seatingLayout?.length,
          totalSeats: seatData?.seatingLayout?.reduce((total, row) => total + (row.seats?.length || 0), 0),
          timestamp: new Date().toISOString()
        });

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

    // Add event ID validation
    const validateEventId = (loadedEvent, urlEventId) => {
      if (!loadedEvent || !loadedEvent._id) {
        throw new Error('Event not found');
      }
      if (loadedEvent._id !== urlEventId) {
        throw new Error(`Event ID mismatch: URL has ${urlEventId} but loaded event has ${loadedEvent._id}`);
      }
    };

    if (eventId && !initializationAttempted) {
      initializePage();
    }

  }, [eventId, dispatch, selectedEvent, ticketPurchaseState.sessionActive, 
      ticketPurchaseState.eventId, selectedTickets, totals, seatInfo.requiresSeats, initializationAttempted]);


  // Synchronizes selected seats between different Redux slices to maintain consistent state.
  useEffect(() => {
    if (selectedSeats.length > 0) {
      dispatch(updateSeatInfo({
        selectedSeats: selectedSeats,
      }));
    }
  }, [selectedSeats, dispatch]);

  //Keep ref updated with latest reservation
  useEffect(() => {
    latestReservationRef.current = currentReservation;
  }, [currentReservation])

  // ✅ TASK 1: Keep ref updated with latest reservation
  useEffect(() => {
    latestReservationRef.current = currentReservation;
  }, [currentReservation]);

  // ✅ TASK 2: Centralized cleanup function with multiple strategies
  const performCleanup = useCallback(async (reason = 'unknown') => {

 // ✅ Skip cleanup if navigating to checkout
  if (isNavigatingToCheckoutRef.current && reason === 'component-unmount') {
    console.log(`🔄 CLEANUP: Skipping ${reason} cleanup - navigating to checkout`);
    return;
  }

    const freshReservation = latestReservationRef.current;
    
    console.log(`🔧 CLEANUP: Starting cleanup (${reason})`, {
      hasReservation: !!freshReservation,
      seatCount: freshReservation?.seatIds?.length || 0,
      eventId
    });

    if (freshReservation?.seatIds?.length > 0) {
      try {
        // Strategy 1: Normal release with sessionId
        const result = await dispatch(releaseReservation({
          eventId: eventId,
          seatIds: freshReservation.seatIds,
          sessionId: freshReservation.sessionId,
        })).unwrap();
        
        console.log(`✅ CLEANUP (${reason}): Primary strategy succeeded`, result);
        
      } catch (error) {
        console.error(`❌ CLEANUP (${reason}): Primary strategy failed`, error);
        
        // Strategy 2: Fallback - release all user's seats (ignore sessionId)
        try {
          console.log(`🔄 CLEANUP (${reason}): Trying fallback strategy`);
          await dispatch(releaseReservation({
            eventId: eventId,
            seatIds: null, // Release all user's seats
            sessionId: null, // Ignore sessionId matching
          })).unwrap();
          
          console.log(`✅ CLEANUP (${reason}): Fallback strategy succeeded`);
        } catch (fallbackError) {
          console.error(`❌ CLEANUP (${reason}): Fallback strategy failed`, fallbackError);
        }
        
        // Strategy 3: Force clear local state regardless
        console.log(`🧹 CLEANUP (${reason}): Force clearing local state`);
        dispatch(clearSelection());
      }
    } else {
      console.log(`ℹ️ CLEANUP (${reason}): No reservation to clean up`);
    }
  }, [dispatch, eventId]);

// ✅ TASK 2: Primary cleanup strategy - component unmount
useEffect(() => {
  return () => {
    performCleanup('component-unmount');
  };
}, [performCleanup]);


// ✅ TASK 2: Primary cleanup strategy - component unmount
useEffect(() => {
  return () => {
    performCleanup('component-unmount');
  };
}, [performCleanup]);

// ✅ TASK 2: Secondary cleanup strategies - page events
useEffect(() => {
  const handleBeforeUnload = () => {
    const freshReservation = latestReservationRef.current;
    if (freshReservation?.seatIds?.length > 0) {
      // Use sendBeacon for reliable cleanup during page unload
      try {
        const data = JSON.stringify({
          seatIds: freshReservation.seatIds,
          sessionId: freshReservation.sessionId
        });
        
        // Convert to proper request format for sendBeacon
        const blob = new Blob([data], { type: 'application/json' });
        
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve`,
          blob
        );
        console.log('📡 CLEANUP (beforeunload): Beacon sent for emergency cleanup');
      } catch (error) {
        console.error('❌ CLEANUP (beforeunload): Beacon failed:', error);
      }
    }
  };

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    // ✅ EXCEPTION: Don't cleanup when navigating to checkout
    if (isNavigatingToCheckoutRef.current) {
      console.log('🔄 VISIBILITY: Skipping cleanup - navigating to checkout');
      // Clear flag after delay (in case navigation fails)
      setTimeout(() => {
        isNavigatingToCheckoutRef.current = false;
      }, 2000);
      return;
    }
    
    // Only cleanup for actual tab switches (not navigation)
    console.log('🔄 VISIBILITY: User switched tabs/minimized - performing cleanup');
    performCleanup('visibility-hidden');
  }
};

  const handlePageHide = () => {
    // Page is being unloaded (more reliable than beforeunload)
    const freshReservation = latestReservationRef.current;
    if (freshReservation?.seatIds?.length > 0) {
      performCleanup('page-hide');
    }
  };

  // Register event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    // Cleanup event listeners
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
  };
}, [performCleanup, eventId]);

  // Handles navigation back to previous page
  const handleBack = () => {
    router.back();
  };

  // Handle proceed to checkout
const handleProceedToCheckout = () => {
  // ✅ Set flag to prevent visibility cleanup during navigation
  isNavigatingToCheckoutRef.current = true;
  
  if (selectedSeats.length === 0) {
    alert('Please select your seats before proceeding.');
    isNavigatingToCheckoutRef.current = false; // Reset flag
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

  // Debug: Check actual values
  console.log('DEBUG canProceed:', {
    selectedSeats: selectedSeats.length,
    seatInfoSeatCount: seatInfo.seatCount,
    canProceed: selectedSeats.length === (seatInfo.seatCount || 0) && selectedSeats.length > 0
  });

  // Check if all required seats are selected
  const canProceed = selectedSeats.length === (seatInfo.seatCount || 0) && selectedSeats.length > 0;

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
        eventId={eventId}
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
        eventId={eventId}
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
              </div>
            </div>

            {/* Timer removed - now handled at component level */}
            <div className="flex items-center space-x-2">
              {currentReservation && (
                <div className="text-sm text-green-600 font-medium">
                  Seats Reserved
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SeatSocketListener eventId={eventId}/>
        <div className="space-y-6">
          
          {/* Row 1: Seating Legend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <SeatLegend />
          </div>
          
          {/* Row 2: Seat Selection - Full width seat map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
    <h2 className="text-xl font-semibold text-gray-900">Select Your Seats</h2>
  </div>
            <SeatMapSelection event={selectedEvent} ticketSelection={ticketSelection} eventId={eventId}/>
            
            {/* Proceed to Checkout Button - Only show when all seats are selected */}
            {canProceed && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <FaShoppingCart className="mr-2" />
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Mobile sticky footer - Only show when all seats are selected */}
      {canProceed && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleProceedToCheckout}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <FaShoppingCart className="mr-2" />
            Proceed to Checkout
          </button>
        </div>
      )}

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <SeatDebugInfo 
          event={selectedEvent} 
          ticketSelection={ticketSelection}
          eventId={eventId}
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