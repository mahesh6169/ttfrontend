// app/events/tickets/[eventId]/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
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
import {
  initializePurchaseSession,
  updateTicketSelection,
  setSeatRequirement,
  setCurrentStep,
  resetPurchaseSession,
  updateBuyerInfo,
  selectTicketPurchase,
  selectSelectedTickets,
  selectTicketTotals,
  selectCanProceedToNext,
  selectPurchaseError,
  selectPurchaseLoading,
  setRefundPolicyInfo,
  selectFormResponses,
  updateFormResponse,
} from '@/store/slices/events/ticketPurchaseSlice';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import {
  selectEventCapacityState,
  selectShouldRefreshCapacity,
  fetchEventCapacity,
} from '@/store/slices/events/eventCapacitySlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import AttendeeInfoSection from '@/components/events/tickets/AttendeeInfoSection';

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

  // Redux state
  const ticketPurchaseState = useSelector(selectTicketPurchase);
  const selectedTickets = useSelector(selectSelectedTickets);
  const totals = useSelector(selectTicketTotals);
  const canProceedToNext = useSelector(selectCanProceedToNext);
  const purchaseError = useSelector(selectPurchaseError);
  const loading = useSelector(selectPurchaseLoading);
  const formResponses = useSelector(selectFormResponses);

  // ✅ Get capacity from Redux instead of local state
  const { capacity: eventCapacity, isLoading: capacityLoading } = useSelector(state => 
    selectEventCapacityState(state, eventId)
  );
  const shouldRefreshCapacity = useSelector(state => 
    selectShouldRefreshCapacity(state, eventId)
  );

  // Local state for UI
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if event has seating layout
  const hasSeatingLayout =
    selectedEvent?.seatingLayout && selectedEvent.seatingLayout.length > 0;

  // Fetch event data on component mount
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
    }
  }, [eventId, dispatch]);

  // ✅ Fetch capacity data when needed
  useEffect(() => {
    if (eventId && shouldRefreshCapacity) {
      // Fetching capacity for event
      dispatch(fetchEventCapacity(eventId));
    }
  }, [eventId, shouldRefreshCapacity, dispatch]);

  // Initialize purchase session when event is loaded
  useEffect(() => {
    if (selectedEvent?._id && eventId) {
      // Initialize purchase session
      dispatch(initializePurchaseSession({ eventId: selectedEvent._id }));

      // Set seat requirement
      dispatch(setSeatRequirement(hasSeatingLayout));

      // Set current step to ticket selection
      dispatch(setCurrentStep('ticket-selection'));

      // Set refund policy info if it's a paid event
      if (selectedEvent.isPaid && selectedEvent.refundPolicy) {
        dispatch(
          setRefundPolicyInfo({
            policyType:
              selectedEvent.refundPolicy.processingFeePolicy ||
              'non-refundable',
            policyText: selectedEvent.refundPolicy.policyText || '',
            policyDisplayed: true,
          })
        );
      }

      // Pre-fill buyer info with user data if available
      if (user) {
        dispatch(
          updateBuyerInfo({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
          })
        );
      }
    }
  }, [selectedEvent?._id, eventId, hasSeatingLayout, user, dispatch]);

  // Handle quantity change
  const handleQuantityChange = (ticketId, change) => {
    if (!selectedEvent?.ticketTypes) return;

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
    const capacityLimit =
      typeof eventCapacity?.remaining === 'number'
        ? eventCapacity.remaining
        : maxPerOrder;
    const maxQuantity = Math.min(maxPerOrder, capacityLimit);

    // Update Redux state
    dispatch(
      updateTicketSelection({
        ticketTypeId: ticketId,
        quantity: Math.min(newQuantity, maxQuantity),
        price: ticketType.price || 0,
        name: ticketType.name,
        maxQuantity: maxQuantity,
      })
    );

    // Clear any previous errors
    setErrors({});
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

    setIsLoading(true);

    try {
      // Mark step as completed
      dispatch(setCurrentStep(hasSeatingLayout ? 'seat-selection' : 'details'));

      // Store ticket selection in sessionStorage as fallback during transition
      const ticketSelectionFallback = {
        eventId: selectedEvent._id,
        tickets: selectedTickets.reduce((acc, ticket) => {
          acc[ticket.ticketTypeId] = ticket.quantity;
          return acc;
        }, {}),
        totals: totals,
        hasSeatingLayout,
        formResponses: formResponses,
        timestamp: Date.now(),
      };

      sessionStorage.setItem(
        'ticketSelection',
        JSON.stringify(ticketSelectionFallback)
      );

      // Navigate based on seating layout
      if (hasSeatingLayout) {
        // Navigate to seat selection
        router.push(`/events/seats/${selectedEvent._id}`);
      } else {
        // Navigate directly to checkout
        router.push(`/checkout/events/${selectedEvent._id}`);
      }
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
 const handleBack = () => {
    router.push(`/events/views/${eventId}`);
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
  if (eventStatus === 'loading') {
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
          {/* Ticket Types */}
          <div className="space-y-2 sm:space-y-4 mb-3 sm:mb-6">

            {/* Event Capacity Info */}
            <div className="flex items-center text-[10px] sm:text-sm text-gray-600 mb-2 sm:mb-4">
              <FaUsers className="mr-1 sm:mr-2 text-xs sm:text-base" />
              <span>
  {capacityLoading ? (
    'Loading availability...'
  ) : eventCapacity?.isUnlimited ? (
    'Unlimited capacity'
  ) : eventCapacity?.status === 'sold-out' ? (
    'Event sold out'
  ) : totals.totalQuantity > 0 ? (
    `${totals.totalQuantity} ticket${totals.totalQuantity > 1 ? 's' : ''} selected • ${(eventCapacity?.remaining || 0) - totals.totalQuantity} of ${eventCapacity?.total || 0} remaining`
  ) : (
    `${eventCapacity?.remaining || 0} of ${eventCapacity?.total || 0} remaining`
  )}
</span>
            </div>

            {selectedEvent.ticketTypes?.map((ticketType) => {
              // Check if event has required timezone
              if (!selectedEvent.timeZone) {
                console.error('Event timezone is required but missing');
                return null; // Skip rendering this ticket
              }

              // Use real-time capacity data instead of individual ticket quantities
              const isCapacityAvailable =
                eventCapacity?.status === 'available' || !eventCapacity?.status;

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
              
              // Use the actual event capacity, not the cart-adjusted one
              // The cart-adjusted capacity already accounts for what's in the cart
              const actualEventRemaining = eventCapacity?.isUnlimited 
                ? Number.MAX_SAFE_INTEGER 
                : (eventCapacity?.total || 0) - (eventCapacity?.sold || 0);
              const capacityLimit =
                typeof actualEventRemaining === 'number' && !isNaN(actualEventRemaining)
                  ? actualEventRemaining
                  : Number.MAX_SAFE_INTEGER;
                  
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

                    {/* Right: Quantity Selector */}
                    {isAvailable && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, -1)
                          }
                          disabled={selectedQty === 0 || loading.initializing}
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
                            loading.initializing ||
                            eventCapacity?.status === 'sold-out'
                          }
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="text-[10px]" />
                        </button>
                      </div>
                    )}
                  </div>

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

                    {/* Quantity Selector */}
                    {isAvailable && (
                      <div className="flex items-center space-x-3 ml-6">
                        <button
                          onClick={() =>
                            handleQuantityChange(ticketType._id, -1)
                          }
                          disabled={selectedQty === 0 || loading.initializing}
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
                            loading.initializing ||
                            eventCapacity?.status === 'sold-out'
                          }
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaPlus className="text-xs" />
                        </button>
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
            <AttendeeInfoSection event={selectedEvent} errors={errors} />
          )}


          {/* Proceed Button - Placed right after seating info */}
          {totals.totalQuantity > 0 && (
            <div className="mb-3 sm:mb-6">
              <button
                onClick={handleProceed}
                disabled={
                  !canProceedToNext || isLoading || loading.initializing
                }
                className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium sm:font-semibold text-sm sm:text-base flex items-center justify-center transition-all ${
                  canProceedToNext && !isLoading && !loading.initializing
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading || loading.initializing ? (
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

          {/* Error Messages */}
          {purchaseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 text-sm sm:text-base flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-medium text-red-800 mb-1 text-sm sm:text-base">
                    Purchase Error
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