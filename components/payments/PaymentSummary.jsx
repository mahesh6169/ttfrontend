// components/payments/PaymentSummary.jsx

'use client';

import React from 'react';
import { 
  FaTicketAlt, 
  FaInfoCircle,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaTag
} from 'react-icons/fa';
import RefundPolicyDisplay from '@/components/events/refunds/RefundPolicyDisplay';

const PaymentSummary = ({ 
  event, 
  selectedTickets, 
  totals, 
  buyerInfo,
  selectedSeats,
  formatSelectedSeats,
  showEventDetails = true,
  showBuyerInfo = true,
  className = ""
}) => {
  if (!event || !selectedTickets || !totals) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateTime, timeZone) => {
    if (!dateTime) return { date: '', time: '' };
    
    const eventDate = new Date(dateTime);
    const options = {
      timeZone: timeZone || 'Australia/Sydney',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const timeOptions = {
      timeZone: timeZone || 'Australia/Sydney',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return {
      date: eventDate.toLocaleDateString('en-AU', options),
      time: eventDate.toLocaleTimeString('en-AU', timeOptions)
    };
  };

  const { date, time } = formatDateTime(event.dateTime, event.timeZone);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 ${className}`}>
      {/* Order Summary Header */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h2 className="text-sm sm:text-lg lg:text-xl font-semibold flex items-center">
          <FaTicketAlt className="mr-1.5 sm:mr-2 text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
          Order Summary
        </h2>
      </div>

      {/* Event Details Section */}
      {showEventDetails && (
        <div className="mb-3 sm:mb-4 lg:mb-6 pb-3 sm:pb-4 lg:pb-6 border-b border-gray-200">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3">{event.title}</h3>
          
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1.5 sm:mr-2 text-blue-600 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            <div className="flex items-center">
              <FaClock className="mr-1.5 sm:mr-2 text-green-600 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{time}</span>
              {event.timeZone && (
                <span className="ml-1 sm:ml-2 text-gray-500 text-[10px] sm:text-xs">({event.timeZone})</span>
              )}
            </div>
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-1.5 sm:mr-2 text-red-600 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            {event.address && (
              <div className="flex items-start">
                <FaMapMarkerAlt className="mr-1.5 sm:mr-2 text-purple-600 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm leading-relaxed">
                  {(() => {
                    // Custom format: street number, street, suburb, state
                    const parts = [];
                    if (event.address.streetNumber) parts.push(event.address.streetNumber);
                    if (event.address.street) parts.push(event.address.street);
                    if (event.address.suburb) parts.push(event.address.suburb);
                    if (event.address.state) parts.push(event.address.state);
                    
                    return parts.join(', ') || event.address.formattedAddress || 'Address not available';
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buyer Information Section */}
      {showBuyerInfo && buyerInfo && (
        <div className="mb-3 sm:mb-4 lg:mb-6 pb-3 sm:pb-4 lg:pb-6 border-b border-gray-200">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Buyer Information</h3>
          
          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center">
              <FaUser className="mr-1.5 sm:mr-2 text-blue-600 w-3 h-3 sm:w-4 sm:h-4" />
              <span>{buyerInfo.firstName} {buyerInfo.lastName}</span>
            </div>
            <div className="flex items-center">
              <FaEnvelope className="mr-1.5 sm:mr-2 text-green-600 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">{buyerInfo.email}</span>
            </div>
            <div className="flex items-center">
              <FaPhone className="mr-1.5 sm:mr-2 text-purple-600 w-3 h-3 sm:w-4 sm:h-4" />
              <span>{buyerInfo.phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Seats */}
      {selectedSeats && selectedSeats.length > 0 && (
        <div className="mb-3 sm:mb-4 lg:mb-6 pb-3 sm:pb-4 lg:pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Seats:</span>
            <span className="text-xs sm:text-sm text-gray-900 text-right">{formatSelectedSeats()}</span>
          </div>
        </div>
      )}

      {/* Selected Tickets */}
      <div className="mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-3">Tickets</h3>
        
        <div className="space-y-2 sm:space-y-3">
          {selectedTickets.map((ticket, index) => (
            <div key={ticket._id || index} className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{ticket.name}</p>
                <div className="flex items-center text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                  <span>Qty: {ticket.quantity}</span>
                  <span className="mx-1 sm:mx-2">•</span>
                  <span>${ticket.price?.toFixed(2)} ea</span>
                </div>
              </div>
              <p className="font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                ${ticket.totalPrice?.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 pt-2 sm:pt-3 lg:pt-4 space-y-1.5 sm:space-y-2">
        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">${totals.subtotal?.toFixed(2)}</span>
        </div>
        
        {/* Only show GST if it exists and is greater than 0 */}
        {totals.gst && totals.gst > 0 && (
          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span className="flex items-center">
              GST (10%)
              <FaInfoCircle className="ml-0.5 sm:ml-1 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" title="Goods and Services Tax" />
            </span>
            <span className="font-medium">${totals.gst.toFixed(2)}</span>
          </div>
        )}
        
        {/* Service Fee (if applicable) */}
        {totals.serviceFee && totals.serviceFee > 0 && (
          <div className="flex justify-between text-xs sm:text-sm text-gray-600">
            <span className="flex items-center">
              Service Fee
              <FaInfoCircle className="ml-0.5 sm:ml-1 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" title="Payment processing fee" />
            </span>
            <span className="font-medium">${totals.serviceFee.toFixed(2)}</span>
          </div>
        )}
        
        {/* Total */}
        <div className="flex justify-between text-sm sm:text-base lg:text-lg font-bold text-green-600 pt-1.5 sm:pt-2 border-t border-gray-200">
          <span>Total</span>
          <span>${totals.total?.toFixed(2)}</span>
        </div>
        {/* GST Inclusion Note */}
        {event.gstIncluded && (
          <div className="flex justify-start text-[10px] sm:text-xs text-gray-500 italic pt-0.5 sm:pt-1">
            <span>GST included</span>
          </div>
        )}
        
        {/* Refund Policy Note - Only for paid events */}
        {event.isPaid && event.refundPolicy && (
          <div className="flex justify-start text-[10px] sm:text-xs text-gray-500 italic pt-0.5 sm:pt-1">
            <span>
              {event.refundPolicy.processingFeePolicy === 'refunded' 
                ? 'Full refunds available' 
                : 'Fees non-refundable'
              }
            </span>
          </div>
        )}
      </div>
      


    </div>
  );
};

export default PaymentSummary;