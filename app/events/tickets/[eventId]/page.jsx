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
  FaArrowLeft
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
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
   setRefundPolicyInfo
} from '@/store/slices/events/ticketPurchaseSlice';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';

const TicketSelectionPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  // Event data
  const { selectedEvent, status: eventStatus, error: eventError } = useSelector((state) => state.events);
  
  // Redux state
  const ticketPurchaseState = useSelector(selectTicketPurchase);
  const selectedTickets = useSelector(selectSelectedTickets);
  const totals = useSelector(selectTicketTotals);
  const canProceedToNext = useSelector(selectCanProceedToNext);
  const purchaseError = useSelector(selectPurchaseError);
  const loading = useSelector(selectPurchaseLoading);
  
  // Local state for UI
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [eventCapacity, setEventCapacity] = useState({
    total: 0,
    sold: 0,
    remaining: 0,
    isUnlimited: false,
    status: 'available'
  });
  const [capacityLoading, setCapacityLoading] = useState(false);

  // Check if event has seating layout
  const hasSeatingLayout = selectedEvent?.seatingLayout && selectedEvent.seatingLayout.length > 0;

  // Fetch real-time capacity data
  const fetchEventCapacity = async () => {
    if (!eventId) return;
    
    setCapacityLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/capacity`);
      const data = await response.json();
      if (data.success) {
        setEventCapacity(data.capacity);
      }
    } catch (error) {
      console.error('Error fetching capacity:', error);
    } finally {
      setCapacityLoading(false);
    }
  };

  // Fetch event data on component mount
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventById(eventId));
      fetchEventCapacity();
    }
  }, [eventId, dispatch]);

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
        dispatch(setRefundPolicyInfo({
          policyType: selectedEvent.refundPolicy.processingFeePolicy || 'non-refundable',
          policyText: selectedEvent.refundPolicy.policyText || '',
          policyDisplayed: true
        }));
      }
      
      // Pre-fill buyer info with user data if available
      if (user) {
        dispatch(updateBuyerInfo({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || ''
        }));
      }
    }
  }, [selectedEvent?._id, eventId, hasSeatingLayout, user, dispatch]);

  // Handle quantity change
  const handleQuantityChange = (ticketId, change) => {
    if (!selectedEvent?.ticketTypes) return;
    
    const ticketType = selectedEvent.ticketTypes.find(t => t._id === ticketId);
    if (!ticketType) return;

    // Get current quantity
    const currentTicket = selectedTickets.find(t => t.ticketTypeId === ticketId);
    const currentQuantity = currentTicket?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    // Calculate max quantity based on capacity and max per order
    const maxPerOrder = selectedEvent.maxAttendeesPerRegistration || 10;
    const capacityLimit = typeof eventCapacity?.remaining === 'number' 
      ? eventCapacity.remaining 
      : maxPerOrder;
    const maxQuantity = Math.min(maxPerOrder, capacityLimit);
    
    // Update Redux state
    dispatch(updateTicketSelection({
      ticketTypeId: ticketId,
      quantity: Math.min(newQuantity, maxQuantity),
      price: ticketType.price || 0,
      name: ticketType.name,
      maxQuantity: maxQuantity
    }));
    
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

    if (totals.totalQuantity > (selectedEvent.maxAttendeesPerRegistration || 10)) {
      newErrors.selection = `Maximum ${selectedEvent.maxAttendeesPerRegistration || 10} tickets per order`;
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
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('ticketSelection', JSON.stringify(ticketSelectionFallback));

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
    router.back();
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!selectedEvent?.dateTime) return { date: '', time: '' };
    
    const timeZone = selectedEvent.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(selectedEvent.dateTime, timeZone, 'EEEE, MMMM do, yyyy');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{eventError || 'The event you are looking for does not exist.'}</p>
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <button
                  onClick={handleBack}
                  className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaArrowLeft />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Select Tickets
                  </h1>
                  <h2 className="text-lg text-gray-600">{selectedEvent.title}</h2>
                </div>
              </div>
              
              {/* Event Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-600" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2 text-green-600" />
                  <span>{time}</span>
                </div>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-red-600" />
                  <span>{selectedEvent.venue}</span>
                </div>
                {hasSeatingLayout && (
                  <div className="flex items-center">
                    <FaChair className="mr-2 text-purple-600" />
                    <span>Assigned Seating</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Single Column Layout - Full Width */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Ticket Types */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center">
              <FaTicketAlt className="mr-2 text-blue-600" />
              Available Tickets
            </h3>

            {/* Event Capacity Info */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <FaUsers className="mr-2" />
              <span>
                {capacityLoading ? (
                  'Loading availability...'
                ) : eventCapacity?.isUnlimited ? (
                  'Unlimited capacity'
                ) : eventCapacity?.status === 'sold-out' ? (
                  'Event sold out'
                ) : (
                  `${eventCapacity?.remaining || 0} of ${eventCapacity?.total || 0} remaining`
                )}
              </span>
            </div>
            
            {selectedEvent.ticketTypes?.map((ticketType) => {
              // Use real-time capacity data instead of individual ticket quantities
              const isAvailable = eventCapacity?.status === 'available' || !eventCapacity?.status;
              const selectedTicket = selectedTickets.find(t => t.ticketTypeId === ticketType._id);
              const selectedQty = selectedTicket?.quantity || 0;
              
              // Calculate remaining based on capacity and max per order
              const maxPerOrder = selectedEvent.maxAttendeesPerRegistration || 10;
              const capacityLimit = typeof eventCapacity?.remaining === 'number' 
                ? eventCapacity.remaining 
                : maxPerOrder;
              const remainingQty = Math.min(maxPerOrder - selectedQty, capacityLimit);
              
              return (
  <div
    key={ticketType._id}
    className={`border rounded-lg p-4 transition-all ${
      isAvailable 
        ? 'border-gray-200 hover:border-blue-300 hover:shadow-md' 
        : 'border-gray-100 bg-gray-50'
    }`}
  >
    <div className="flex items-center justify-between">
      {/* Ticket Info */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">
            {ticketType.name}
          </h4>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${ticketType.price?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Quantity Selector - Moved to right side */}
      {isAvailable && (
        <div className="flex items-center space-x-3 ml-6">
          <button
            onClick={() => handleQuantityChange(ticketType._id, -1)}
            disabled={selectedQty === 0 || loading.initializing}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaMinus className="text-xs" />
          </button>
          
          <span className="w-8 text-center font-semibold">
            {selectedQty}
          </span>
          
          <button
            onClick={() => handleQuantityChange(ticketType._id, 1)}
            disabled={
              selectedQty >= remainingQty || 
              selectedQty >= (selectedEvent.maxAttendeesPerRegistration || 10) ||
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
    
    {/* Date restrictions */}
    {(ticketType.startDate || ticketType.expiryDate) && (
      <div className="mt-2 text-xs text-gray-500">
        {ticketType.startDate && (
          <span>Available from {new Date(ticketType.startDate).toLocaleDateString()}</span>
        )}
        {ticketType.startDate && ticketType.expiryDate && <span> • </span>}
        {ticketType.expiryDate && (
          <span>Until {new Date(ticketType.expiryDate).toLocaleDateString()}</span>
        )}
      </div>
    )}
  </div>
);
            })}
          </div>



          {/* Seating Info */}
          {hasSeatingLayout && totals.totalQuantity > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaChair className="text-purple-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-purple-800 mb-1">
                    Seat Selection Required
                  </h4>
                  <p className="text-sm text-purple-700">
                    After clicking "Select Seats", you'll choose your specific seats from the venue layout.
                    Selected seats will be held for 5 minutes while you complete your purchase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Proceed Button - Placed right after seating info */}
          {totals.totalQuantity > 0 && (
            <div className="mb-6">
              <button
                onClick={handleProceed}
                disabled={!canProceedToNext || isLoading || loading.initializing}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-all ${
                  canProceedToNext && !isLoading && !loading.initializing
                    ? hasSeatingLayout
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading || loading.initializing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {hasSeatingLayout ? (
                      <>
                        <FaChair className="mr-2" />
                        Select Seats
                      </>
                    ) : (
                      <>
                        <FaShoppingCart className="mr-2" />
                        Purchase Tickets
                      </>
                    )}
                  </>
                )}
              </button>

              <div className="text-xs text-gray-500 text-center mt-2">
                {totals.totalQuantity} ticket{totals.totalQuantity !== 1 ? 's' : ''} selected
                {hasSeatingLayout && ' • Seats to be selected next'}
                <span className="ml-2 font-medium">${totals.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {purchaseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Purchase Error</h4>
                  <p className="text-sm text-red-700">{purchaseError}</p>
                </div>
              </div>
            </div>
          )}

          {errors.selection && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Selection Error</h4>
                  <p className="text-sm text-red-700">{errors.selection}</p>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketSelectionPage;