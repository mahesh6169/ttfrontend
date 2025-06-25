'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InvoiceModal from './InvoiceModal';
import { 
  checkInvoiceEligibility,
  selectInvoiceEligibility,
   setGroupCustomAmount,
     selectRefundForm 
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
  const refundForm = useSelector(selectRefundForm);
  const [customAmount, setCustomAmount] = useState(''); 
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [invoiceData, setInvoiceData] = useState(null);
const [invoiceLoading, setInvoiceLoading] = useState(false);
const [invoiceError, setInvoiceError] = useState(null);

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

  const handleCustomAmountChange = (value) => {
  setCustomAmount(value);
  dispatch(setGroupCustomAmount({
    invoiceNumber: invoiceNumber,
    amount: value ? parseFloat(value) : null
  }));
};

const getRefundAmount = () => {
  const customRefundAmount = refundForm.groupCustomAmounts[invoiceNumber];
  return customRefundAmount !== undefined ? customRefundAmount : totalAmount;
};

const handleViewInvoice = async (identifier) => {
  setInvoiceLoading(true);
  setInvoiceError(null);
  setShowInvoiceModal(true);
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/invoices/lookup/${identifier}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    setInvoiceData(data.invoice);
  } catch (err) {
    setInvoiceError(err.message);
  } finally {
    setInvoiceLoading(false);
  }
};

// Check if all tickets are refunded
const allTicketsRefunded = tickets.every(t => t.refundStatus === 'refunded' || t.status === 'refunded');
const hasRefundedTickets = tickets.some(t => t.refundStatus === 'refunded' || t.status === 'refunded');

return (
  <>
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
    All Tickets Refunded
  </span>
)}
{hasRefundedTickets && !allTicketsRefunded && (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
    Mixed Status
  </span>
)}
                {/* Eligibility Badge - Only show if there are tickets that can be refunded */}
                {!allTicketsRefunded && (
                  <>
                    {isEligible ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <IoShieldCheckmarkOutline className="h-3 w-3 mr-1" />
                        Group Refundable
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <IoWarningOutline className="h-3 w-3 mr-1" />
                        Individual Only
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Eligibility Warning - Only show if not eligible AND not all tickets refunded */}
              {!isEligible && !allTicketsRefunded && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <IoWarningOutline className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Individual Refunds Required</h4>
                      <p className="text-sm text-red-700 mt-1">{eligibilityStatus.reason}</p>
                      <p className="text-xs text-red-600 mt-1">
                        This invoice cannot be refunded as a group. Process tickets individually.
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

{/* Right Section - Invoice & Actions */}
<div className="flex-shrink-0 text-right">
  <button
    onClick={() => handleViewInvoice(invoiceNumber)}
    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium mb-2"
  >
    📄 View Invoice
  </button>
  
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="block w-full text-sm text-purple-600 hover:text-purple-800 transition-colors"
  >
    {isExpanded ? (
      <>
        <IoChevronUp className="h-4 w-4 mr-1 inline" />
        Hide Details
      </>
    ) : (
      <>
        <IoChevronDown className="h-4 w-4 mr-1 inline" />
        View Details
      </>
    )}
  </button>
</div>
        </div>


      </div>

      {/* Custom Refund Amount (when selected) */}
{isSelected && isEligible && (
  <div className="mt-4 pt-4 border-t border-blue-200">
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-blue-900">
          Group Refund Amount
        </label>
        <button
          onClick={() => {
            setCustomAmount('');
            handleCustomAmountChange('');
          }}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reset to Full Amount
        </button>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IoCash className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="number"
              min="0"
              max={totalAmount}
              step="0.01"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder={totalAmount.toString()}
              className="block w-full pl-9 pr-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="text-sm text-blue-700">
          of {formatCurrency(totalAmount)}
        </div>
      </div>
      
      <p className="text-xs text-blue-600 mt-2">
        Leave empty for full refund. Enter custom amount for partial group refund.
      </p>
    </div>
  </div>
)}

      {/* Expanded Ticket Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Individual Tickets in this Invoice</h4>
            
            

            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.ticketNumber} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-blue-600">
                        <IoTicket className="h-4 w-4 mr-1" />
                        <span className="text-sm font-mono font-medium">{ticket.ticketNumber}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
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


          </div>
        </div>
      )}
    </div>
       {/* Invoice Modal */}
    {showInvoiceModal && (
      <InvoiceModal
        invoiceData={invoiceData}
        invoiceLoading={invoiceLoading}
        invoiceError={invoiceError}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceData(null);
          setInvoiceError(null);
        }}
      />
    )}
  </>
  );
}