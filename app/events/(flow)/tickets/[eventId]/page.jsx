// app/events/tickets/[eventId]/page.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import axios from '@/utils/axiosConfig';
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
  FaBell,
  FaTag,
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import { getEventTicketStatus, getTicketSaleStatus } from '@/utils/events/ticketStatusHelper';
import { isDiscountRedeemable } from '@/utils/events/discountCodes';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';
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
  
  // Use backend values instead of local calculations
  const userReservation = eventCapacity?.userReservation || 0;
  
  // Check if all required additional info fields are filled
  const hasRequiredFieldErrors = selectedEvent?.registrationFields?.some(field => 
    field.isRequired && !formResponses[field.fieldName]
  ) || false;

  // Determine if can proceed based on backend data
  // For both seated and non-seated events, users should be able to proceed
  // as long as they have tickets selected, no errors, and all required fields filled
  const canProceedToNext = userReservation > 0 && 
    !Object.keys(errors).length && 
    !purchaseError &&
    reservation &&  // Must have valid reservation
    !hasRequiredFieldErrors;  // All required additional info must be filled

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

  // Auto-refresh capacity with dynamic interval based on availability
  useEffect(() => {
    if (!eventId || !selectedEvent) return;
    
    // More frequent updates when capacity is low or user has selection
    const isLowCapacity = eventCapacity?.trueAvailable !== 'unlimited' && eventCapacity?.trueAvailable < 3;
    const hasSelection = eventCapacity?.userReservation > 0;
    
    // 3 seconds for low capacity, 5 seconds with selection, 10 seconds otherwise
    const interval = isLowCapacity ? 3000 : hasSelection ? 5000 : 10000;
    
    const timer = setInterval(() => {
      console.log(`🔄 Auto-refreshing capacity (interval: ${interval}ms)`);
      fetchCapacity();
    }, interval);

    return () => clearInterval(timer);
  }, [eventId, selectedEvent, eventCapacity?.trueAvailable, eventCapacity?.userReservation, fetchCapacity]);

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
      eventCapacity?.userReservation > 0 && 
      eventCapacity?.canBook !== 'unlimited' &&
      eventCapacity?.userReservation > (eventCapacity?.canBook || 0) &&
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
  }, [eventCapacity?.userReservation, eventCapacity?.canBook, eventCapacity?.status, capacityLoading, fetchCapacity]);

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

  // Stale bundle guard: if a restored reservation holds a bundle quantity that no longer divides
  // by the current bundle size (organiser edited N mid-flight), release it and ask the buyer to
  // re-select — never show fractional packs.
  useEffect(() => {
    if (!reservation || !selectedEvent?.ticketTypes || selectedTickets.length === 0) return;
    const hasStalePack = selectedTickets.some((t) => {
      const tt = selectedEvent.ticketTypes.find((x) => x._id === t.ticketTypeId);
      return tt?.bundleSize >= 2 && t.quantity % tt.bundleSize !== 0;
    });
    if (!hasStalePack) return;
    (async () => {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservation._id}`,
          { withCredentials: true }
        );
      } catch (error) {
        console.error('Error releasing stale bundle reservation:', error);
      }
      setReservation(null);
      setSelectedTickets([]);
      setPurchaseError('The bundle options changed. Please choose your tickets again.');
      fetchCapacity();
    })();
  }, [reservation, selectedEvent, selectedTickets, eventId, fetchCapacity]);

  // Remove the validation effect entirely - we'll just gray out the button

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
      
      // Just refresh capacity to show accurate info
      if (errorMessage.includes('sold out') || errorMessage.includes('remaining') || errorMessage.includes('being purchased')) {
        fetchCapacity();
        
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
    // Bundle types move in whole packs: one +/- step = bundleSize tickets.
    const stepSize = ticketType.bundleSize >= 2 ? ticketType.bundleSize : 1;
    const isBundleRow = stepSize > 1;
    const newQuantity = Math.max(0, currentQuantity + change * stepSize);

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

    // Block an add that doesn't fit. For a bundle the WHOLE pack must fit within BOTH the
    // per-order limit and the bookable remainder (no fractional packs); a pack that cannot fit
    // shows a pack-aware message, never the single-ticket wording.
    const capBook = eventCapacity?.canBook;
    const exceedsCapacity = change > 0 && capBook !== 'unlimited' && potentialTotal > (capBook || 0);
    const exceedsOrder = change > 0 && isBundleRow && potentialTotal > maxPerOrder;
    if (exceedsCapacity || exceedsOrder) {
      if (isBundleRow) {
        setPurchaseError(
          exceedsCapacity && !exceedsOrder
            ? `Not enough remaining for another ${ticketType.name}.`
            : `You can select up to ${maxPerOrder} tickets per order.`
        );
        return;
      }
      // Single tickets keep the existing wording.
      const canAddMore = Math.max(0, (capBook || 0) - otherTicketsTotal);
      if (eventCapacity.userReservation > 0) {
        const additionalAvailable = (capBook || 0) - eventCapacity.userReservation;
        setPurchaseError(`You have ${eventCapacity.userReservation} tickets reserved. Only ${additionalAvailable} additional spots available.`);
      } else if (canAddMore > 0) {
        setPurchaseError(`Only ${canAddMore} more ticket${canAddMore === 1 ? '' : 's'} available. You can proceed with ${otherTicketsTotal + canAddMore} ticket${(otherTicketsTotal + canAddMore) === 1 ? '' : 's'} or wait for others to release their selections.`);
      } else {
        setPurchaseError(`No more tickets available. Maximum ${capBook} ticket${capBook === 1 ? '' : 's'} can be selected.`);
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

    if (userReservation === 0) {
      newErrors.selection = 'Please select at least one ticket';
      setErrors(newErrors);
      return false;
    }

    if (
      userReservation > (selectedEvent.maxAttendeesPerRegistration || 10)
    ) {
      newErrors.selection = `Maximum ${
        selectedEvent.maxAttendeesPerRegistration || 10
      } tickets per order`;
      setErrors(newErrors);
      return false;
    }

    // Remove field validation from here - just let the button be disabled

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

    // Just a safety check - button should already be disabled if required fields are empty
    if (hasRequiredFieldErrors) {
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
        router.push(`/events/checkout/${eventId}`);
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
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error if event fetch failed
  if (eventStatus === 'failed' || !selectedEvent) {
    return (
      <EmptyState
        title="Event not found"
        description={eventError || 'The event you are looking for does not exist.'}
        actionLabel="Browse events"
        actionHref="/events"
      />
    );
  }

  const { date, time } = getFormattedDateTime();

  // Sticky-bar aggregate: total ticket count and subtotal across ALL types (never per-type).
  // price is the PACK price for a bundle (events-bundle-pricing.md D1), and quantity counts people,
  // so a bundle line is packPrice x packs (quantity / bundleSize) - never packPrice x people.
  const selectedCount = selectedTickets.reduce((sum, t) => sum + t.quantity, 0);
  const subtotal = selectedTickets.reduce((sum, t) => {
    const tt = selectedEvent?.ticketTypes?.find((x) => x._id === t.ticketTypeId);
    const size = tt?.bundleSize >= 2 ? tt.bundleSize : 1;
    const units = size > 1 ? t.quantity / size : t.quantity;
    return sum + (t.price || 0) * units;
  }, 0);

  return (
    <div>
      <div className="w-full max-w-3xl mx-auto pb-24">
        {/* Page toolbar (design-system.md section 8): Back pinned left, title centred in the
            SAME row. Back is the shared secondary button; title is the flat H1 (18px bold). */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute left-0">
            <BackButton onClick={handleBack} />
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            Select Tickets
          </h1>
        </div>

        {/* Single Column Layout - Full Width */}
        <div>
          
          {/* Capacity / timer line (design-system.md section 8): capacity + selection as muted
              meta (12px slate-500); the reservation countdown rides as an urgency badge. */}
          <div className="flex items-center justify-between md:justify-center gap-3 md:gap-x-6 mb-4">

            {/* Availability — muted meta, borderless */}
            <div className="min-w-0">
              <div>
                <div className="flex items-center text-xs text-slate-500">
                  <FaUsers className="mr-1.5 text-sm text-slate-400 shrink-0" />
                  <span>
                    {capacityLoading ? (
                      'Loading availability...'
                    ) : eventCapacity?.isUnlimited ? (
                      'Unlimited capacity'
                    ) : eventCapacity?.userReservation > 0 ? (
                      // When user has selected tickets, show their selection from backend
                      <>
                        {eventCapacity.userReservation} ticket{eventCapacity.userReservation > 1 ? 's' : ''} selected
                        {eventCapacity?.trueAvailable !== 'unlimited' && (
                          <>
                            {' '}• {eventCapacity?.trueAvailable || 0} available
                          </>
                        )}
                      </>
                    ) : eventCapacity?.sold >= eventCapacity?.total && eventCapacity?.total > 0 ? (
                      // Truly sold out (sold tickets = capacity)
                      'Event Sold Out'
                    ) : eventCapacity?.status === 'sold-out' ? (
                      // Temporarily full due to reservations
                      'Almost Selling Out'
                    ) : (
                      // When no tickets selected, show true availability
                      eventCapacity?.trueAvailable === 'unlimited' ? 
                        'Unlimited capacity' : 
                        `${eventCapacity?.trueAvailable || 0} available`
                    )}
                  </span>
                </div>
                
                {/* Show max booking limit message when user reaches their limit */}
                {userReservation > 0 && userReservation >= (selectedEvent.maxAttendeesPerRegistration || 10) && (
                  <div className="text-xs mt-1 ml-5">
                    <span className="text-slate-600 font-medium">Max booking limit reached</span>
                  </div>
                )}

                {/* Show appropriate message based on sold out status */}
                {eventCapacity?.status === 'sold-out' && !reservation && (
                  <div className="text-xs mt-1 ml-5">
                    {eventCapacity?.sold >= eventCapacity?.total ? (
                      <span className="text-red-600">Event is just sold out</span>
                    ) : (
                      <span className="text-slate-600">Tickets are currently being purchased by other customers. Please try again in a few minutes.</span>
                    )}
                  </div>
                )}

                {/* Show purchase error inline */}
                {purchaseError && (
                  <div className="text-xs text-red-600 mt-1 ml-5">
                    {purchaseError}
                  </div>
                )}
              </div>
            </div>

            {/* Reservation Timer — beside capacity on desktop, above it on mobile */}
            {reservation && (
              <div className="md:shrink-0">
                <ReservationTimer
                  expiresAt={reservation.expiresAt}
                  eventId={eventId}
                  reservationId={reservation._id}
                  mode="tickets"
                  showClear={false}
                  onExpire={() => {
                    setReservation(null);
                    setSelectedTickets([]);
                    setPurchaseError(''); // Clear any error messages
                    fetchCapacity();
                  }}
                  onClear={() => {
                    setReservation(null);
                    setSelectedTickets([]);
                    router.push(`/events/views/${eventId}`);
                  }}
                />
              </div>
            )}
          </div>

          {/* Ticket Types — one bordered card, rows divided by a subtle line (matches the event
              detail card). */}
          <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {selectedEvent.ticketTypes?.map((ticketType) => {
              // Use backend values for max available
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
                  
              // How many more can be added based on max per order
              // For seated events, allow attempts up to max per order regardless of current availability
              const maxByOrderLimit = maxPerOrder - userReservation;
              
              const remainingQty = Math.max(0, maxByOrderLimit);

              // Bundle rows count PACKS. A pack (bundleSize tickets) fits only when N more tickets
              // fit within BOTH the per-order room and the bookable remainder (which can be the
              // string 'unlimited'). displayQty shows packs; the clamp/message stay pack-aware.
              const stepSize = ticketType.bundleSize >= 2 ? ticketType.bundleSize : 1;
              const isBundleRow = stepSize > 1;
              const orderRoom = maxPerOrder - userReservation;                       // additional tickets by per-order cap
              const capRoom = eventCapacity?.trueAvailable === 'unlimited'
                ? Number.MAX_SAFE_INTEGER
                : (eventCapacity?.trueAvailable ?? 0);                               // additional tickets by capacity
              const packFits = stepSize <= orderRoom && stepSize <= capRoom;
              const displayQty = isBundleRow ? Math.floor(selectedQty / stepSize) : selectedQty;
              const packBlockMsg = isBundleRow && isAvailable && !packFits
                ? (capRoom < stepSize
                    ? `Not enough remaining for another ${ticketType.name}`
                    : `You can select up to ${maxPerOrder} tickets per order`)
                : null;

              // Debug logging
              console.log('🎫 Button state debug:', {
                ticketType: ticketType.name,
                userReservation,
                maxPerOrder,
                remainingQty,
                isAvailable,
                apiLoading,
                canBook: eventCapacity?.canBook,
                trueAvailable: eventCapacity?.trueAvailable
              });

              // Row pieces. Text (left column) never flows under the price/stepper (right column).
              // Bundle rows carry "(N People)" on the NAME itself (N = bundleSize), so there is no
              // separate admits line. Name is the item-title standard: 14px semibold slate-900.
              const nameEl = (
                <h4 className="font-semibold text-slate-900 text-sm">
                  {ticketType.name}{isBundleRow ? ` (${stepSize} People)` : ''}
                </h4>
              );

              // Note (meta) sits BELOW the name; the discount hint(s) come AFTER the note.
              const noteEl = ticketType.note ? (
                <p className="text-xs text-slate-500">{ticketType.note}</p>
              ) : null;

              // Sale-status badge — sits next to the NAME. The shared helper returns the whole badge
              // className (amber "X days left" / red "Sold out"|"Sales closed" / slate on-sale), so
              // the tickets page and the detail card render statuses identically.
              const status = getTicketSaleStatus(ticketType, selectedEvent.timeZone, eventCapacity);
              const StatusIcon = status?.icon;
              const statusBadgeEl = status ? (
                <span className={status.className}>
                  {StatusIcon && <StatusIcon size={12} className="shrink-0" />}
                  {status.message}
                </span>
              ) : null;

              // Public discount-code hints (S2). The API only ships redeemable, show-hint codes
              // to non-owners, so anything present here is safe to display. A code covers this
              // ticket type when its appliesToTicketTypes includes the NAME. Teal promo badge
              // (design-system.md section 7): bg-50 / border-200 / text-800, flat text-xs.
              const discountEls = (selectedEvent.discountCodes || [])
                .filter(isDiscountRedeemable)
                .filter((dc) => (dc.appliesToTicketTypes || []).includes(ticketType.name))
                .map((dc) => (
                  <div
                    key={dc.code}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs"
                  >
                    <FaTag className="text-teal-600 w-3 h-3 shrink-0" />
                    <span>
                      Use code <span className="font-bold text-teal-700">{dc.code}</span>
                      {dc.kind === 'fixed'
                        ? ` for $${Number(dc.value).toFixed(2)} off`
                        : ` for ${dc.value}% off`}
                    </span>
                  </div>
                ));

              // The stored price IS the pack price for a bundle (events-bundle-pricing.md D1), so it
              // shows directly - no share x size. Flat size.
              const displayPrice = ticketType.price;
              const priceEl = (
                <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                  ${displayPrice?.toFixed(2) || '0.00'}
                </p>
              );

              const stepperEl = (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleQuantityChange(ticketType._id, -1)}
                    disabled={selectedQty === 0 || apiLoading}
                    className="w-6 h-6 rounded-full border border-teal-600 flex items-center justify-center hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isBundleRow ? `Remove one ${ticketType.name} pack` : `Remove one ${ticketType.name}`}
                  >
                    <FaMinus className="text-[9px] text-teal-700" />
                  </button>
                  <span className="w-7 text-center font-semibold text-sm">
                    {displayQty}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(ticketType._id, 1)}
                    disabled={
                      !packFits ||
                      apiLoading ||
                      !isAvailable
                    }
                    className="w-6 h-6 rounded-full border border-teal-600 flex items-center justify-center hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={isBundleRow ? `Add one ${ticketType.name} pack` : `Add one ${ticketType.name}`}
                  >
                    <FaPlus className="text-[9px] text-teal-700" />
                  </button>
                </div>
              );

              return (
                <div
                  key={ticketType._id}
                  className={`px-4 py-3 ${!isAvailable ? 'opacity-60' : ''}`}
                >
                  {/* Left text column (name + status badge, note, discount) never overlaps the
                      right price+stepper column. Same layout on mobile and desktop. */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {nameEl}
                        {statusBadgeEl}
                      </div>
                      {noteEl && <div className="mt-1">{noteEl}</div>}
                      {discountEls.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {discountEls}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {priceEl}
                      {stepperEl}
                    </div>
                  </div>

                  {/* Pack-aware clamp message (bundle rows only), full width under the row. */}
                  {packBlockMsg && (
                    <p className="text-xs mt-1 text-amber-600">{packBlockMsg}</p>
                  )}
                </div>
              );
            })}
            </div>

          {/* Attendee Additional Information */}
          {userReservation > 0 && selectedEvent?.registrationFields?.length > 0 && (
            <AttendeeInfoSection 
              event={selectedEvent} 
              formResponses={formResponses}
              onFormResponseUpdate={handleFormResponseUpdate}
            />
          )}


          {errors.selection && (
            <div className="flex items-start gap-2 text-sm text-red-600 mb-4">
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              <span className="break-words">{errors.selection}</span>
            </div>
          )}

          {errors.general && (
            <div className="flex items-start gap-2 text-sm text-red-600 mb-4">
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
              <span className="break-words">{errors.general}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar (design-system.md buttons): aggregate summary on the left, the primary
          proceed action on the right, pinned to the bottom edge. The mobile bottom nav is hidden on
          the flow (see BottomNavigation), so this owns the bottom edge; the page wrapper carries
          bottom padding (pb-24) so nothing hides behind it. */}
      {userReservation > 0 && (
        <div
          data-testid="tickets-cta-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white safe-area-inset-pb"
        >
          <div className="w-full max-w-3xl mx-auto px-2 md:px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {selectedCount} ticket{selectedCount === 1 ? '' : 's'} - ${subtotal.toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleProceed}
              disabled={!canProceedToNext || isLoading || apiLoading || !reservation}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                canProceedToNext && !isLoading && !apiLoading && reservation
                  ? 'bg-teal-700 hover:bg-teal-800'
                  : 'bg-teal-700 opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading || apiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : hasRequiredFieldErrors ? (
                <>
                  <FaExclamationTriangle className="text-sm" />
                  <span>Fill Required Info</span>
                </>
              ) : hasSeatingLayout ? (
                <>
                  <FaChair className="text-sm" />
                  <span>Select Seats</span>
                </>
              ) : (
                <>
                  <FaShoppingCart className="text-sm" />
                  <span>Purchase Tickets</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSelectionPage;