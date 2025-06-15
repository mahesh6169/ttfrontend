// app/checkout/events/[eventId]/page.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaChair,
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import RequireLogin from '@/components/Auth/RequireLogin';
import LoadingSpinner from '@/components/LoadingSpinner';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import PaymentSummary from '@/components/payments/PaymentSummary';
import RefundPolicyDisplay from '@/components/events/refunds/RefundPolicyDisplay';
import {
  initializePurchaseSession,
  updateBuyerInfo,
  setCurrentStep,
  setSeatRequirement,
  updateSeatInfo,
  createPaymentIntent,
  confirmPayment,
  resetPurchaseSession,
  clearError,
  selectTicketPurchase,
  selectSelectedTickets,
  selectTicketTotals,
  selectBuyerInfo,
  selectSeatInfo,
  selectPaymentStatus,
  selectCurrentStep,
  selectPurchaseLoading,
  selectPurchaseError,
  updateTicketSelection,
    setRefundPolicyInfo,
  acceptRefundPolicy,
  clearRefundPolicyAcceptance,
  selectRefundPolicyInfo
} from '@/store/slices/events/ticketPurchaseSlice';
import SeatSocketListener from '@/components/events/seats/SeatSocketListener';
import {
  selectCurrentReservation,
  releaseReservation,
  clearSelection,
  selectSessionId,
  setCurrentReservation,
} from '@/store/slices/events/seatSelectionSlice';
import SeatReservationTimer from '@/components/events/seats/SeatReservationTimer';

// ✅ REFACTORED: Timer expiration handler following SeatMapSelection pattern
const CheckoutPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // Redux state
  const ticketPurchaseState = useSelector(selectTicketPurchase);
  const selectedTickets = useSelector(selectSelectedTickets);
  const totals = useSelector(selectTicketTotals);
  const buyerInfo = useSelector(selectBuyerInfo);
  const seatInfo = useSelector(selectSeatInfo);
  const paymentStatus = useSelector(selectPaymentStatus);
  const currentStep = useSelector(selectCurrentStep);
  const loading = useSelector(selectPurchaseLoading);
  const purchaseError = useSelector(selectPurchaseError);
  const refundPolicyInfo = useSelector(selectRefundPolicyInfo);
  const currentReservation = useSelector(selectCurrentReservation);
  const seatSessionId = useSelector(selectSessionId);

  // Local state management (only for UI, not for flow control)
  const [event, setEvent] = useState(null);
const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  
  // ✅ FIXED: Use Redux slice state instead of local state (like SeatMapSelection)
  const { 
    selectedSeats, 
    isLoading: seatSliceLoading, 
    error: seatSliceError 
  } = useSelector((state) => state.seatSelection);

  // ✅ FIXED: Following SeatMapSelection pattern with Redux state management
  const handleTimerExpire = useCallback(async () => {
    // ✅ Use Redux loading state instead of local state (like SeatMapSelection)
    if (seatSliceLoading) {
      console.log('🔄 Seat slice already loading, skipping duplicate cleanup call');
      return;
    }

    console.log('⏰ Checkout: Timer expired - starting sequential cleanup');

    try {
      // ✅ STEP 1: Release backend reservation (following SeatMapSelection pattern)
      if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
        console.log('🔓 Releasing expired reservation:', {
          reservationId: currentReservation.reservationId,
          seatCount: currentReservation.seatIds.length,
          seatsToRelease: currentReservation.seatIds,
        });
        
        // ✅ CRITICAL: Use .unwrap() like SeatMapSelection to wait for completion
        await dispatch(
          releaseReservation({
            eventId: params.eventId,
            seatIds: currentReservation.seatIds,
            sessionId: currentReservation.sessionId || seatSessionId,
          })
        ).unwrap();

        console.log('✅ Backend reservation released successfully');
      } else {
        console.log('ℹ️ No backend reservation to release, just clearing selection');
        // Clear selection as fallback (like SeatMapSelection)
        dispatch(clearSelection());
      }

      // ✅ STEP 2: Update sessionStorage with expiry information
      console.log('💾 Updating sessionStorage with expiry info...');
      const expiryInfo = {
        eventId: params.eventId,
        expired: true,
        expiredAt: new Date().toISOString(),
        expiredFrom: 'checkout',
        message: 'Your seat reservation expired during checkout. Please select seats again.'
      };

      const storedSelection = sessionStorage.getItem('ticketSelection');
      if (storedSelection) {
        try {
          const selection = JSON.parse(storedSelection);
          const updatedSelection = {
            ...selection,
            selectedSeats: [],
            reservationId: null,
            ...expiryInfo
          };
          sessionStorage.setItem('ticketSelection', JSON.stringify(updatedSelection));
        } catch (parseError) {
          console.warn('⚠️ Failed to parse existing ticket selection, creating new expiry record');
          sessionStorage.setItem('ticketSelection', JSON.stringify(expiryInfo));
        }
      } else {
        sessionStorage.setItem('ticketSelection', JSON.stringify(expiryInfo));
      }

      console.log('✅ Timer expiry cleanup completed successfully');

    } catch (error) {
      console.error('❌ Failed to release reservation during expiry:', error);

      // ✅ Enhanced error handling like SeatMapSelection
      if (error.message && error.message.includes('not found')) {
        console.log('ℹ️ Reservation already released or not found - continuing cleanup');
        dispatch(clearSelection());
      } else {
        console.error('🚨 Unexpected expiry error, forcing local cleanup');
        dispatch(clearSelection());
        dispatch(updateSeatInfo({
          selectedSeats: [],
          reservationId: null,
          seatCount: 0,
          requiresSeats: seatInfo.requiresSeats
        }));
      }

      // Set error flag in sessionStorage
      sessionStorage.setItem('ticketSelection', JSON.stringify({
        eventId: params.eventId,
        expired: true,
        expiredAt: new Date().toISOString(),
        expiredFrom: 'checkout',
        error: error.message,
        message: 'Timer expired with errors - please select seats again'
      }));
    }
  }, [dispatch, currentReservation, params.eventId, seatSessionId, seatInfo.requiresSeats, seatSliceLoading]);

  // ✅ FIXED: Watch Redux slice state changes for redirect (like SeatMapSelection)
  useEffect(() => {
    // Only redirect when timer has expired AND Redux state confirms cleanup is complete
    const shouldRedirect = 
      !seatSliceLoading &&                                    // Not loading
      !currentReservation &&                                  // No active reservation
      (!selectedSeats || selectedSeats.length === 0) &&      // No selected seats
      (!seatInfo.selectedSeats || seatInfo.selectedSeats.length === 0); // No seats in ticket slice

    // Check if we're coming from a timer expiry (sessionStorage will have expired flag)
    const storedSelection = sessionStorage.getItem('ticketSelection');
    let hasExpired = false;
    
    if (storedSelection) {
      try {
        const selection = JSON.parse(storedSelection);
        hasExpired = selection.expired && selection.expiredFrom === 'checkout';
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (shouldRedirect && hasExpired) {
      console.log('🔄 Redux state cleanup verified, redirecting to seat selection');
      
      const queryParams = new URLSearchParams({
        expired: 'true',
        from: 'checkout',
        timestamp: new Date().toISOString()
      });
      
      router.push(`/events/seats/${params.eventId}?${queryParams.toString()}`);
    }
  }, [seatSliceLoading, currentReservation, selectedSeats, seatInfo.selectedSeats, params.eventId, router]);

  // ✅ FIXED: Manual cleanup using Redux state (like SeatMapSelection)
  const handleManualCleanup = useCallback(async () => {
    console.log('🧹 Manual cleanup initiated from checkout page');
    
    if (currentReservation?.seatIds && currentReservation.seatIds.length > 0) {
      console.log('🔓 Manually releasing current reservation:', {
        reservationId: currentReservation.reservationId,
        seatCount: currentReservation.seatIds.length,
        seatsToRelease: currentReservation.seatIds,
      });

      try {
        // ✅ Use .unwrap() like SeatMapSelection
        await dispatch(
          releaseReservation({
            eventId: params.eventId,
            seatIds: currentReservation.seatIds,
            sessionId: currentReservation.sessionId || seatSessionId,
          })
        ).unwrap();
        
        console.log('✅ Manual reservation release successful');
      } catch (error) {
        console.error('❌ Failed to release reservation manually:', error);
        // Continue with clearing selection even if release fails (like SeatMapSelection)
      }
    } else {
      console.log('ℹ️ No active reservation to release, just clearing selection');
    }

    // Clear all local state (like SeatMapSelection does)
    dispatch(clearSelection());
  }, [dispatch, currentReservation, params.eventId, seatSessionId]);

  // Payment states from Redux
  const clientSecret = ticketPurchaseState.clientSecret;
  const paymentIntentId = ticketPurchaseState.paymentIntent?.id;

  // ✅ NEW: Function to format selected seats for display
  const formatSelectedSeats = () => {
    // Use Redux seat selection state instead of ticketPurchaseSlice
    const seatsToDisplay = selectedSeats || seatInfo.selectedSeats || [];
    
    if (!seatsToDisplay || seatsToDisplay.length === 0) {
      return 'No seats selected';
    }

    // Handle case where seats are just IDs (strings like "A-1", "B-3")
    if (typeof seatsToDisplay[0] === 'string') {
      // Parse seat IDs and group consecutive seats
      const parsedSeats = seatsToDisplay.map(seatId => {
        // Assuming format like "A-1", "B-3", etc.
        const parts = seatId.split('-');
        if (parts.length >= 2) {
          return {
            seatId,
            row: parts[0],
            seatNumber: parseInt(parts[1]) || parts[1]
          };
        }
        return { seatId, row: seatId, seatNumber: '' };
      });

      // Sort by row then seat number
      const sortedSeats = parsedSeats.sort((a, b) => {
        if (a.row !== b.row) {
          return a.row.localeCompare(b.row);
        }
        if (typeof a.seatNumber === 'number' && typeof b.seatNumber === 'number') {
          return a.seatNumber - b.seatNumber;
        }
        return String(a.seatNumber).localeCompare(String(b.seatNumber));
      });

      // Group consecutive seats in same row
      const groupedSeats = [];
      let currentGroup = [];
      
      sortedSeats.forEach((seat, index) => {
        if (index === 0) {
          currentGroup = [seat];
        } else {
          const prevSeat = sortedSeats[index - 1];
          const isConsecutive = 
            seat.row === prevSeat.row &&
            typeof seat.seatNumber === 'number' &&
            typeof prevSeat.seatNumber === 'number' &&
            seat.seatNumber === prevSeat.seatNumber + 1;

          if (isConsecutive) {
            currentGroup.push(seat);
          } else {
            groupedSeats.push(currentGroup);
            currentGroup = [seat];
          }
        }

        if (index === sortedSeats.length - 1) {
          groupedSeats.push(currentGroup);
        }
      });

      // Format groups
      const formattedGroups = groupedSeats.map(group => {
        if (group.length === 1) {
          return group[0].seatId;
        } else {
          const firstSeat = group[0];
          const lastSeat = group[group.length - 1];
          return `${firstSeat.row}-${firstSeat.seatNumber} to ${lastSeat.seatNumber}`;
        }
      });

      return formattedGroups.join(', ');
    }

    // Handle case where seats are objects with full details
    return seatsToDisplay.map(seat => seat.seatId || seat.id || 'Unknown').join(', ');
  };

  // ✅ MISSING FUNCTIONS: Add all the handler functions from original checkout
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updateData = { [name]: type === 'checkbox' ? checked : value };

    dispatch(updateBuyerInfo(updateData));

    // Clear field-specific errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

   // Handle refund policy acceptance
  const handleRefundPolicyAcceptance = (checked) => {
    if (checked) {
      dispatch(acceptRefundPolicy());
    } else {
      dispatch(clearRefundPolicyAcceptance());
    }

    // Clear refund policy errors
    if (errors.refundPolicyAccepted) {
      setErrors((prev) => ({ ...prev, refundPolicyAccepted: null }));
    }
  };

// Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!buyerInfo.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!buyerInfo.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!buyerInfo.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!buyerInfo.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(buyerInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!buyerInfo.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    // Validate refund policy acceptance for paid events
    if (event?.isPaid && event?.refundPolicy && !buyerInfo.refundPolicyAccepted) {
      newErrors.refundPolicyAccepted = 'You must acknowledge the refund policy to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle proceeding to payment step
  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      console.log('🚀 Creating payment intent with Redux...');

      // Create payment intent using Redux
      const result = await dispatch(
        createPaymentIntent({
          eventId: params.eventId,
          ticketData: selectedTickets,
          buyerInfo,
        })
      );

      if (createPaymentIntent.fulfilled.match(result)) {
        console.log('✅ Payment Intent created via Redux');
        dispatch(setCurrentStep('payment'));
      } else {
        throw new Error(result.payload || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      setErrors({
        payment:
          error.message || 'Failed to initialize payment. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

// ✅ FIXED: Handle successful payment - simplified to match backend
  const handlePaymentSuccess = async (paymentIntent) => {
    setIsProcessing(true);

    try {
      console.log('🎉 Payment succeeded, confirming with Redux...');


    // ✅ VALIDATION: Ensure refund policy acceptance for paid events
    if (event?.isPaid && event?.refundPolicy && !buyerInfo.refundPolicyAccepted) {
      throw new Error('Refund policy acceptance is required but was not confirmed. Please refresh and try again.');
    }

      // ✅ Convert selectedTickets array to tickets object that backend expects
      const ticketsObject = selectedTickets.reduce((acc, ticket) => {
        acc[ticket.ticketTypeId] = ticket.quantity;
        return acc;
      }, {});

      // ✅ ENHANCED: Include explicit refund policy acceptance data
      const enhancedBuyerInfo = {
        ...buyerInfo,
        // Ensure refund policy acceptance is explicitly included
        refundPolicyAccepted: buyerInfo.refundPolicyAccepted || false,
        // Include policy details for audit trail
        refundPolicyInfo: event?.isPaid && event?.refundPolicy ? {
          policyType: event.refundPolicy.processingFeePolicy || 'non-refundable',
          policyText: event.refundPolicy.policyText || '',
          acceptedAt: buyerInfo.refundPolicyAccepted ? new Date().toISOString() : null
        } : null
      };

      console.log('🐛 checkoutpage: DEBUG: confirmPayment payload:', {
        eventId: params.eventId,
        paymentIntentId: paymentIntent.id,
        paymentMethodId: paymentIntent.payment_method?.id,
        tickets: ticketsObject,
        buyerInfo: enhancedBuyerInfo
      });

       // ✅ LOG: Refund policy acceptance details for audit
    if (event?.isPaid && event?.refundPolicy) {
      console.log('📋 Refund Policy Acceptance Details:', {
        policyType: event.refundPolicy.processingFeePolicy,
        policyText: event.refundPolicy.policyText ? 'Custom text provided' : 'No custom text',
        userAccepted: buyerInfo.refundPolicyAccepted,
        acceptedAt: buyerInfo.refundPolicyAccepted ? new Date().toISOString() : 'Not accepted',
        buyerEmail: buyerInfo.email
      });
    }

     // ✅ ENHANCED: Simplified confirmPayment call with explicit policy data
      const result = await dispatch(confirmPayment({
        eventId: params.eventId,
        paymentIntentId: paymentIntent.id,
        paymentMethodId: paymentIntent.payment_method?.id, // Optional
        tickets: ticketsObject, // Object format: { ticketTypeId: quantity }
        buyerInfo: enhancedBuyerInfo
        // ✅ REMOVED: All seat-related data - backend handles this automatically through event seatingLayout
      }));

      if (confirmPayment.fulfilled.match(result)) {
        console.log('✅ Payment confirmed via Redux');
        // Redux will automatically set currentStep to 'complete'

        // Clear sessionStorage since we're using Redux now
        sessionStorage.removeItem('ticketSelection');
      } else {
        throw new Error(result.payload || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      setErrors({
        payment:
          error.message ||
          'Payment successful but failed to create tickets. Please contact support.',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('❌ Payment failed:', error);
    setErrors({
      payment: error || 'Payment failed. Please try again.',
    });
  };

// ✅ FIX: Smart back navigation based on event type
  const handleBackToTickets = () => {
    // Check if this event has seat selection
    const hasSeats = seatInfo.requiresSeats || 
                     event?.seatingLayout === 'assigned' ||
                     (currentReservation && currentReservation.seatIds?.length > 0);

    if (hasSeats) {
      // For seated events, go back to seat selection
      router.push(`/events/seats/${params.eventId}`);
    } else {
      // For non-seated events, go back to ticket selection
      router.push(`/events/tickets/${params.eventId}`);
    }
  };

  // Handle back to details step
  const handleBackToDetails = () => {
    dispatch(setCurrentStep('details'));
    dispatch(clearError());
    setErrors({});
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!event?.dateTime) return { date: '', time: '' };

    const timeZone = event.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(
      event.dateTime,
      timeZone,
      'EEEE, MMMM do, yyyy'
    );
    const time = formatInTimeZone(event.dateTime, timeZone, 'h:mm a');

    return { date, time };
  };

  // Get selected tickets for display
  const getSelectedTickets = () => {
    if (!event?.ticketTypes || !selectedTickets?.length) return [];

    return selectedTickets
      .filter((ticket) => ticket.quantity > 0)
      .map((ticket) => {
        const ticketType = event.ticketTypes.find(
          (t) => t._id === ticket.ticketTypeId
        );
        return {
          ...ticket,
          ...ticketType,
          totalPrice: ticket.price * ticket.quantity,
          // Add seat information if available
          seats: seatInfo.selectedSeats || [],
        };
      });
  };

  // ✅ ADD: Load event and initialize checkout useEffect
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setIsLoading(true);

        // Load event details
        const eventResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/views/${params.eventId}`,
          {
            credentials: 'include',
          }
        );

        if (!eventResponse.ok) {
          throw new Error('Failed to load event details');
        }

        const eventData = await eventResponse.json();
        setEvent(eventData);

        // Check if we have ticket selection in Redux
        const hasReduxSession =
          ticketPurchaseState.sessionActive &&
          ticketPurchaseState.eventId === params.eventId &&
          selectedTickets.length > 0;

        if (hasReduxSession) {
          console.log('✅ Using existing Redux session');

          // Update buyer info with user data if not already set
          if (user && !buyerInfo.firstName && !buyerInfo.lastName) {
            dispatch(
              updateBuyerInfo({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
              })
            );
          }

          // Set current step to checkout if coming from ticket selection
          if (currentStep === 'ticket-selection') {
            dispatch(setCurrentStep('checkout'));
          }
           // Initialize refund policy info for paid events
          if (eventData.isPaid && eventData.refundPolicy) {
            dispatch(setRefundPolicyInfo({
              policyType: eventData.refundPolicy.processingFeePolicy || 'non-refundable',
              policyText: eventData.refundPolicy.policyText || '',
              policyDisplayed: true
            }));
          }
        } else {
          // Fallback: Try to get data from sessionStorage and initialize Redux
          console.log(
            '⚠️ No Redux session found, checking sessionStorage fallback'
          );

          const storedSelection = sessionStorage.getItem('ticketSelection');

          if (!storedSelection) {
            alert('No ticket selection found. Please select tickets first.');
            router.push(`/events/views/${params.eventId}`);
            return;
          }

          const selection = JSON.parse(storedSelection);

          // Validate selection hasn't expired (10 minutes max)
          const selectionAge = Date.now() - selection.timestamp;
          if (selectionAge > 10 * 60 * 1000) {
            alert(
              'Your ticket selection has expired. Please select tickets again.'
            );
            sessionStorage.removeItem('ticketSelection');
            router.push(`/events/views/${params.eventId}`);
            return;
          }

          // Validate selection is for correct event
          if (selection.eventId !== params.eventId) {
            alert('Invalid ticket selection. Please select tickets again.');
            sessionStorage.removeItem('ticketSelection');
            router.push(`/events/views/${params.eventId}`);
            return;
          }

          // Initialize Redux and populate data
          await dispatch(initializePurchaseSession({ eventId: params.eventId }));
          
          // Set step to details
          dispatch(setCurrentStep('details'));
        }

        setInitializationAttempted(true);
      } catch (error) {
        console.error('Error loading checkout data:', error);
        alert('Error loading checkout page. Please try again.');
        router.push(`/events/views/${params.eventId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.eventId && !initializationAttempted) {
      loadCheckoutData();
    }
  }, [params.eventId, router, user, dispatch, initializationAttempted]);

  // ✅ DERIVED VALUES
  const { date, time } = getFormattedDateTime();
  const selectedTicketsDisplay = getSelectedTickets();

  // ✅ EARLY RETURNS
  // Loading state
  if (isLoading) {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        {seatInfo.requiresSeats && params.eventId && (
          <SeatSocketListener eventId={params.eventId} />
        )}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </RequireLogin>
    );
  }

  // Error state - no ticket selection found
  if (!event || selectedTickets.length === 0) {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        {seatInfo.requiresSeats && params.eventId && (
          <SeatSocketListener eventId={params.eventId} />
        )}
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Checkout Error
            </h2>
            <p className="text-gray-600 mb-6">
              No ticket selection found. Please select tickets first.
            </p>
            <button
              onClick={() => router.push(`/events/views/${params.eventId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Event
            </button>
          </div>
        </div>
      </RequireLogin>
    );
  }

  // Success Step
  if (currentStep === 'complete' || paymentStatus === 'succeeded') {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaCheckCircle className="mx-auto text-6xl text-green-600 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Payment Successful!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Your tickets have been purchased successfully.
              </p>

              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">
                  What's Next?
                </h3>
                <ul className="text-green-700 space-y-1">
                  <li>📧 Check your email for confirmation and tickets</li>
                  <li>🎫 Your tickets will be delivered within 5 minutes</li>
                  <li>📱 Save your tickets to your phone for easy access</li>
                  <li>🎪 Present your tickets at the event entrance</li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => router.push('/users/profile/mytickets')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View My Tickets
                </button>

                <button
                  onClick={() => {
                    dispatch(resetPurchaseSession());
                    router.push(`/events/views/${params.eventId}`);
                  }}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Back to Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin message="You must be logged in to complete your purchase.">
      {/* Add socket listener for real-time seat updates */}
      {seatInfo.requiresSeats && params.eventId && (
        <SeatSocketListener eventId={params.eventId} />
      )}
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={
                currentStep === 'payment'
                  ? handleBackToDetails
                  : handleBackToTickets
              }
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              {currentStep === 'payment'
                ? 'Back to Details'
                : (seatInfo.requiresSeats || event?.seatingLayout === 'assigned' 
                   ? 'Back to Seat Selection' 
                   : 'Back to Ticket Selection')}
            </button>

            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Purchase
            </h1>
            <p className="text-gray-600 mt-2">
              {currentStep === 'details'
                ? 'Review your order and enter your details'
                : 'Enter your payment information'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div
                className={`flex items-center ${
                  currentStep === 'details' ? 'text-blue-600' : 'text-green-600'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'details'
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-600 text-white'
                  }`}
                >
                  {currentStep === 'details' ? '1' : <FaCheckCircle />}
                </div>
                <span className="ml-2 font-medium">Details</span>
              </div>

              <div
                className={`w-16 h-1 ${
                  currentStep === 'payment' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>

              <div
                className={`flex items-center ${
                  currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === 'payment'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* ✅ Seat reservation timer - standalone */}
{currentReservation && currentReservation.reservedUntil ? (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
    <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
      <FaChair className="mr-2" />
      Seat Reservation Active
    </h3>
    <p className="text-xs text-amber-700 mb-3">
      Complete payment before timer expires or seats will be automatically released.
    </p>
    <SeatReservationTimer
      expiryTime={currentReservation.reservedUntil}
      onExpire={handleTimerExpire}
      eventId={params.eventId}
      disabled={seatSliceLoading}
    />
    
    <button
      onClick={handleManualCleanup}
      disabled={seatSliceLoading}
      className="mt-2 w-full px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded transition-colors disabled:opacity-50"
    >
      {seatSliceLoading ? 'Releasing...' : 'Release Seats Manually'}
    </button>
  </div>
) : seatInfo.requiresSeats && !currentReservation ? (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
      <FaChair className="mr-2" />
      Timer Expired
    </h3>
    <p className="text-xs text-red-700">
      Please select your seats again using the "Back to Seat Selection" button above.
    </p>
  </div>
) : null}
              {currentStep === 'details' ? (
                /* Details Step */
                <>


                  {/* Buyer Information Form */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <FaUser className="mr-2 text-blue-600" />
                      Buyer Information
                    </h2>

                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={buyerInfo.firstName || ''}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.firstName
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                            placeholder="Enter your first name"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.firstName}
                            </p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={buyerInfo.lastName || ''}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.lastName
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                            placeholder="Enter your last name"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={buyerInfo.email || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.email
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                            placeholder="Enter your email address"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={buyerInfo.phone || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.phone
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Terms Agreement */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={buyerInfo.agreeToTerms || false}
                          onChange={handleInputChange}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          I agree to the{' '}
                          <a
                            href="/support/terms"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            Terms and Conditions
                          </a>{' '}
                          and{' '}
                          <a
                            href="/support/privacy"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-sm text-red-600">
                          {errors.agreeToTerms}
                        </p>
                      )}

                       {/* Refund Policy Section - Only for paid events */}
                      {event?.isPaid && event?.refundPolicy && (
                        <div className="mt-6 border-t pt-6">
                          <RefundPolicyDisplay 
                            refundPolicy={event.refundPolicy}
                            variant="checkout"
                          />

                          {/* Mandatory Refund Policy Acceptance */}
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start">
                              <input
                                type="checkbox"
                                name="refundPolicyAccepted"
                                checked={buyerInfo.refundPolicyAccepted || false}
                                onChange={(e) => handleRefundPolicyAcceptance(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label className="ml-2 text-sm text-gray-700">
                                <span className="font-medium text-gray-900">
                                  I acknowledge and accept the refund policy stated above. *
                                </span>
                                <br />
                                <span className="text-gray-600 text-xs mt-1 block">
                                  This policy will apply to any refunds processed for this purchase.
                                </span>
                              </label>
                            </div>
                            {errors.refundPolicyAccepted && (
                              <p className="mt-2 text-sm text-red-600 ml-6">
                                {errors.refundPolicyAccepted}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Proceed to Payment Button */}
                      <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessing || loading.creatingPayment}
                        className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
                          isProcessing || loading.creatingPayment
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isProcessing || loading.creatingPayment ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Preparing Payment...
                          </>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </button>

                      {/* Error Display */}
                      {(errors.payment || purchaseError) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                            <p className="text-sm text-red-700">
                              {errors.payment || purchaseError}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Payment Step */
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">
                    Payment Information
                  </h2>

                  {clientSecret ? (
                    <StripePaymentForm
                      clientSecret={clientSecret}
                       stripeAccountId={ticketPurchaseState.stripeAccountId}
                      buyerInfo={buyerInfo}
                      totalAmount={totals.total}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={isProcessing || loading.confirmingPayment}
                    />
                  ) : (
                    // Loading state while payment intent is being created
                    <div className="text-center py-12">
                      <FaSpinner className="animate-spin mx-auto text-4xl text-blue-600 mb-4" />
                      <p className="text-gray-600 text-lg">
                        Preparing secure payment...
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        This usually takes just a few seconds
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* ✅ FIXED: Loading overlay using Redux slice state (like SeatMapSelection) */}
              {seatSliceLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Releasing seats and redirecting...
                    </p>
                  </div>
                </div>
              )}
            </div>

{/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Your existing PaymentSummary component */}
                <PaymentSummary
                  event={event}
                  selectedTickets={selectedTicketsDisplay}
                  totals={totals}
                  buyerInfo={currentStep === 'payment' ? buyerInfo : null}
                  selectedSeats={seatInfo.selectedSeats}
                  formatSelectedSeats={formatSelectedSeats}
                  showEventDetails={true}
                  showBuyerInfo={currentStep === 'payment'}
                  className="sticky top-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireLogin>
  );
};

export default CheckoutPage;