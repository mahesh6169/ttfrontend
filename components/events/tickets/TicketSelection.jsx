// components/events/tickets/TicketSelection.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
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
import { formatCurrency } from '@/utils/formatCurrency';

const TicketSelection = ({ event, isOpen, onClose }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
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

  // Check if event has seating layout
  const hasSeatingLayout = event?.seatingLayout && event.seatingLayout.length > 0;

  // Initialize purchase session when modal opens
  useEffect(() => {
    if (isOpen && event?._id) {
      // Initialize purchase session
      dispatch(initializePurchaseSession({ eventId: event._id }));
      
      // Set seat requirement
      dispatch(setSeatRequirement(hasSeatingLayout));
      
      // Set current step to ticket selection
      dispatch(setCurrentStep('ticket-selection'));
      
      // Pre-fill buyer info with user data if available
      if (user) {
        dispatch(updateBuyerInfo({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || ''
        }));
      }
    }
  }, [isOpen, event?._id, hasSeatingLayout, user, dispatch]);

  // Initialize purchase session when modal opens
  useEffect(() => {
    if (isOpen && event?._id) {
      // Initialize purchase session
      dispatch(initializePurchaseSession({ eventId: event._id }));
      
      // Set seat requirement
      dispatch(setSeatRequirement(hasSeatingLayout));
      
      // Set current step to ticket selection
      dispatch(setCurrentStep('ticket-selection'));
      
      // Set refund policy info if it's a paid event
      if (event.isPaid && event.refundPolicy) {
        dispatch(setRefundPolicyInfo({
          policyType: event.refundPolicy.processingFeePolicy || 'non-refundable',
          policyText: event.refundPolicy.policyText || '',
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
  }, [isOpen, event?._id, hasSeatingLayout, user, dispatch]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      dispatch(resetPurchaseSession());
    }
  }, [isOpen, dispatch]);

  // Handle quantity change
  const handleQuantityChange = (ticketId, change) => {
    if (!event?.ticketTypes) return;
    
    const ticketType = event.ticketTypes.find(t => t._id === ticketId);
    if (!ticketType) return;

    // Get current quantity
    const currentTicket = selectedTickets.find(t => t.ticketTypeId === ticketId);
    const currentQuantity = currentTicket?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    
    // Calculate max quantity
    const maxQuantity = Math.min(
      ticketType.quantity || 999,
      event.maxAttendeesPerRegistration || 10
    );
    
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

    if (totals.totalQuantity > (event.maxAttendeesPerRegistration || 10)) {
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
      // Mark step as completed
      dispatch(setCurrentStep(hasSeatingLayout ? 'seat-selection' : 'details'));
      
      // Store ticket selection in sessionStorage as fallback during transition
      const ticketSelectionFallback = {
        eventId: event._id,
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
        router.push(`/events/seats/${event._id}`);
      } else {
        // Navigate directly to checkout
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Select Tickets
              </h2>
              <h3 className="text-lg text-slate-600 mb-4">{event.title}</h3>
              
              {/* Event Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
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
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <FaTimes className="text-slate-500" />
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
              const selectedTicket = selectedTickets.find(t => t.ticketTypeId === ticketType._id);
              const selectedQty = selectedTicket?.quantity || 0;
              const remainingQty = (ticketType.quantity || 999) - selectedQty;
              
              return (
                <div
                  key={ticketType._id}
                  className={`border rounded-lg p-4 transition-all ${
                    isAvailable 
                      ? 'border-slate-200 hover:border-blue-300 hover:shadow-md' 
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Ticket Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-slate-900">
                          {ticketType.name}
                        </h5>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(ticketType.price || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-600">
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
                              disabled={selectedQty === 0 || loading.initializing}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                selectedQty >= (event.maxAttendeesPerRegistration || 10) ||
                                loading.initializing
                              }
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Date restrictions */}
                      {(ticketType.startDate || ticketType.expiryDate) && (
                        <div className="mt-2 text-xs text-slate-500">
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
          {totals.totalQuantity > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold flex items-center mb-4">
                <FaCalculator className="mr-2 text-green-600" />
                Order Summary
              </h4>
              
              <div className="space-y-2">
                {selectedTickets?.map((selectedTicket) => {
                  if (selectedTicket.quantity === 0) return null;
                  
                  return (
                    <div key={selectedTicket.ticketTypeId} className="flex justify-between text-sm">
                      <span>{selectedTicket.name} × {selectedTicket.quantity}</span>
                      <span>{formatCurrency(selectedTicket.price * selectedTicket.quantity)}</span>
                    </div>
                  );
                })}
                
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold text-green-600 mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Refund Policy Display - Only show for paid events */}
          {event.isPaid && event.refundPolicy && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <span>Refund Policy</span>
                    {event.refundPolicy.processingFeePolicy === 'refunded' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Customer-Friendly
                      </span>
                    )}
                  </h4>
                  
                  <div className="text-sm text-blue-700 space-y-2">
                    {/* Processing Fee Policy */}
                    <div className="flex items-start">
                      {event.refundPolicy.processingFeePolicy === 'refunded' ? (
                        <>
                          <svg className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>
                            <strong>Full refunds including processing fees:</strong> If you need to cancel, you'll receive a complete refund including the $1 processing fee.
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span>
                            <strong>Processing fees are non-refundable:</strong> If you need to cancel, you'll receive a refund of the ticket price minus the $1 processing fee.
                          </span>
                        </>
                      )}
                    </div>

                    {/* Additional Policy Text */}
                    {event.refundPolicy.policyText && (
                      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800 italic">
                          "{event.refundPolicy.policyText}"
                        </p>
                      </div>
                    )}

                    {/* Policy Summary */}
                    <div className="mt-3 text-xs text-blue-600 bg-white bg-opacity-30 rounded p-2">
                      💡 <strong>Note:</strong> You'll need to acknowledge this refund policy during checkout before completing your purchase.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Redux Error Display */}
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

          {/* Local Errors */}
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
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {totals.totalQuantity > 0 ? (
                <span>
                  {totals.totalQuantity} ticket{totals.totalQuantity !== 1 ? 's' : ''} selected
                  {hasSeatingLayout && ' • Seats to be selected next'}
                </span>
              ) : (
                <span>Select tickets to continue</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading.initializing}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleProceed}
                disabled={!canProceedToNext || isLoading || loading.initializing}
                className={`px-6 py-2 rounded-lg font-semibold flex items-center transition-all ${
                  canProceedToNext && !isLoading && !loading.initializing
                    ? hasSeatingLayout
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
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