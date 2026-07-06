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
      <div className={`bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
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
    <div className={`p-2 sm:p-3 lg:p-4 flex flex-col lg:max-h-[calc(100vh-8rem)] ${className}`}>
      {/* Order Summary Header — hidden on mobile (the collapsible toggle already labels it) */}
      <div className="hidden lg:block mb-2 sm:mb-3 lg:mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center">
          <FaTicketAlt className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          Order Summary
        </h2>
      </div>

      {/* Scrollable body — the list scrolls; Total stays pinned below */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
      {/* Event Details Section */}
      {showEventDetails && (
        <div className="mb-2 sm:mb-3 lg:mb-4 pb-2 sm:pb-3 lg:pb-4 border-b border-slate-200">
          <h3 className="text-base lg:text-lg font-bold text-black mb-1 sm:mb-2">Event Details</h3>
          <div className="text-sm lg:text-base text-slate-600 mb-0.5">{event.title}</div>
          {event.eventCode && (
            <div className="text-sm lg:text-base text-slate-600 mb-1 sm:mb-2">Event Code: {event.eventCode}</div>
          )}
          
          <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-sm lg:text-base text-slate-600">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            <div className="flex items-center">
              <FaClock className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span>{time}</span>
              {event.timeZone && (
                <span className="ml-1 text-slate-500 text-xs lg:text-sm">({event.timeZone})</span>
              )}
            </div>
            <div className="flex items-center">
              <FaMapMarkerAlt className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            {event.address && (
              <div className="flex items-start">
                <FaMapMarkerAlt className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm lg:text-base leading-relaxed">
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
        <div className="mb-2 sm:mb-3 lg:mb-4 pb-2 sm:pb-3 lg:pb-4 border-b border-slate-200">
          <h3 className="text-base lg:text-lg font-bold text-black mb-1 sm:mb-2">Buyer Information</h3>
          
          <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-sm lg:text-base text-slate-600">
            <div className="flex items-center">
              <FaUser className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
              <span>{buyerInfo.firstName} {buyerInfo.lastName}</span>
            </div>
            <div className="flex items-center">
              <FaEnvelope className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
              <span className="truncate">{buyerInfo.email}</span>
            </div>
            <div className="flex items-center">
              <FaPhone className="mr-1 sm:mr-1.5 lg:mr-2 text-teal-700 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" />
              <span>{buyerInfo.phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Seats */}
      {selectedSeats && selectedSeats.length > 0 && (
        <div className="mb-2 sm:mb-3 lg:mb-4 pb-2 sm:pb-3 lg:pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm lg:text-base font-bold text-black">Seats:</span>
            <span className="text-sm lg:text-base text-slate-900 text-right">{formatSelectedSeats()}</span>
          </div>
        </div>
      )}

      {/* Selected Tickets */}
      <div className="mb-2 sm:mb-3 lg:mb-4">
        <h3 className="text-base lg:text-lg font-bold text-black mb-1 sm:mb-2">Tickets</h3>
        
        <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
          {selectedTickets.filter(ticket => ticket && ticket.name && ticket.quantity > 0).map((ticket, index) => (
            <div key={ticket._id || index} className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm lg:text-base truncate">{ticket.name}</p>
                <div className="text-xs lg:text-sm text-slate-600 mt-0.5">
                  <span>Qty: {ticket.quantity}</span>
                </div>
              </div>
              <p className="font-medium text-slate-900 text-sm lg:text-base whitespace-nowrap">
                ${ticket.totalPrice?.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Price Breakdown — pinned (outside the scroll) */}
      <div className="border-t border-slate-200 pt-1.5 sm:pt-2 lg:pt-3 space-y-1 sm:space-y-1.5 lg:space-y-2">
        {/* Subtotal + Discount (Option A — only when a discount is applied) */}
        {totals.discountAmount > 0 && (
          <>
            <div className="flex justify-between text-sm lg:text-base text-slate-700">
              <span>Subtotal</span>
              <span>${totals.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm lg:text-base text-teal-700">
              <span className="flex items-center gap-1">
                <FaTag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Discount{totals.discountCode ? ` (${totals.discountCode}${totals.discountScopeLabel ? `: ${totals.discountScopeLabel}` : ''})` : ''}
              </span>
              <span>-${totals.discountAmount?.toFixed(2)}</span>
            </div>
          </>
        )}
        {/* Total */}
        <div className="flex justify-between text-base lg:text-lg font-bold text-teal-700">
          <span>Total</span>
          <span>${totals.total?.toFixed(2)}</span>
        </div>
        {/* GST Inclusion Note */}
        {event.gstIncluded && (
          <div className="flex justify-start text-xs lg:text-sm text-slate-500 italic pt-0.5">
            <span>GST included</span>
          </div>
        )}
        
        {/* Refund Policy Note - Only for paid events */}
        {event.isPaid && event.refundPolicy && (
          <div className="flex justify-start text-xs lg:text-sm text-slate-500 italic pt-0.5">
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