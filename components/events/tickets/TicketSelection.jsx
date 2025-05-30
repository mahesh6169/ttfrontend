// components/events/tickets/TicketSelection.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaUsers,
  FaChair,
  FaCalculator,
  FaTimes,
  FaPlus,
  FaMinus,
  FaShoppingCart,
  FaExclamationTriangle
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';

const TicketSelection = ({ event, isOpen, onClose }) => {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  
  // State for selected tickets
  const [selectedTickets, setSelectedTickets] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize selected tickets state
  useEffect(() => {
    if (event?.ticketTypes?.length > 0) {
      const initialTickets = {};
      event.ticketTypes.forEach(ticket => {
        initialTickets[ticket._id] = 0;
      });
      setSelectedTickets(initialTickets);
    }
  }, [event]);

  // Check if event has seating layout
  const hasSeatingLayout = event?.seatingLayout && event.seatingLayout.length > 0;

  // Calculate totals
  const calculateTotals = () => {
    if (!event?.ticketTypes) return { subtotal: 0, total: 0, totalTickets: 0 };

    let subtotal = 0;
    let totalTickets = 0;

    event.ticketTypes.forEach(ticketType => {
      const quantity = selectedTickets[ticketType._id] || 0;
      subtotal += (ticketType.price || 0) * quantity;
      totalTickets += quantity;
    });

const total = subtotal; 

    return { subtotal, total, totalTickets };
  };

  // Handle quantity change
  const handleQuantityChange = (ticketId, change) => {
    setSelectedTickets(prev => {
      const currentQuantity = prev[ticketId] || 0;
      const newQuantity = Math.max(0, currentQuantity + change);
      
      // Find the ticket type to check max quantity
      const ticketType = event.ticketTypes.find(t => t._id === ticketId);
      const maxQuantity = Math.min(
        ticketType?.quantity || 999,
        event.maxAttendeesPerRegistration || 10
      );
      
      return {
        ...prev,
        [ticketId]: Math.min(newQuantity, maxQuantity)
      };
    });
    
    // Clear any previous errors
    setErrors({});
  };

  // Validate selection
  const validateSelection = () => {
    const { totalTickets } = calculateTotals();
    const newErrors = {};

    if (totalTickets === 0) {
      newErrors.selection = 'Please select at least one ticket';
      setErrors(newErrors);
      return false;
    }

    if (totalTickets > (event.maxAttendeesPerRegistration || 10)) {
      newErrors.selection = `Maximum ${event.maxAttendeesPerRegistration || 10} tickets per order`;
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
      // Store selected tickets in sessionStorage for checkout page
      const ticketSelection = {
        eventId: event._id,
        tickets: selectedTickets,
        totals: calculateTotals(),
        hasSeatingLayout,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('ticketSelection', JSON.stringify(ticketSelection));

      // Navigate based on seating layout
      if (hasSeatingLayout) {
        // Phase 2: Navigate to seat selection
        router.push(`/events/seats/${event._id}`);
      } else {
        // Phase 1: Navigate directly to checkout
        router.push(`/checkout/events/${event._id}`);
      }
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!event?.dateTime) return '';
    
    const timeZone = event.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(event.dateTime, timeZone, 'EEEE, MMMM do, yyyy');
    const time = formatInTimeZone(event.dateTime, timeZone, 'h:mm a');
    
    return { date, time };
  };

  const { date, time } = getFormattedDateTime();
  const { subtotal, total, totalTickets } = calculateTotals();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select Tickets
              </h2>
              <h3 className="text-lg text-gray-600 mb-4">{event.title}</h3>
              
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
                  <span>{event.venue}</span>
                </div>
                {hasSeatingLayout && (
                  <div className="flex items-center">
                    <FaChair className="mr-2 text-purple-600" />
                    <span>Assigned Seating</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Ticket Types */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold flex items-center">
              <FaTicketAlt className="mr-2 text-blue-600" />
              Available Tickets
            </h4>
            
            {event.ticketTypes?.map((ticketType) => {
              const isAvailable = (ticketType.quantity || 0) > 0;
              const selectedQty = selectedTickets[ticketType._id] || 0;
              const remainingQty = (ticketType.quantity || 999) - selectedQty;
              
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
                        <h5 className="font-semibold text-gray-900">
                          {ticketType.name}
                        </h5>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${ticketType.price?.toFixed(2) || '0.00'}
                          </p>
                          
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaUsers className="mr-1" />
                          <span>
                            {isAvailable 
                              ? `${ticketType.quantity} available`
                              : 'Sold out'
                            }
                          </span>
                        </div>
                        
                        {/* Quantity Selector */}
                        {isAvailable && (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleQuantityChange(ticketType._id, -1)}
                              disabled={selectedQty === 0}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaMinus className="text-xs" />
                            </button>
                            
                            <span className="w-8 text-center font-semibold">
                              {selectedQty}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(ticketType._id, 1)}
                              disabled={selectedQty >= remainingQty || selectedQty >= (event.maxAttendeesPerRegistration || 10)}
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
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          {totalTickets > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold flex items-center mb-4">
                <FaCalculator className="mr-2 text-green-600" />
                Order Summary
              </h4>
              
              <div className="space-y-2">
                {event.ticketTypes?.map((ticketType) => {
                  const quantity = selectedTickets[ticketType._id] || 0;
                  if (quantity === 0) return null;
                  
                  return (
                    <div key={ticketType._id} className="flex justify-between text-sm">
                      <span>{ticketType.name} × {quantity}</span>
                      <span>${((ticketType.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                 
                  <div className="flex justify-between text-lg font-bold text-green-600 mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seating Info */}
          {hasSeatingLayout && totalTickets > 0 && (
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

          {/* Errors */}
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

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {totalTickets > 0 ? (
                <span>
                  {totalTickets} ticket{totalTickets !== 1 ? 's' : ''} selected
                  {hasSeatingLayout && ' • Seats to be selected next'}
                </span>
              ) : (
                <span>Select tickets to continue</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleProceed}
                disabled={totalTickets === 0 || isLoading}
                className={`px-6 py-2 rounded-lg font-semibold flex items-center transition-all ${
                  totalTickets > 0 && !isLoading
                    ? hasSeatingLayout
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
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
                        Proceed to Checkout
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSelection;