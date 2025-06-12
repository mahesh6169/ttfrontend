'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkInvoiceEligibility,
  selectInvoiceEligibility
} from '@/store/slices/events/refundSlice';
import { 
  IoReceiptOutline,
  IoChevronDown,
  IoChevronUp,
  IoPerson,
  IoTicket,
  IoCash,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';

export default function InvoiceGroupCard({ 
  invoiceNumber, 
  tickets, 
  isSelected, 
  onToggleSelect,
  selectedEvent 
}) {
  const dispatch = useDispatch();
  const invoiceEligibility = useSelector(selectInvoiceEligibility);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const totalAmount = tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0);
  const buyerInfo = tickets[0]?.buyer; // All tickets in an invoice have the same buyer
  const ticketCount = tickets.length;

  // Check eligibility when component mounts or invoice changes
  useEffect(() => {
    if (selectedEvent && invoiceNumber && !eligibilityChecked) {
      dispatch(checkInvoiceEligibility({
        eventId: selectedEvent._id,
        invoiceNumber
      }));
      setEligibilityChecked(true);
    }
  }, [dispatch, selectedEvent, invoiceNumber, eligibilityChecked]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketTypeSummary = () => {
    const typeCounts = tickets.reduce((acc, ticket) => {
      const typeName = ticket.ticketType.name;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(typeCounts)
      .map(([type, count]) => `${count}x ${type}`)
      .join(', ');
  };

  const getSeatsSummary = () => {
    const hasSeats = tickets.some(ticket => ticket.seats && ticket.seats.length > 0);
    if (!hasSeats) return 'General Admission';
    
    const allSeats = tickets
      .filter(ticket => ticket.seats && ticket.seats.length > 0)
      .flatMap(ticket => ticket.seats)
      .map(seat => `${seat.row}${seat.seatNumber}`)
      .join(', ');
    
    return allSeats || 'Mixed (General + Seated)';
  };

  // Check if this invoice is eligible for group refund
const getEligibilityStatus = () => {
  // Check if any tickets in this invoice are already refunded
  const hasRefundedTickets = tickets.some(t => t.refundStatus === 'refunded' || t.status === 'refunded');
  
  if (hasRefundedTickets) {
    return { eligible: false, reason: 'Some tickets in this invoice are already refunded' };
  }

  if (!invoiceEligibility.data || invoiceEligibility.data.invoiceNumber !== invoiceNumber) {
    return { eligible: true, reason: 'Checking eligibility...' };
  }

  return {
    eligible: invoiceEligibility.data.canProcessGroupRefund,
    reason: invoiceEligibility.data.eligibilityReason
  };
};

  const eligibilityStatus = getEligibilityStatus();
  const isEligible = eligibilityStatus.eligible;

  // Enhanced click handler with eligibility check
  const handleToggleSelect = () => {
    if (!isEligible) {
      return; // Don't allow selection if not eligible
    }
    onToggleSelect();
  };

// Check if all tickets are refunded
const allTicketsRefunded = tickets.every(t => t.refundStatus === 'refunded' || t.status === 'refunded');
const hasRefundedTickets = tickets.some(t => t.refundStatus === 'refunded' || t.status === 'refunded');

return (
  <div className={`bg-white border rounded-lg shadow-sm transition-all duration-200 ${
    allTicketsRefunded
      ? 'border-red-200 bg-red-50 opacity-75'
      : isSelected 
      ? 'border-blue-500 bg-blue-50' 
      : !isEligible 
      ? 'border-red-200 bg-red-50' 
      : 'border-gray-200 hover:border-gray-300'
  }`}>
      {/* Main Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Section - Invoice Info */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0 pt-1">
<button
  onClick={allTicketsRefunded ? undefined : handleToggleSelect}
  disabled={!isEligible || allTicketsRefunded}
  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
    allTicketsRefunded
      ? 'bg-red-100 border-red-300 cursor-not-allowed'
      : !isEligible 
      ? 'bg-red-100 border-red-300 cursor-not-allowed'
      : isSelected
      ? 'bg-blue-600 border-blue-600 text-white'
      : 'border-gray-300 hover:border-gray-400'
  }`}
>
  {allTicketsRefunded ? (
    <span className="text-red-600 text-xs">✕</span>
  ) : isSelected && isEligible ? (
    <IoCheckmarkCircle className="w-4 h-4" />
  ) : !isEligible ? (
    <IoWarningOutline className="w-4 h-4 text-red-600" />
  ) : null}
</button>
            </div>

            {/* Invoice Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center text-purple-600">
                  <IoReceiptOutline className="h-5 w-5 mr-2" />
                  <span className="text-lg font-semibold">{invoiceNumber}</span>
                </div>
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
  {ticketCount} Ticket{ticketCount !== 1 ? 's' : ''}
</span>
{allTicketsRefunded && (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
    All Refunded
  </span>
)}
{hasRefundedTickets && !allTicketsRefunded && (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
    Mixed Status
  </span>
)}
                {/* Eligibility Badge */}
                {isEligible ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <IoShieldCheckmarkOutline className="h-3 w-3 mr-1" />
                    Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <IoWarningOutline className="h-3 w-3 mr-1" />
                    Not Eligible
                  </span>
                )}
              </div>

              {/* Eligibility Warning */}
              {!isEligible && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <IoWarningOutline className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Cannot Process Group Refund</h4>
                      <p className="text-sm text-red-700 mt-1">{eligibilityStatus.reason}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Use individual refunds for remaining tickets in this invoice.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer Information */}
                <div>
                  <div className="flex items-center text-gray-900 mb-2">
                    <IoPerson className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {buyerInfo?.firstName} {buyerInfo?.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{buyerInfo?.email}</p>
                  {buyerInfo?.phone && (
                    <p className="text-sm text-gray-600 ml-6">{buyerInfo?.phone}</p>
                  )}
                </div>

                {/* Purchase Summary */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Types:</span> {getTicketTypeSummary()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Seats:</span> {getSeatsSummary()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Purchased:</span> {formatDate(tickets[0]?.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Total & Actions */}
          <div className="flex-shrink-0 text-right">
            <div className="text-xl font-bold text-gray-900 mb-2">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Total for {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
            </p>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <IoChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <IoChevronDown className="h-4 w-4 mr-1" />
                  View Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Group Selection Notice */}
        {isSelected && isEligible && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <IoCheckmarkCircle className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Invoice Group Selected for Full Transaction Refund
                  </p>
                  <p className="text-sm text-blue-700">
                    All {ticketCount} tickets will be refunded in one transaction for {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This will process one Stripe refund for the entire original payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Ticket Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Individual Tickets in this Invoice</h4>
            
            {/* Payment Intent Info */}
            {invoiceEligibility.data && invoiceEligibility.data.invoiceNumber === invoiceNumber && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Payment Information</h5>
                <div className="text-sm text-blue-800">
                  <p>Payment Intent: <span className="font-mono text-xs">{invoiceEligibility.data.paymentIntentId?.slice(-12)}</span></p>
                  <p>All tickets share the same payment transaction</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.ticketNumber} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-blue-600">
                        <IoTicket className="h-4 w-4 mr-1" />
                        <span className="text-sm font-mono font-medium">{ticket.ticketNumber}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ticket.status}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(ticket.priceDetails.totalPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.ticketType.name}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Attendee:</span> {ticket.attendees?.[0]?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Seats:</span> {
                        ticket.seats && ticket.seats.length > 0 
                          ? ticket.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ')
                          : 'General Admission'
                      }
                    </div>
                  </div>

                  {/* Check-in Status */}
                  {ticket.attendees?.[0] && (
                    <div className="mt-2 flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.attendees[0].checkedIn 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.attendees[0].checkedIn ? '⚠️ Checked In' : 'Not Checked In'}
                      </span>
                      {ticket.attendees[0].checkedIn && (
                        <span className="ml-2 text-xs text-gray-500">
                          on {formatDate(ticket.attendees[0].checkInTime)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Group Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-purple-900 mb-2">Invoice Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-900">{ticketCount}</div>
                    <div className="text-purple-700">Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-900">{formatCurrency(totalAmount)}</div>
                    <div className="text-purple-700">Total Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-900">
                      {tickets.filter(t => t.attendees?.[0]?.checkedIn).length}
                    </div>
                    <div className="text-purple-700">Checked In</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-900">
                      {new Set(tickets.map(t => t.ticketType.name)).size}
                    </div>
                    <div className="text-purple-700">Ticket Types</div>
                  </div>
                </div>
                
                {/* Refund Type Explanation */}
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs text-purple-700">
                    <strong>Group Refund:</strong> Processes one full transaction refund against the original payment.
                    {!isEligible && " Not available due to mixed refund status."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}