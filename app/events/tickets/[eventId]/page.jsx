// app/events/tickets/[eventId]/page.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  FaTicketAlt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaChair,
  FaPlus,
  FaMinus,
  FaShoppingCart,
  FaExclamationTriangle,
  FaArrowLeft,
  FaBell,
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import { getEventTicketStatus, getTicketSaleStatus } from '@/utils/events/ticketStatusHelper';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import AttendeeInfoSection from '@/components/events/tickets/AttendeeInfoSection';
import ReservationTimer from '@/components/events/ReservationTimer';

const TicketSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // Event data
  const {
    selectedEvent,
    status: eventStatus,
    error: eventError,
  } = useSelector((state) => state.events);

  // Reservation state (replacing Redux)
  const [reservation, setReservation] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [formResponses, setFormResponses] = useState({});
  const [purchaseError, setPurchaseError] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  
  // Local state for UI
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Event capacity state
  const [eventCapacity, setEventCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(false);
  
  // Calculate totals based on selected tickets
  const totals = {
    totalQuantity: selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
    totalPrice: selectedTickets.reduce((sum, t) => sum + (t.quantity * t.price), 0)
  };
  
  // Determine if can proceed
  // Use the new canBook field which includes user's current reservation
  const hasCapacityIssue = eventCapacity?.canBook !== 'unlimited' && 
    totals.totalQuantity > (eventCapacity?.canBook || 0);
  const canProceedToNext = totals.totalQuantity > 0 && 
    !Object.keys(errors).length && 
    !hasCapacityIssue &&
    !purchaseError;  // Also check for purchase errors

  // Check if event has seating layout
  const hasSeatingLayout =
    selectedEvent?.seatingLayout && selectedEvent.seatingLayout.length > 0;

  // Fetch event data on component mount
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
  }, [eventId, dispatch]);

  // Fetch event capacity
  const fetchCapacity = useCallback(async () => {
    if (!eventId || !selectedEvent) return;
    
    setCapacityLoading(true);
    try {
      // Use authenticated v2 endpoint for purchasing context
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/capacity/v2/auth?context=purchasing`,
        { withCredentials: true }
      );
      console.log('🔍 Capacity response:', response.data.capacity);
      setEventCapacity(response.data.capacity);
    } catch (error) {
      console.error('Error fetching capacity:', error);
      // Set default capacity if error
      setEventCapacity({
        total: selectedEvent.maxAttendees || 100,
        sold: 0,
        available: selectedEvent.maxAttendees || 100,
        userReservation: 0,
        canBook: selectedEvent.maxAttendees || 100,
        isUnlimited: !selectedEvent.maxAttendees,
        status: 'available'
      });
    } finally {
      setCapacityLoading(false);
    }
  }, [eventId, selectedEvent]);

  // Fetch capacity on mount or when event changes
  useEffect(() => {
    fetchCapacity();
  }, [fetchCapacity]);

  // Clear selected tickets if capacity changes and user doesn't have a reservation
  useEffect(() => {
    // If user has selected tickets but no reservation, and capacity shows available tickets
    // This handles the case where another user's reservation expired
    if (!reservation && selectedTickets.length > 0 && eventCapacity?.available > 0) {
      console.log('Clearing stale ticket selection - no reservation but tickets available');
      setSelectedTickets([]);
      setPurchaseError('');
    }
  }, [eventCapacity?.available, reservation]);

  // Auto-refresh capacity when user sees capacity warnings or sold out
  useEffect(() => {
    // Auto-refresh in these scenarios:
    // 1. User has selected tickets but can't book (capacity issue)
    // 2. Event is sold out (to catch when tickets become available)
    const hasCapacityIssue = 
      totals.totalQuantity > 0 && 
      eventCapacity?.canBook !== 'unlimited' &&
      totals.totalQuantity > (eventCapacity?.canBook || 0) &&
      !capacityLoading;
      
    const isSoldOut = eventCapacity?.status === 'sold-out' && !capacityLoading;

    const shouldAutoRefresh = hasCapacityIssue || isSoldOut;

    if (shouldAutoRefresh) {
      console.log('Starting capacity auto-refresh:', { hasCapacityIssue, isSoldOut });
      
      // Refresh every 3 seconds for sold out, 5 seconds for capacity issues
      const interval = isSoldOut ? 3000 : 5000;
      const intervalId = setInterval(() => {
        console.log('Auto-refreshing capacity...');
        fetchCapacity();
      }, interval);

      // Cleanup interval on unmount or when conditions change
      return () => {
        console.log('Stopping capacity auto-refresh');
        clearInterval(intervalId);
      };
    }
  }, [totals.totalQuantity, eventCapacity?.canBook, eventCapacity?.status, capacityLoading, fetchCapacity]);

  // Run cleanup task when tickets page loads
  useEffect(() => {
    if (eventId && selectedEvent?._id && user) {
      // Trigger cleanup in background only for authenticated users
      axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/cleanup`,
        {},
        { withCredentials: true }
      ).catch(err => {
        // Silently handle errors - cleanup is non-critical
        console.log('Cleanup task error (non-critical):', err.response?.status);
      });
    }
  }, [eventId, selectedEvent?._id, user]);

  // Fetch existing reservation when component mounts
  useEffect(() => {
    const fetchReservation = async () => {
      if (!eventId || !user) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation`,
          { withCredentials: true }
        );

        if (response.data.success && response.data.reservation) {
          const res = response.data.reservation;
          setReservation(res);
          
          // Convert reservation tickets to selectedTickets format
          const tickets = res.tickets.map(t => ({
            ticketTypeId: t.ticketTypeId,
            quantity: t.quantity,
            price: t.price,
            name: t.ticketName
          }));
          setSelectedTickets(tickets);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching reservation:', error);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    fetchReservation();
  }, [eventId, user]);

  // Restore form responses from sessionStorage when component mounts
  useEffect(() => {
    if (eventId) {
      const savedFormResponses = sessionStorage.getItem(`formResponses_${eventId}`);
      if (savedFormResponses) {
        try {
          const parsed = JSON.parse(savedFormResponses);
          setFormResponses(parsed);
        } catch (error) {
          console.error('Error parsing saved form responses:', error);
        }
      }
    }
  }, [eventId]);

  // Create or update reservation
  const createOrUpdateReservation = useCallback(async (tickets) => {
    if (!user || !eventId) return;

    setApiLoading(true);
    setPurchaseError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation`,
        {
          tickets: tickets.filter(t => t.quantity > 0).map(t => ({
            ticketTypeId: t.ticketTypeId,
            quantity: t.quantity
          }))
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setReservation({
          _id: response.data.reservationId,
          expiresAt: response.data.expiresAt,
          tickets: response.data.tickets,
          totalAmount: response.data.totalAmount
        });
        
        // Refetch capacity to show updated numbers
        await fetchCapacity();
      }
    } catch (error) {
      // Only log unexpected errors, not business logic rejections
      if (!error.response?.data?.message || error.response?.status >= 500) {
        console.error('Error creating reservation:', error);
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to update ticket selection';
      setPurchaseError(errorMessage);
      
      // If capacity issue, refresh to show accurate info and revert ticket selection
      if (errorMessage.includes('sold out') || errorMessage.includes('remaining') || errorMessage.includes('being purchased')) {
        fetchCapacity();
        
        // IMPORTANT: Revert the ticket selection to match the current reservation
        if (reservation && reservation.tickets) {
          const revertedTickets = reservation.tickets.map(t => ({
            ticketTypeId: t.ticketTypeId,
            quantity: t.quantity,
            price: t.price,
            name: t.ticketName
          }));
          setSelectedTickets(revertedTickets);
        } else {
          // No reservation, clear selection
          setSelectedTickets([]);
        }
        
        // If temporarily full, set a timer to refresh capacity again
        if (error.response?.data?.isTemporarilyFull) {
          setTimeout(() => {
            fetchCapacity();
            // Clear the error after refresh to encourage retry
            setPurchaseError('');
          }, 5000); // Refresh after 5 seconds
        }
      }
    } finally {
      setApiLoading(false);
    }
  }, [user, eventId, fetchCapacity]);

  // Handle quantity change
  const handleQuantityChange = async (ticketId, change) => {
    if (!selectedEvent?.ticketTypes) return;
    if (!user) {
      alert('Please log in to select tickets');
      router.push('/login');
      return;
    }

    const ticketType = selectedEvent.ticketTypes.find(
      (t) => t._id === ticketId
    );
    if (!ticketType) return;

    // Get current quantity
    const currentTicket = selectedTickets.find(
      (t) => t.ticketTypeId === ticketId
    );
    const currentQuantity = currentTicket?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + change);

    // Calculate max quantity based on capacity and max per order
    const maxPerOrder = selectedEvent.maxAttendeesPerRegistration || 10;
    // Use canBook which includes user's current reservation
    const capacityLimit =
      eventCapacity?.canBook !== 'unlimited' && typeof eventCapacity?.canBook === 'number'
        ? eventCapacity.canBook
        : maxPerOrder;
    const maxQuantity = Math.min(maxPerOrder, capacityLimit);

    // Calculate total quantity with this change
    const otherTicketsTotal = selectedTickets
      .filter(t => t.ticketTypeId !== ticketId)
      .reduce((sum, t) => sum + t.quantity, 0);
    const potentialTotal = otherTicketsTotal + newQuantity;
    
    // Debug logging
    console.log('🎫 Quantity change debug:', {
      currentQuantity,
      newQuantity,
      change,
      otherTicketsTotal,
      potentialTotal,
      canBook: eventCapacity?.canBook,
      available: eventCapacity?.available,
      userReservation: eventCapacity?.userReservation
    });

    // Check if user is trying to exceed capacity
    if (change > 0 && eventCapacity?.canBook !== 'unlimited' && potentialTotal > eventCapacity.canBook) {
      // Don't allow the quantity to increase
      const canAddMore = Math.max(0, eventCapacity.canBook - otherTicketsTotal);
      
      if (eventCapacity.userReservation > 0) {
        setPurchaseError(`You have ${eventCapacity.userReservation} tickets reserved. Only ${eventCapacity.available} additional spots available.`);
      } else if (canAddMore > 0) {
        setPurchaseError(`Only ${canAddMore} more ticket${canAddMore === 1 ? '' : 's'} available. You can proceed with ${otherTicketsTotal + canAddMore} ticket${(otherTicketsTotal + canAddMore) === 1 ? '' : 's'} or wait for others to release their selections.`);
      } else {
        setPurchaseError(`No more tickets available. Maximum ${eventCapacity.canBook} ticket${eventCapacity.canBook === 1 ? '' : 's'} can be selected.`);
      }
      
      // IMPORTANT: Return early to prevent quantity update
      return;
    } else {
      setPurchaseError(''); // Clear any previous error
    }

    // Update local state
    const updatedTickets = [...selectedTickets];
    const existingIndex = updatedTickets.findIndex(t => t.ticketTypeId === ticketId);
    
    if (existingIndex >= 0) {
      if (Math.min(newQuantity, maxQuantity) === 0) {
        // Remove ticket if quantity is 0
        updatedTickets.splice(existingIndex, 1);
      } else {
        updatedTickets[existingIndex].quantity = Math.min(newQuantity, maxQuantity);
      }
    } else if (newQuantity > 0) {
      // Add new ticket
      updatedTickets.push({
        ticketTypeId: ticketId,
        quantity: Math.min(newQuantity, maxQuantity),
        price: ticketType.price || 0,
        name: ticketType.name
      });
    }
    
    setSelectedTickets(updatedTickets);
    
    // Clear any previous errors
    setErrors({});
    
    // Update reservation in backend only if there are tickets selected
    if (updatedTickets.length > 0) {
      await createOrUpdateReservation(updatedTickets);
    } else if (reservation) {
      // If no tickets selected and we have a reservation, delete it
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservation._id}`,
          { withCredentials: true }
        );
        setReservation(null);
        
        // Refetch capacity to show updated numbers after deletion
        await fetchCapacity();
      } catch (error) {
        console.error('Error deleting reservation:', error);
      }
    }
  };

  // Validate selection
  const validateSelection = () => {
    const newErrors = {};

    if (totals.totalQuantity === 0) {
      newErrors.selection = 'Please select at least one ticket';
      setErrors(newErrors);
      return false;
    }

    if (
      totals.totalQuantity > (selectedEvent.maxAttendeesPerRegistration || 10)
    ) {
      newErrors.selection = `Maximum ${
        selectedEvent.maxAttendeesPerRegistration || 10
      } tickets per order`;
      setErrors(newErrors);
      return false;
    }

    // Validate required custom fields
    if (selectedEvent?.registrationFields) {
      selectedEvent.registrationFields.forEach(field => {
        if (field.isRequired && !formResponses[field.fieldName]) {
          newErrors[field.fieldName] = 'Additional Info Required';
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  // Handle proceed to checkout/seat selection
  const handleProceed = async () => {
    if (!user) {
      alert('Please log in to purchase tickets');
      router.push('/login');
      return;
    }

    if (!validateSelection()) return;

    if (!reservation) {
      setErrors({ general: 'Please select tickets before proceeding.' });
      return;
    }

    setIsLoading(true);

    try {
      // Store form responses in sessionStorage for checkout to pick up
      if (Object.keys(formResponses).length > 0) {
        sessionStorage.setItem(
          `formResponses_${eventId}`,
          JSON.stringify(formResponses)
        );
      }

      // Navigate based on seating layout
      if (hasSeatingLayout) {
        // Navigate to seat selection
        router.push(`/events/seats/${eventId}`);
      } else {
        // Navigate directly to checkout
        router.push(`/checkout/events/${eventId}`);
      }
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation with smart routing
  const handleBack = async () => {
    // Clear reservation when leaving tickets page to avoid stale data
    if (reservation && reservation._id) {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservation._id}`,
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error clearing reservation on back navigation:', error);
      }
    }
    
    // Always go back to the event view page
    router.push(`/events/views/${eventId}`);
  };

  // Handle form response updates
  const handleFormResponseUpdate = (fieldName, value) => {
    setFormResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!selectedEvent?.dateTime) return { date: '', time: '' };

    const timeZone = selectedEvent.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(
      selectedEvent.dateTime,
      timeZone,
      'EEEE, MMMM do, yyyy'
    );
    const time = formatInTimeZone(selectedEvent.dateTime, timeZone, 'h:mm a');

    return { date, time };
  };

  // Show loading spinner while fetching event
  if (eventStatus === 'loading' || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error if event fetch failed
  if (eventStatus === 'failed' || !selectedEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {eventError || 'The event you are looking for does not exist.'}
          </p>
          <button
            onClick={() => router.push('/events')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const { date, time } = getFormattedDateTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Back to Events Button */}
        <div className="mb-3 sm:mb-6">
          <button
            onClick={handleBack}
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
            Select Tickets
          </h1>
          
          {/* Reservation Timer */}
          {reservation && (
            <ReservationTimer
              expiresAt={reservation.expiresAt}
              eventId={eventId}
              reservationId={reservation._id}
              mode="tickets"
              onExpire={() => {
                setReservation(null);
                setSelectedTickets([]);
                // Refresh capacity to get updated availability
                fetchCapacity();
              }}
              onClear={() => {
                setReservation(null);
                setSelectedTickets([]);
                router.push(`/events/views/${eventId}`);
              }}
            />
          )}
          {/* Ticket Types */}
          <div className="space-y-2 sm:space-y-4 mb-3 sm:mb-6">

            {/* Event Capacity Info */}
            <div className="mb-2 sm:mb-4">
              <div className={`flex items-center text-[10px] sm:text-sm mb-1 ${
                eventCapacity?.sold >= eventCapacity?.total && eventCapacity?.total > 0
                  ? 'text-red-600'  // Truly sold out
                  : eventCapacity?.status === 'sold-out'
                  ? 'text-orange-600'  // Temporarily unavailable
                  : totals.totalQuantity > (eventCapacity?.remaining || 0) && eventCapacity?.remaining !== 'unlimited' && !reservation
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                <FaUsers className="mr-1 sm:mr-2 text-xs sm:text-base" />
                <span>
    {capacityLoading ? (
      'Loading availability...'
    ) : eventCapacity?.isUnlimited ? (
      'Unlimited capacity'
    ) : eventCapacity?.sold >= eventCapacity?.total && eventCapacity?.total > 0 ? (
      // Truly sold out (sold tickets = capacity)
      <span className="text-red-600 font-semibold">Event Sold Out</span>
    ) : eventCapacity?.status === 'sold-out' ? (
      // Temporarily full due to reservations
      <span className="text-orange-600 font-semibold">Almost Selling Out</span>
    ) : totals.totalQuantity > 0 ? (
      // When user has selected tickets, show their selection
      `${totals.totalQuantity} ticket${totals.totalQuantity > 1 ? 's' : ''} selected`
    ) : (
      `${eventCapacity?.available || 0} available`
    )}
  </span>
              </div>
              {/* User reservation info - only show if we have an active reservation */}
              {eventCapacity?.userReservation > 0 && reservation && (
                <div className="text-xs text-blue-600 flex items-center ml-5 sm:ml-6">
                  You have {eventCapacity.userReservation} tickets reserved
                </div>
              )}
              {/* Show appropriate message based on sold out status */}
              {eventCapacity?.status === 'sold-out' && !reservation && (
                <div className="text-xs flex items-center ml-5 sm:ml-6 mt-1">
                  {eventCapacity?.sold >= eventCapacity?.total ? (
                    <span className="text-red-600">Event is just sold out</span>
                  ) : (
                    <span className="text-orange-600">Tickets are currently being purchased by other customers. Please try again in a few minutes.</span>
                  )}
                </div>
              )}
            </div>

            {selectedEvent.ticketTypes?.map((ticketType) => {
              // Calculate max available for this ticket type
              const currentTotal = selectedTickets.reduce((sum, t) => sum + t.quantity, 0);
              const maxAvailable = eventCapacity?.canBook === 'unlimited' 
                ? selectedEvent.maxAttendeesPerRegistration || 10
                : Math.min(
                    selectedEvent.maxAttendeesPerRegistration || 10,
                    eventCapacity?.canBook || 0
                  );
              // Check if event has required timezone
              if (!selectedEvent.timeZone) {
                console.error('Event timezone is required but missing');
                return null; // Skip rendering this ticket
              }

              // Use real-time capacity data instead of individual ticket quantities
              const isCapacityAvailable =
                eventCapacity?.status === 'available' || 
                eventCapacity?.status === 'limited' || 
                !eventCapacity?.status;

              // Check if ticket is available based on start/expiry dates
              const now = new Date();
              const eventTimeZone = selectedEvent.timeZone;

              let isDateAvailable = true;
              let unavailableReason = '';

              // Check start date (ticket not yet available)
              if (ticketType.startDate) {
                const startDate = new Date(ticketType.startDate);
                if (now < startDate) {
                  isDateAvailable = false;
                 unavailableReason = `${ticketType.name} tickets available from ${formatInTimeZone(
                    ticketType.startDate, 
                    eventTimeZone, 
                    'MMM d, yyyy'
                  )}`;
                }
              }

              // Check expiry date (ticket sales ended)
              if (ticketType.expiryDate && isDateAvailable) {
                const expiryDate = new Date(ticketType.expiryDate);
                if (now > expiryDate) {
                  isDateAvailable = false;
                  unavailableReason = `${ticketType.name} ticket sales ended on ${formatInTimeZone(
                    ticketType.expiryDate, 
                    eventTimeZone, 
                    'MMM d, yyyy'
                  )}`;
                }
              }

              // Overall availability combines capacity and date availability
              const isAvailable = isCapacityAvailable && isDateAvailable;

              const selectedTicket = selectedTickets.find(
                (t) => t.ticketTypeId === ticketType._id
              );
              const selectedQty = selectedTicket?.quantity || 0;

              // Calculate remaining based on capacity and max per order
              const maxPerOrder =
                selectedEvent.maxAttendeesPerRegistration || 10;
              
              // Use canBook which accounts for user's current reservation and other reservations
              const capacityLimit = eventCapacity?.canBook === 'unlimited' 
                ? Number.MAX_SAFE_INTEGER 
                : eventCapacity?.canBook || 0;
                  
              // How many more can be added based on max per order and capacity
              const maxByOrderLimit = maxPerOrder - totals.totalQuantity;
              const maxByCapacityLimit = capacityLimit - totals.totalQuantity;
              
              const remainingQty = Math.max(0, Math.min(maxByOrderLimit, maxByCapacityLimit));
              
              // Debug logging removed for production

              return (
                <div
                  key={ticketType._id}
                  className={`border rounded-lg p-2 sm:p-4 transition-all ${
                    isAvailable
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                >
                  {/* Mobile Layout - Compact Single Row */}
                  <div className="flex items-center justify-between sm:hidden">
                    {/* Left: Name and Price */}
                    <div className="flex-1 min-w-0 mr-2">
                      <h4 className="font-medium text-gray-900 text-xs truncate">
                        {ticketType.name}
                      </h4>
                      <p className="text-sm font-bold text-green-600">
                        ${ticketType.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Right: Quantity Selector - Always show but disable when not available */}
                    <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, -1)
                          }
                          disabled={selectedQty === 0 || apiLoading || !isAvailable}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaMinus className="text-[10px]" />
                        </button>

                        <span className="w-6 text-center font-semibold text-xs">
                          {selectedQty}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, 1)
                          }
                          disabled={
                            totals.totalQuantity >= maxPerOrder ||
                            remainingQty <= 0 ||
                            apiLoading ||
                            (eventCapacity?.available !== 'unlimited' && eventCapacity?.available <= 0) ||
                            (eventCapacity?.canBook !== 'unlimited' && totals.totalQuantity >= eventCapacity?.canBook) ||
                            !isAvailable
                          }
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="text-[10px]" />
                        </button>
                      </div>
                  </div>
                  
                  {/* Show capacity limit indicator for mobile */}
                  {currentTotal > 0 && eventCapacity?.canBook !== 'unlimited' && currentTotal >= eventCapacity?.canBook && (
                    <div className="text-[10px] text-orange-600 font-medium text-right mt-1 sm:hidden">
                      Max reached
                    </div>
                  )}

                  {/* Desktop Layout - Keep existing */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between">
                    {/* Ticket Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-base">
                          {ticketType.name}
                        </h4>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${ticketType.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector - Always show but disable when not available */}
                    <div className="flex items-center space-x-3 ml-6">
                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, -1)
                          }
                          disabled={selectedQty === 0 || apiLoading || !isAvailable}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaMinus className="text-xs" />
                        </button>

                        <span className="w-8 text-center font-semibold">
                          {selectedQty}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, 1)
                          }
                          disabled={
                            totals.totalQuantity >= maxPerOrder ||
                            remainingQty <= 0 ||
                            apiLoading ||
                            (eventCapacity?.available !== 'unlimited' && eventCapacity?.available <= 0) ||
                            (eventCapacity?.canBook !== 'unlimited' && totals.totalQuantity >= eventCapacity?.canBook) ||
                            !isAvailable
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                      
                      {/* Show capacity limit indicator */}
                      {currentTotal > 0 && eventCapacity?.canBook !== 'unlimited' && currentTotal >= eventCapacity?.canBook && (
                        <div className="ml-4 text-xs text-orange-600 font-medium">
                          Max reached
                        </div>
                      )}
                  </div>

                 {/* Ticket Sale Status */}
                 {(() => {
                   const status = getTicketSaleStatus(ticketType, selectedEvent.timeZone, eventCapacity);
                   
                   if (!status) return null;
                   
                   return (
                     <div className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium ${status.className}`}>
                       <span className="inline-block">{status.icon}</span>
                       <span className="ml-0.5 sm:ml-1">{status.message}</span>
                     </div>
                   );
                 })()}
                </div>
              );
            })}
          </div>

          {/* Attendee Additional Information */}
          {totals.totalQuantity > 0 && (
            <AttendeeInfoSection 
              event={selectedEvent} 
              errors={errors}
              formResponses={formResponses}
              onFormResponseUpdate={handleFormResponseUpdate}
            />
          )}


          {/* Proceed Button - Placed right after seating info */}
          {totals.totalQuantity > 0 && (
            <div className="mb-3 sm:mb-6">
              <button
                onClick={handleProceed}
                disabled={
                  !canProceedToNext || isLoading || apiLoading || !reservation
                }
                className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium sm:font-semibold text-sm sm:text-base flex items-center justify-center transition-all ${
                  canProceedToNext && !isLoading && !apiLoading && reservation
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading || apiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="text-sm sm:text-base">Processing...</span>
                  </>
                ) : (
                  <>
                    {hasSeatingLayout ? (
                      <>
                        <FaChair className="mr-1.5 sm:mr-2 text-sm sm:text-base" />
                        <span className="text-sm sm:text-base">Select Seats</span>
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="mr-1.5 sm:mr-2 text-sm sm:text-base" />
                        <span className="text-sm sm:text-base">Purchase Tickets</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Messages - Don't show concurrent purchase message in alert box */}
          {purchaseError && !purchaseError.includes('being purchased') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 text-sm sm:text-base flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-red-800 mb-1 text-sm sm:text-base">
                    Selection Error
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 break-words">{purchaseError}</p>
                </div>
              </div>
            </div>
          )}

          {errors.selection && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 text-sm sm:text-base flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-red-800 mb-1 text-sm sm:text-base">
                    Selection Error
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 break-words">{errors.selection}</p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 text-sm sm:text-base flex-shrink-0" />
                <p className="text-xs sm:text-sm text-red-700 break-words">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketSelectionPage;