// app/checkout/events/[eventId]/page.jsx

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaExclamationTriangle,
  FaSpinner,
  FaCheckCircle,
  FaChair,
  FaTicketAlt,
  FaChevronUp,
  FaChevronDown,
  FaDownload,
  FaReceipt,
  FaTag,
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import { generateTicketsPDF } from '@/utils/paidEventTicketGenerator';
import { toast } from 'react-toastify';
import RequireLogin from '@/components/Auth/RequireLogin';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import PaymentSummary from '@/components/payments/PaymentSummary';
import RefundPolicyDisplay from '@/components/events/refunds/RefundPolicyDisplay';
import SeatSocketListenerNoRedux from '@/components/events/seats/SeatSocketListenerNoRedux';
import ReservationTimer from '@/components/events/ReservationTimer';

const CheckoutPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  // Guests get everything by email and cannot reach the member profile pages (the gate
  // redirects them out), so hide member-only links on the success screen for a guest.
  const isGuest = user?.role === 'guest';

  // State from reservation API
  const [reservation, setReservation] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [buyerInfo, setBuyerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreeToTerms: false
  });
  const [formResponses, setFormResponses] = useState({});
  const [refundPolicyAccepted, setRefundPolicyAccepted] = useState(false);
  const [refundPolicyInfo, setRefundPolicyInfo] = useState(null);

  // Local state
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ status: null, clientSecret: null, amount: 0 });
  const [purchaseError, setPurchaseError] = useState(null);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);

  // Discount code (S3). appliedDiscount holds the server-validated summary numbers.
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null); // { code, kind, value, subtotal, discountAmount, total }
  const [discountError, setDiscountError] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  // Two-step process state
  const [currentStep, setCurrentStep] = useState('details'); // 'details' or 'payment'
  const [showMobileOrderSummary, setShowMobileOrderSummary] = useState(false);
  
  // Ticket download state
  const [isDownloadingTickets, setIsDownloadingTickets] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState(null);
  
  // Ref to track if reservation is currently being fetched
  const isFetchingReservation = useRef(false);

  // One-time latch: confirm-payment must run only once per successful charge. Set on entry,
  // reset only if the confirm fails (so a real retry is allowed). Prevents a duplicate
  // confirm-payment request from a refresh / retry / re-render (backend is idempotent too).
  const hasConfirmedRef = useRef(false);

  // Fetch reservation data
  const fetchReservation = useCallback(async () => {
    if (!params.eventId || !user) {
      setReservationLoading(false);
      return;
    }
    
    // Prevent duplicate fetches
    if (isFetchingReservation.current) return;

    try {
      isFetchingReservation.current = true;
      setReservationLoading(true);
      console.log('Fetching reservation for event:', params.eventId);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/reservation`,
        { withCredentials: true }
      );
      console.log('Reservation API response:', response.data);

      if (response.data.success && response.data.reservation) {
        const res = response.data.reservation;
        console.log('Checkout: Fetched reservation:', res);
        console.log('Checkout: Reservation tickets:', res.tickets);
        console.log('Checkout: Total amount:', res.totalAmount);
        console.log('Checkout: Seat IDs:', res.seatIds);
        setReservation(res);
        
        // Ensure tickets have all required fields
        if (res.tickets && res.tickets.length > 0) {
          // Check if tickets have all required properties
          const validTickets = res.tickets.filter(t => 
            t.ticketTypeId && t.quantity && t.hasOwnProperty('price') && t.ticketName
          );
          
          if (validTickets.length !== res.tickets.length) {
            console.warn('Some tickets are missing required fields:', res.tickets);
          }
          
          setSelectedTickets(res.tickets);
        } else {
          console.warn('No tickets found in reservation:', res);
          setSelectedTickets([]);
        }
        
        // Pre-fill buyer info with user data (NOT from reservation)
        if (user) {
          setBuyerInfo({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: '',
            agreeToTerms: false
          });
        }
        
        // Load form responses from sessionStorage if available
        const storedFormResponses = sessionStorage.getItem(`formResponses_${params.eventId}`);
        if (storedFormResponses) {
          setFormResponses(JSON.parse(storedFormResponses));
        }
      } else {
        // No reservation found
        setErrors({ general: 'No active reservation found. Please select tickets first.' });
        setTimeout(() => {
          router.push(`/events/tickets/${params.eventId}`);
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setErrors({ general: 'No active reservation found. Please select tickets first.' });
        setTimeout(() => {
          router.push(`/events/tickets/${params.eventId}`);
        }, 2000);
      } else {
        console.error('Error fetching reservation:', error);
        setPurchaseError('Failed to load reservation data');
      }
    } finally {
      setReservationLoading(false);
      isFetchingReservation.current = false;
    }
  }, [params.eventId, user, router]);

  // Socket event handler
  const handleSeatUpdate = useCallback((data) => {
    console.log('🔄 Checkout: Received seat update:', data);
    
    // Refetch reservation to get latest state
    fetchReservation();
  }, [fetchReservation]);

  // Handle input change for buyer info
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedInfo = { ...buyerInfo, [name]: newValue };
    setBuyerInfo(updatedInfo);
  };

  // Remove buyer info backend update - buyer info stays local until payment
  // Buyer info is only saved to paidTicket and eventInvoice after successful payment

  // Initialize on mount
  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  // Check if event has seats
  const hasSeatingLayout = event?.seatingLayout && event.seatingLayout.length > 0;
  const requiresSeats = hasSeatingLayout && reservation?.seatIds;

  // Calculate totals - memoized to prevent excessive recalculation
  const ticketTotals = useMemo(() => {
    const totalQuantity = selectedTickets.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const totalPrice = selectedTickets.reduce((sum, t) => {
      // A bundle line is packPrice x packs, not price x people (events-bundle-pricing.md D11).
      const size = t.bundleSize && t.bundleSize >= 2 ? t.bundleSize : 1;
      const units = size > 1 ? (t.quantity || 0) / size : (t.quantity || 0);
      return sum + ((t.price || 0) * units);
    }, 0);

    return { totalQuantity, totalPrice };
  }, [selectedTickets, reservation?.totalAmount]);

  // Payment states
  const isPaymentPending = paymentStatus?.status === 'pending' || paymentStatus?.status === 'processing';

  // Calculate seat info and totals
  const seatInfo = {
    requiresSeats: event?.seatSelection === 'required',
    selectedSeats: reservation?.seatIds || []
  };

  // Simple totals - memoized to prevent recalculation
  const totals = useMemo(() => {
    // Use reservation's totalAmount if available, otherwise calculate from tickets
    const baseTotal = reservation?.totalAmount || ticketTotals.totalPrice;

    // When a discount is applied, use the server-validated numbers (authoritative; Option A
    // summary line). create-payment-intent re-validates and is the final word on the charge.
    if (appliedDiscount && appliedDiscount.discountAmount > 0) {
      // "Applies to" label: name the covered ticket types in the cart; collapse to "all
      // tickets" when the code covers every type the buyer is purchasing.
      const cartNames = [...new Set(selectedTickets.filter(t => t.quantity > 0).map(t => t.ticketName))];
      const covered = (appliedDiscount.appliesToTicketTypes || []).filter(n => cartNames.includes(n));
      const discountScopeLabel = covered.join(', '); // list the covered ticket-type names

      return {
        subtotal: appliedDiscount.subtotal,
        discountCode: appliedDiscount.code,
        discountAmount: appliedDiscount.discountAmount,
        discountScopeLabel,
        gst: 0,
        serviceFee: 0,
        processingFee: 0,
        total: appliedDiscount.total,
        totalQuantity: ticketTotals.totalQuantity
      };
    }

    return {
      subtotal: baseTotal,
      discountCode: null,
      discountAmount: 0,
      gst: 0, // GST is display only, not calculated
      serviceFee: 0, // No service fee shown to customer
      processingFee: 0, // No processing fee shown to customer
      total: baseTotal, // Total equals subtotal
      totalQuantity: ticketTotals.totalQuantity
    };
  }, [reservation?.totalAmount, ticketTotals, appliedDiscount, selectedTickets]);

  // Format selected tickets for PaymentSummary - memoized. A bundle shows as ONE line at the pack
  // price with "admits N" (events-bundle-pricing.md D8): quantity is packs, totalPrice is
  // packPrice x packs - never price x people.
  const formattedTickets = useMemo(() => {
    return selectedTickets.map(ticket => {
      const size = ticket.bundleSize && ticket.bundleSize >= 2 ? ticket.bundleSize : 1;
      const isPack = size > 1;
      const units = isPack ? (ticket.quantity || 0) / size : (ticket.quantity || 0);
      return {
        _id: ticket.ticketTypeId,
        name: isPack ? `${ticket.ticketName || 'Ticket'} (admits ${size})` : (ticket.ticketName || 'Ticket'),
        quantity: units,
        price: ticket.price,
        totalPrice: ticket.price * units
      };
    });
  }, [selectedTickets]);

  // Format selected seats for display
  const formatSelectedSeats = () => {
    if (!reservation?.seatIds || reservation.seatIds.length === 0) {
      return 'No seats selected';
    }
    return reservation.seatIds.join(', ');
  };

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/views/${params.eventId}`
        );
        
        // Log the response status and URL
        console.log('Event fetch URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/views/${params.eventId}`);
        console.log('Event fetch response status:', response.status);
        
        const data = response.data;
        
        if (data.event) {
          console.log('Checkout: Event loaded:', data.event);
          console.log('Checkout: GST Included:', data.event.gstIncluded);
          console.log('Checkout: Refund Policy:', data.event.refundPolicy);
          setEvent(data.event);
          setRefundPolicyInfo(data.event.refundPolicy || null);
        } else if (data) {
          // Maybe the event is returned directly without wrapper
          console.log('Checkout: Event data structure:', data);
          setEvent(data);
          setRefundPolicyInfo(data.refundPolicy || null);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        console.error('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [params.eventId]);

  // Enrich ticket data when event is loaded
  useEffect(() => {
    if (event && event.ticketTypes && reservation && selectedTickets.length > 0) {
      const needsEnrichment = selectedTickets.some(ticket => !ticket.ticketName);
      
      if (needsEnrichment) {
        const enrichedTickets = selectedTickets.map(ticket => {
          const ticketType = event.ticketTypes.find(
            t => t._id === ticket.ticketTypeId
          );
          
          if (ticketType && !ticket.ticketName) {
            console.log('Enriching ticket:', ticket.ticketTypeId, 'with', ticketType.name);
            return {
              ...ticket,
              ticketName: ticketType.name,
              price: ticket.price !== undefined ? ticket.price : ticketType.price,
              // Keep the pack size so the summary can show "admits N" (events-bundle-pricing.md).
              bundleSize: ticket.bundleSize !== undefined ? ticket.bundleSize : ticketType.bundleSize
            };
          }
          return ticket;
        });
        
        console.log('Setting enriched tickets:', enrichedTickets);
        setSelectedTickets(enrichedTickets);
      }
    }
  }, [event]); // Only depend on event to avoid loops

  // Form validation
  const validateBuyerInfo = () => {
    const newErrors = {};
    if (!buyerInfo.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!buyerInfo.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!buyerInfo.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(buyerInfo.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!buyerInfo.phone?.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!buyerInfo.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    if (event?.isPaid && event?.refundPolicy && !refundPolicyAccepted) {
      newErrors.refundPolicyAccepted = 'You must accept the refund policy';
    }
    return newErrors;
  };

  // Validate seat count
  const validateSeatCount = () => {
    if (requiresSeats && reservation) {
      const totalTickets = selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      const selectedSeatCount = reservation.seatIds?.length || 0;
      
      if (selectedSeatCount !== totalTickets) {
        return `Please select exactly ${totalTickets} seat${totalTickets > 1 ? 's' : ''}. Currently selected: ${selectedSeatCount}`;
      }
    }
    return null;
  };

  // Handle proceed to payment step
  const handleProceedToPayment = () => {
    const validationErrors = validateBuyerInfo();
    const seatError = validateSeatCount();
    
    if (Object.keys(validationErrors).length > 0 || seatError) {
      setErrors({ ...validationErrors, seats: seatError });
      return;
    }

    setErrors({});
    setCurrentStep('payment');
    
    // Create payment intent when moving to payment step
    // Add small delay to ensure state is updated
    setTimeout(() => {
      handleCreatePaymentIntent();
    }, 100);
  };

  // tickets map (ticketTypeId -> qty) — shared by validate-discount and create-payment-intent
  const buildTicketsMap = useCallback(() => (
    selectedTickets.reduce((acc, t) => { acc[t.ticketTypeId] = t.quantity; return acc; }, {})
  ), [selectedTickets]);

  // Apply a discount code (S3). Read-only validate-discount call; create-payment-intent
  // re-validates authoritatively at pay time.
  const handleApplyDiscount = async () => {
    const code = (discountCodeInput || '').trim();
    if (!code) { setDiscountError('Enter a discount code.'); return; }
    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/validate-discount`,
        { code, tickets: buildTicketsMap() },
        { withCredentials: true }
      );
      if (data?.valid) {
        setAppliedDiscount({
          code: data.code,
          kind: data.kind,
          value: data.value,
          appliesToTicketTypes: data.appliesToTicketTypes || [],
          subtotal: data.subtotal,
          discountAmount: data.discountAmount,
          total: data.total,
        });
        setDiscountError(null);
      } else {
        setAppliedDiscount(null);
        setDiscountError(data?.message || 'This discount code cannot be applied.');
      }
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError(err.response?.data?.message || 'Could not validate the code. Please try again.');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
    setDiscountCodeInput('');
  };

  // Handle payment intent creation
  const handleCreatePaymentIntent = async () => {
    setIsProcessing(true);
    
    console.log('Creating payment intent with:', {
      reservationTotal: reservation?.totalAmount,
      calculatedTotal: totals.total,
      selectedTickets: selectedTickets
    });

    try {
      // Trust the reservation system - no need for pre-flight checks
      // The reservation already locks tickets/seats and backend validates during payment
      
      // Create payment intent
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/create-payment-intent`,
        {
          buyerInfo: {
            ...buyerInfo,
            refundPolicyAccepted: refundPolicyAccepted
          },
          tickets: selectedTickets.reduce((acc, ticket) => {
            acc[ticket.ticketTypeId] = ticket.quantity;
            return acc;
          }, {}),
          // Discount (S3/S4). Backend re-validates and is authoritative for the charge.
          ...(appliedDiscount?.code ? { discountCode: appliedDiscount.code } : {})
        },
        { withCredentials: true }
      );

      if (response.data.clientSecret) {
        // Prefer the backend's discounted total (it ran the min-charge guard); fall back to local.
        const currentAmount = response.data.pricing?.total ?? appliedDiscount?.total ?? reservation?.totalAmount ?? totals.total ?? 0;
        console.log('Payment intent created. Setting amount:', {
          currentAmount: currentAmount,
          reservationTotal: reservation?.totalAmount,
          ticketTotalsPrice: ticketTotals.totalPrice,
          totalsTotal: totals.total,
          finalTotal: reservation?.totalAmount || totals.total || 0
        });
        setPaymentStatus({ 
          status: 'ready', 
          clientSecret: response.data.clientSecret,
          stripeAccountId: response.data.stripeAccountId,
          amount: currentAmount
        });
      }
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      
      // Provide user-friendly generic messages
      let errorMessage = 'Unable to process payment at this time. Please try again.';
      
      // Discount became invalid between Apply and Pay (expired / used up). Drop it and ask the
      // buyer to retry without the code (honor-price only applies AFTER a successful charge).
      if (error.response?.data?.errorCode === 'INVALID_DISCOUNT') {
        setAppliedDiscount(null);
        setDiscountError(error.response?.data?.message || 'This discount code is no longer valid. It has been removed — please try again.');
        setErrors({ payment: 'The discount code is no longer valid and was removed. Please review your total and try again.' });
        setPaymentStatus({ status: null, clientSecret: null, amount: 0 });
        setIsProcessing(false);
        return;
      }

      // Check for specific error scenarios
      if (error.response?.status === 409 || error.response?.data?.message?.includes('capacity')) {
        errorMessage = 'Sorry, these tickets are no longer available. Someone else may have just completed their purchase. Please go back and try selecting different tickets.';
      } else if (error.response?.data?.message?.includes('seat')) {
        errorMessage = 'Sorry, some of your selected seats are no longer available. Please go back and select different seats.';
      } else if (error.response?.data?.message?.includes('expired')) {
        errorMessage = 'Your reservation has expired. Please start your booking again.';
      }
      
      setErrors({ 
        payment: errorMessage
      });
      setPaymentStatus({ status: null, clientSecret: null, amount: 0 });
    } finally {
      setIsProcessing(false);
    }
  };


  // Handle navigation
  const handleBackToSeats = () => {
    router.push(`/events/seats/${params.eventId}`);
  };

  const handleBackToTickets = () => {
    router.push(`/events/tickets/${params.eventId}`);
  };
  
  const handleBackToDetails = () => {
    setCurrentStep('details');
    setErrors({});
  };

  const shouldDisableProceed = () => {
    // Check if required fields are filled
    return !buyerInfo.firstName || !buyerInfo.lastName || !buyerInfo.email || !buyerInfo.phone ||
           !buyerInfo.agreeToTerms ||
           (refundPolicyInfo && !refundPolicyAccepted);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Guard: only confirm once per successful charge. If this fires again (refresh, retry,
    // re-render) bail immediately so we never send a duplicate confirm-payment request.
    if (hasConfirmedRef.current) {
      console.log('Confirm already in progress/done for this payment — ignoring duplicate fire');
      return;
    }
    hasConfirmedRef.current = true;

    console.log('Payment successful, confirming with backend:', paymentIntent.id);
    setIsProcessing(true);
    
    try {
      // Convert selectedTickets array to tickets object that backend expects
      const ticketsObject = selectedTickets.reduce((acc, ticket) => {
        acc[ticket.ticketTypeId] = ticket.quantity;
        return acc;
      }, {});

      console.log('Sending payment confirmation with:', {
        paymentIntentId: paymentIntent.id,
        tickets: ticketsObject,
        buyerInfo: buyerInfo
      });

      // Call backend to confirm payment and create tickets
      const confirmResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/confirm-payment`,
        {
          paymentIntentId: paymentIntent.id,
          tickets: ticketsObject,
          buyerInfo: buyerInfo,
          formResponses: formResponses || {}
        },
        { withCredentials: true }
      );
      
      if (confirmResponse.data.success) {
        console.log('✅ Payment confirmed via backend');
        
        // Store the invoice number for ticket download
        if (confirmResponse.data.invoiceNumber) {
          setPurchaseInvoiceNumber(confirmResponse.data.invoiceNumber);
        }
        
        // Clean up reservation data (non-blocking for better UX)
        try {
          // Clear all reservation-related session storage immediately
          sessionStorage.removeItem(`reservation_${params.eventId}`);
          sessionStorage.removeItem(`selectedTickets_${params.eventId}`);
          sessionStorage.removeItem(`formResponses_${params.eventId}`);
          
          // Clear reservation state
          setReservation(null);
          
          // Delete reservation from backend in background (non-blocking)
          if (reservation?._id) {
            axios.delete(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/reservation/${reservation._id}`,
              { withCredentials: true }
            ).catch(err => {
              // Ignore errors - backend will auto-cleanup
              if (err.response?.status !== 404) {
                console.log('Reservation cleanup note:', err.message);
              }
            });
          }
          
          console.log('✅ Cleanup completed');
        } catch (cleanupError) {
          console.error('Cleanup error (non-blocking):', cleanupError);
          // Don't block success flow for cleanup errors
        }
        
        // NOW show success state after cleanup is done
        setCurrentStep('complete');
        setIsPaymentSuccessful(true);
        setPaymentStatus({ ...paymentStatus, status: 'succeeded' });
      } else {
        throw new Error(confirmResponse.data.message || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);

      // Un-latch so the buyer can retry a genuinely failed confirm. The card is already
      // charged and the backend confirm-payment is idempotent, so re-sending is safe.
      hasConfirmedRef.current = false;

      // Check if this is a capacity conflict error
      let errorMessage = error.response?.data?.message || error.message || 'Payment successful but failed to create tickets. Please contact support.';
      
      setErrors({ payment: errorMessage });
      setIsPaymentSuccessful(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Prevent going back to checkout after successful payment
  // This hook must be called before any conditional returns
  useEffect(() => {
    if (isPaymentSuccessful && !reservation && selectedTickets.length === 0) {
      // Payment was successful but data is cleared - redirect to events
      router.push('/events');
    }
  }, [isPaymentSuccessful, reservation, selectedTickets.length, router]);

  // Download tickets function
  const downloadTickets = async () => {
    setIsDownloadingTickets(true);
    setDownloadError(null);
    
    try {
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('📥 Fetching tickets... Invoice:', purchaseInvoiceNumber);
      
      // Fetch user's tickets using the same API as MyTickets page
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/paid/my-paid-tickets`,
        { withCredentials: true }
      );
      
      console.log('📥 Received tickets:', response.data.tickets?.length || 0);
      
      if (response.data.success) {
        let ticketsToDownload = [];
        
        // If we have the invoice number from the purchase, use it
        if (purchaseInvoiceNumber) {
          console.log('📥 Filtering by invoice:', purchaseInvoiceNumber);
          ticketsToDownload = response.data.tickets.filter(ticket => 
            ticket.invoiceNumber === purchaseInvoiceNumber
          );
          console.log('📥 Found tickets for invoice:', ticketsToDownload.length);
        } else {
          console.log('📥 No invoice number, using fallback method');
          // Fallback: Filter by event and recent time (shouldn't happen with updated backend)
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          
          const recentEventTickets = response.data.tickets.filter(ticket => {
            const matchesEvent = ticket.event === params.eventId || 
                                ticket.eventSnapshot?.eventCode === params.eventId;
            const isRecent = new Date(ticket.createdAt) > tenMinutesAgo;
            
            return matchesEvent && isRecent;
          });
          
          if (recentEventTickets.length > 0) {
            // Group by invoice and take the most recent
            const ticketsByInvoice = recentEventTickets.reduce((acc, ticket) => {
              const invoiceNum = ticket.invoiceNumber;
              if (invoiceNum) {
                if (!acc[invoiceNum]) {
                  acc[invoiceNum] = [];
                }
                acc[invoiceNum].push(ticket);
              }
              return acc;
            }, {});
            
            const invoiceNumbers = Object.keys(ticketsByInvoice);
            if (invoiceNumbers.length > 0) {
              const sortedInvoices = invoiceNumbers.sort((a, b) => {
                const aNewestTicket = Math.max(...ticketsByInvoice[a].map(t => new Date(t.createdAt).getTime()));
                const bNewestTicket = Math.max(...ticketsByInvoice[b].map(t => new Date(t.createdAt).getTime()));
                return bNewestTicket - aNewestTicket;
              });
              
              ticketsToDownload = ticketsByInvoice[sortedInvoices[0]];
            }
          }
        }
        
        if (ticketsToDownload.length === 0) {
          setDownloadError('Tickets not found. They may still be processing. Please try again in a moment.');
          setIsDownloadingTickets(false);
          return;
        }
        
        // Use event info from first ticket's snapshot
        const eventInfo = ticketsToDownload[0].eventSnapshot || {};
        
        // Generate PDF using common utility with filtered tickets
        generateTicketsPDF(ticketsToDownload, eventInfo, params.eventId);
        
        // Keep loading state for a bit longer so user sees it
        await new Promise(resolve => setTimeout(resolve, 800));
        
        toast.success('PDF download started');
        setIsDownloadingTickets(false);
      } else {
        setDownloadError('Failed to download tickets. Please try again later.');
        setIsDownloadingTickets(false);
      }
    } catch (error) {
      console.error('Error downloading tickets:', error);
      setDownloadError('Failed to download tickets. Please try again later.');
      toast.error('Failed to generate PDF');
      setIsDownloadingTickets(false);
    }
  };

  // Loading states
  if (!user) {
    return <RequireLogin message="Please log in to complete your purchase" />;
  }

  if (isLoading || reservationLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if payment was successful FIRST - this should take precedence
  if (isPaymentSuccessful) {
    // Don't show any error modals if payment was successful
    // The success UI is handled below
    if (currentStep !== 'complete') {
      setCurrentStep('complete');
    }
  } else if (selectedTickets.length === 0 && !reservationLoading) {
    // Only show the "No Tickets Selected" error if payment was NOT successful
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full">
          <FaExclamationTriangle className="text-amber-500 text-4xl sm:text-5xl mb-4 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 text-slate-800">
            No Tickets Selected
          </h2>
          <p className="text-slate-600 text-center mb-6 text-sm sm:text-base">
            {reservation ? 
              'Your reservation exists but no ticket data was found. Please try selecting tickets again.' :
              'Please select tickets before proceeding to checkout.'}
          </p>
          {reservation && (
            <p className="text-xs text-slate-500 text-center mb-4">
              Reservation ID: {reservation._id}
            </p>
          )}
          <button
            onClick={() => router.push(`/events/tickets/${params.eventId}`)}
            className="w-full bg-teal-600 text-white py-2.5 sm:py-3 rounded-md sm:rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm sm:text-base"
          >
            Back to Ticket Selection
          </button>
        </div>
      </div>
    );
  }

  // Success Step - Mobile-first optimized
  if (currentStep === 'complete' || (paymentStatus?.status === 'succeeded' && isPaymentSuccessful)) {
    return (
      <div>
        <div className="max-w-lg lg:max-w-2xl mx-auto space-y-3 sm:space-y-4">
          {/* Success Modal */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 text-center">
            <FaCheckCircle className="mx-auto text-4xl sm:text-5xl lg:text-6xl text-teal-600 mb-3 sm:mb-4 lg:mb-6" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-2 sm:mb-3 lg:mb-4">
              Payment Successful!
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 mb-3 sm:mb-4 lg:mb-6">
              Your tickets have been purchased successfully.
            </p>

            <div className="bg-teal-50 rounded-md sm:rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 lg:mb-6">
              <h3 className="font-semibold text-teal-800 mb-2 text-sm sm:text-base">
                What's Next?
              </h3>
              <ul className="text-teal-700 space-y-1 text-xs sm:text-sm lg:text-base text-left">
                <li className="flex items-start gap-1.5">
                  <FaEnvelope className="mt-0.5 flex-shrink-0 text-teal-600" />
                  <span>An email is on the way with your event, invoice, and ticket details</span>
                </li>
                {!isGuest && (
                  <>
                    <li className="flex items-start gap-1.5">
                      <FaTicketAlt className="mt-0.5 flex-shrink-0 text-teal-600" />
                      <span>View tickets at <a href="/users/profile/mytickets" className="underline hover:text-teal-800">My Tickets</a></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <FaReceipt className="mt-0.5 flex-shrink-0 text-teal-600" />
                      <span>View invoices at <a href="/users/profile/myinvoices" className="underline hover:text-teal-800">My Invoices</a></span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-1.5">
                  <FaUser className="mt-0.5 flex-shrink-0 text-teal-600" />
                  <span>Enquiries? Visit <a href={`/events/views/${params.eventId}`} className="underline hover:text-teal-800">Event page</a> to contact organiser</span>
                </li>
              </ul>
            </div>

            <button
              onClick={downloadTickets}
              disabled={isDownloadingTickets}
              className={`w-full px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-md sm:rounded-lg transition-colors text-sm sm:text-base font-medium flex items-center justify-center gap-2 ${
                isDownloadingTickets 
                  ? 'bg-teal-400 cursor-not-allowed' 
                  : 'bg-teal-600 hover:bg-teal-700'
              } text-white`}
            >
              {isDownloadingTickets ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 016-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FaDownload />
                  <span>Download Tickets</span>
                </>
              )}
            </button>
            
            {/* Download error message */}
            {downloadError && (
              <div className="mt-3 sm:mt-4 p-3 bg-red-50 border border-red-200 rounded-md sm:rounded-lg">
                <p className="text-xs sm:text-sm text-red-700">
                  {downloadError}
                </p>
              </div>
            )}
          </div>

          {/* Back to Events Button - OUTSIDE modal */}
          <button
            onClick={() => {
              setIsPaymentSuccessful(false);
              setReservation(null);
              setSelectedTickets([]);
              setCurrentStep('details');
              setPaymentStatus({ status: null, clientSecret: null, amount: 0 });
              router.replace('/events');
            }}
            className="w-full px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-slate-200 text-slate-800 rounded-md sm:rounded-lg hover:bg-slate-300 transition-colors text-sm sm:text-base font-medium"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <RequireLogin>
      <div>
        <div>
          {/* Page toolbar (design-system.md section 8): Back pinned left, the "Checkout" title
              centred in the same row (matches the tickets/seats pages). */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute left-0">
              <BackButton
                onClick={() => {
                  if (currentStep === 'payment') {
                    handleBackToDetails();
                  } else {
                    hasSeatingLayout ? router.push(`/events/seats/${params.eventId}`) : router.push(`/events/tickets/${params.eventId}`);
                  }
                }}
              />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
          </div>

          {/* Stepper - centred, below the title. Conforms to section 9: teal current / teal-check
              done / slate upcoming, connector fills teal once passed, flat 14px. */}
          <div data-testid="checkout-stepper" className="flex items-center justify-center mb-4">
              {/* Step 1 - Details (current until the buyer continues, then done). */}
              <div className="flex items-center gap-1.5">
                <div
                  data-testid="step-details"
                  data-state={currentStep === 'details' ? 'current' : 'done'}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-teal-700 text-white text-sm"
                >
                  {currentStep === 'details' ? <span>1</span> : <FaCheckCircle className="w-4 h-4" />}
                </div>
                <span className={`text-sm font-medium ${currentStep === 'details' ? 'text-teal-700' : 'text-slate-500'}`}>Details</span>
              </div>

              {/* Connector - fills teal once step 1 is passed. */}
              <div className={`w-10 h-0.5 mx-3 ${currentStep === 'payment' ? 'bg-teal-700' : 'bg-slate-200'}`}></div>

              {/* Step 2 - Payment (upcoming until reached). */}
              <div className="flex items-center gap-1.5">
                <div
                  data-testid="step-payment"
                  data-state={currentStep === 'payment' ? 'current' : 'upcoming'}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    currentStep === 'payment' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>2</span>
                </div>
                <span className={`text-sm font-medium ${currentStep === 'payment' ? 'text-teal-700' : 'text-slate-500'}`}>Payment</span>
              </div>
            </div>

          {/* Reservation timer - urgency badge, centred. */}
          {reservation && (
            <div className="flex justify-center mb-4">
              <ReservationTimer
                expiresAt={reservation.expiresAt}
                eventId={params.eventId}
                reservationId={reservation._id}
                mode="checkout"
                showClear={false}
                hasSeatingLayout={hasSeatingLayout}
                onExpire={() => {
                  router.push(`/events/tickets/${params.eventId}`);
                }}
                onClear={() => {
                  // Navigate first to avoid showing "No Tickets" modal
                  router.push(`/events/views/${params.eventId}`);
                  // State will be cleared by the ReservationTimer's handleClearReservation
                }}
              />
            </div>
          )}

          {/* Socket Listener */}
          <
            SeatSocketListenerNoRedux 
            eventId={params.eventId} 
            onSeatUpdate={handleSeatUpdate}
          />

          {/* Mobile Order Summary - collapsible bar at the top on mobile (section 11) */}
          <div className="lg:hidden mb-4">
            <button
              data-testid="mobile-order-summary-toggle"
              onClick={() => setShowMobileOrderSummary(!showMobileOrderSummary)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center">
                <FaTicketAlt className="text-teal-700 mr-2 w-4 h-4" />
                <span className="font-semibold text-sm text-slate-900">Order Summary</span>
                <span className="ml-1.5 text-slate-600 text-sm">({totals.totalQuantity || 0} items)</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-teal-700 text-sm mr-1.5">${totals.total?.toFixed(2)}</span>
                {showMobileOrderSummary ? (
                  <FaChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <FaChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </button>
            
            {/* Collapsible Content */}
            {showMobileOrderSummary && (
              <div className="mt-2 transition-all duration-300">
                <PaymentSummary
                  event={event}
                  selectedTickets={formattedTickets}
                  totals={totals}
                  buyerInfo={currentStep === 'payment' ? buyerInfo : null}
                  selectedSeats={reservation?.seatIds}
                  formatSelectedSeats={formatSelectedSeats}
                  showEventDetails={true}
                  showBuyerInfo={currentStep === 'payment'}
                  className="!p-2"
                />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Main Content - Step based */}
            <div className="lg:col-span-2">
              {currentStep === 'details' ? (
                /* Details Step */
                <>
                  {/* Discount Code (S3) — top of the form; it relates to the order total */}
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Discount code
                    </label>
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FaTag className="text-teal-700 w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm text-teal-800 truncate">
                            <span className="font-bold">{appliedDiscount.code}</span> applied
                            {totals.discountScopeLabel ? ` to ${totals.discountScopeLabel}` : ''}
                            {appliedDiscount.discountAmount > 0 && (
                              <span className="text-teal-700"> — you save ${appliedDiscount.discountAmount.toFixed(2)}</span>
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="text-sm text-red-600 hover:text-red-700 font-medium flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 sm:max-w-xs">
                        <input
                          type="text"
                          value={discountCodeInput}
                          onChange={(e) => { setDiscountCodeInput(e.target.value.toUpperCase()); if (discountError) setDiscountError(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyDiscount(); } }}
                          placeholder="Enter code"
                          maxLength={50}
                          className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          disabled={discountLoading || !discountCodeInput.trim()}
                          className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${discountLoading || !discountCodeInput.trim() ? 'bg-teal-700 opacity-50 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'}`}
                        >
                          {discountLoading ? 'Checking…' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {discountError && <p data-testid="discount-error" className="text-red-600 text-xs mt-1">{discountError}</p>}
                  </div>

                  {/* Buyer Information Form (forms guide: 2-col desktop / stacked mobile, top labels
                      + required *, flat text-sm, teal focus ring). */}
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center">
                      <FaUser className="w-4 h-4 mr-2 text-teal-700" />
                      Buyer Information
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={buyerInfo.firstName || ''}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                              errors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                            }`}
                            placeholder="First name"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={buyerInfo.lastName || ''}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                              errors.lastName ? 'border-red-500 bg-red-50' : 'border-slate-300'
                            }`}
                            placeholder="Last name"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      {/* Email + Phone - side by side on desktop */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="email"
                            name="email"
                            value={buyerInfo.email || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                              errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'
                            }`}
                            placeholder="Email address"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone *
                        </label>
                        <div className="relative">
                          <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input
                            type="tel"
                            name="phone"
                            value={buyerInfo.phone || ''}
                            onChange={handleInputChange}
                            className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                              errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'
                            }`}
                            placeholder="Phone number"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                        )}
                      </div>
                      </div>

                      {/* Terms Agreement */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={buyerInfo.agreeToTerms || false}
                          onChange={handleInputChange}
                          className="mt-0.5 w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300"
                        />
                        <label className="ml-2 text-sm text-slate-600">
                          I agree to the{' '}
                          <a
                            href="/support/terms"
                            target="_blank"
                            className="text-teal-700 hover:underline"
                          >
                            Terms
                          </a>{' '}
                          and{' '}
                          <a
                            href="/support/privacy"
                            target="_blank"
                            className="text-teal-700 hover:underline"
                          >
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-xs text-red-600 ml-6">
                          {errors.agreeToTerms}
                        </p>
                      )}

                      {/* Refund Policy Acceptance - Only for paid events */}
                      {event?.isPaid && event?.refundPolicy && (
                        <>
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              name="refundPolicyAccepted"
                              checked={refundPolicyAccepted || false}
                              onChange={(e) => setRefundPolicyAccepted(e.target.checked)}
                              className="mt-0.5 w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300"
                            />
                            <label className="ml-2 text-sm text-slate-600">
                              I accept the organiser refund policy below *
                            </label>
                          </div>
                          {errors.refundPolicyAccepted && (
                            <p className="text-xs text-red-600 ml-6">
                              {errors.refundPolicyAccepted}
                            </p>
                          )}
                        </>
                      )}

                      {/* Refund Policy Display (amber warning callout) - only for paid events */}
                      {event?.isPaid && event?.refundPolicy && (
                        <div className="mt-4">
                          <RefundPolicyDisplay
                            refundPolicy={event.refundPolicy}
                            variant="checkout"
                            showNote={false}
                          />
                        </div>
                      )}

                      {/* Proceed to Payment Button (primary; disabled = teal-700 at 50%) */}
                      <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessing || shouldDisableProceed()}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
                          isProcessing || shouldDisableProceed()
                            ? 'bg-teal-700 opacity-50 cursor-not-allowed'
                            : 'bg-teal-700 hover:bg-teal-800'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <FaSpinner className="animate-spin w-4 h-4" />
                            Processing...
                          </>
                        ) : (
                          'Continue to Payment'
                        )}
                      </button>
                      </div>

                    </div>
                  </div>
                </>
              ) : (
                /* Payment Step */
                <>
                  <div className="relative">
                    {/* Loading overlay during payment processing */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <FaSpinner className="animate-spin mx-auto text-3xl sm:text-4xl text-teal-600 mb-3" />
                          <p className="text-sm sm:text-base font-semibold text-slate-800">
                            Processing Payment...
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            Please do not close this page
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center">
                      Payment Details
                    </h2>
                    
                    {paymentStatus.clientSecret ? (
                      <>
                        {purchaseError && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-2 sm:p-3 mb-3 sm:mb-4">
                            <p className="text-red-800 text-xs sm:text-sm">{purchaseError}</p>
                          </div>
                        )}
                        
                        {errors.payment && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-2 sm:p-3 mb-3 sm:mb-4">
                            <p className="text-red-800 text-xs sm:text-sm">{errors.payment}</p>
                          </div>
                        )}
                        
                        {console.log('StripePaymentForm props:', {
                          totalAmount: paymentStatus.amount,
                          paymentStatusAmount: paymentStatus.amount,
                          reservationTotal: reservation?.totalAmount,
                          totalsTotal: totals.total,
                          clientSecret: paymentStatus.clientSecret ? 'present' : 'missing',
                          stripeAccountId: paymentStatus.stripeAccountId
                        })}
                        <StripePaymentForm
                          key={`stripe-form-${paymentStatus.amount}`}
                          clientSecret={paymentStatus.clientSecret}
                          onSuccess={handlePaymentSuccess}
                          onError={(error) => setErrors({ payment: error.message })}
                          totalAmount={paymentStatus.amount}
                          buyerInfo={buyerInfo}
                          stripeAccountId={paymentStatus.stripeAccountId}
                          disabled={isProcessing}
                        />
                      </>
                    ) : errors.payment ? (
                      // Error state when payment initialization failed
                      <div className="text-center py-6 sm:py-8 lg:py-12">
                        <FaExclamationTriangle className="mx-auto text-4xl sm:text-5xl text-red-500 mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
                          Payment Processing Error
                        </h3>
                        <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                          {errors.payment}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                          <button
                            onClick={async () => {
                              // Clear reservation and redirect to ticket selection
                              try {
                                if (reservation?._id) {
                                  await axios.delete(
                                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/reservation/${reservation._id}`,
                                    { withCredentials: true }
                                  );
                                }
                                // Trigger cleanup
                                await axios.post(
                                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/reservation/cleanup`,
                                  {},
                                  { withCredentials: true }
                                ).catch(() => {}); // Ignore cleanup errors
                              } catch (err) {
                                console.log('Reservation cleanup note:', err.message);
                              }

                              // Clear session storage
                              sessionStorage.removeItem(`reservation_${params.eventId}`);
                              sessionStorage.removeItem(`selectedTickets_${params.eventId}`);

                              // Always go to tickets page to start fresh
                              router.push(`/events/tickets/${params.eventId}`);
                            }}
                            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm sm:text-base"
                          >
                            Try Again
                          </button>

                          <a
                            href="/support/contact"
                            onClick={async (e) => {
                              e.preventDefault();
                              // Clear reservation before navigating to support
                              try {
                                if (reservation?._id) {
                                  await axios.delete(
                                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/reservation/${reservation._id}`,
                                    { withCredentials: true }
                                  );
                                }
                              } catch (err) {
                                console.log('Reservation cleanup note:', err.message);
                              }
                              sessionStorage.removeItem(`reservation_${params.eventId}`);
                              sessionStorage.removeItem(`selectedTickets_${params.eventId}`);
                              router.push('/support/contact');
                            }}
                            className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm sm:text-base"
                          >
                            Contact Support
                          </a>
                        </div>
                      </div>
                    ) : (
                      // Loading state while payment intent is being created
                      <div className="text-center py-6 sm:py-8 lg:py-12">
                        <FaSpinner className="animate-spin mx-auto text-2xl sm:text-3xl lg:text-4xl text-teal-600 mb-2 sm:mb-3 lg:mb-4" />
                        <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                          Preparing secure payment...
                        </p>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1 sm:mt-2">
                          This usually takes just a few seconds
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Success Message */}
              {isPaymentSuccessful && (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
                  <div className="mb-4">
                    <FaCheckCircle className="text-teal-500 text-5xl sm:text-6xl mx-auto" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-slate-600 mb-6">
                    Your tickets have been purchased successfully.
                  </p>
                  <button
                    onClick={() => router.push('/profile/tickets')}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    View My Tickets
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary (Desktop Only) - sticky sidebar (section 11) */}
            <div className="hidden lg:block lg:col-span-1">
              <div data-testid="order-summary" className="sticky top-4 lg:border-l lg:border-slate-200 lg:pl-4 xl:pl-6">
                <PaymentSummary
                  event={event}
                  selectedTickets={formattedTickets}
                  totals={totals}
                  buyerInfo={currentStep === 'payment' ? buyerInfo : null}
                  selectedSeats={reservation?.seatIds}
                  formatSelectedSeats={formatSelectedSeats}
                  showEventDetails={true}
                  showBuyerInfo={currentStep === 'payment'}
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