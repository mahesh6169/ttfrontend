'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import InvoiceModal from './InvoiceModal';
import { 
  checkInvoiceEligibility,
  selectInvoiceEligibility,
   setGroupCustomAmount,
     selectRefundForm,
     clearGroupProcessingState, 
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
      day: 'numeric'
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
     // Clear any existing success/error states when selecting new invoice groups
  dispatch(clearGroupProcessingState());
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
      <div className="p-4">
        {/* First Row: Invoice Number, Badges, View Invoice */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {/* Selection Checkbox */}
            <button
              onClick={allTicketsRefunded ? undefined : handleToggleSelect}
              disabled={!isEligible || allTicketsRefunded}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
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
                <IoCheckmarkCircle className="w-3 h-3" />
              ) : !isEligible ? (
                <IoWarningOutline className="w-3 h-3 text-red-600" />
              ) : null}
            </button>
            
            <span className="font-semibold text-gray-900">{invoiceNumber}</span>
            
            {/* Eligibility Badge */}
            {!allTicketsRefunded && (
              <>
                {isEligible ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Group Refundable
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Individual Only
                  </span>
                )}
              </>
            )}
            
            {allTicketsRefunded && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                All Refunded
              </span>
            )}
          </div>
          
          <button
            onClick={() => handleViewInvoice(invoiceNumber)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View Invoice
          </button>
        </div>
        
        {/* Second Row: Buyer Info */}
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Buyer:</span> {buyerInfo?.firstName} {buyerInfo?.lastName}
          <span className="mx-2">•</span>
          <span className="font-medium">email:</span> {buyerInfo?.email}
          {buyerInfo?.phone && (
            <>
              <span className="mx-2">•</span>
              <span className="font-medium">mobile:</span> {buyerInfo?.phone}
            </>
          )}
          <span className="mx-2">•</span>
          <span className="font-medium">Purchased:</span> {formatDate(tickets[0]?.createdAt)}
        </div>
        
        {/* Third Row: Ticket Info */}
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Tickets:</span> {ticketCount}
          <span className="mx-2">•</span>
          <span className="font-medium">Types:</span> {getTicketTypeSummary()}
          <span className="mx-2">•</span>
          <span className="font-medium">Seats:</span> {getSeatsSummary()}
          <span className="mx-2">•</span>
          <span className="font-medium">Refunded:</span> {tickets.filter(t => t.refundStatus === 'refunded' || t.status === 'refunded').length}/{ticketCount}
        </div>
        
        {/* Warning messages in small red text */}
        {hasRefundedTickets && !allTicketsRefunded && (
          <p className="text-xs text-red-600 mt-1">
            Some tickets in this invoice are already refunded
          </p>
        )}
        {!isEligible && !allTicketsRefunded && (
          <p className="text-xs text-red-600">
            This invoice cannot be refunded as a group. Process tickets individually.
          </p>
        )}
        
        {/* Expand/Collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700 mt-2"
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
        </button>
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
          <div className="p-4 space-y-2">
            {tickets.map((ticket) => {
              const seatInfo = ticket.seats && ticket.seats.length > 0 
                ? `Seat: ${ticket.seats.map(seat => `${seat.row}-${seat.seatNumber}`).join(', ')}`
                : null;
              
              return (
                <div key={ticket.ticketNumber} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-gray-900">{ticket.ticketNumber}</span>
                      <span className="text-xs text-gray-500">
                        {ticket.ticketType.name}
                        {seatInfo && ` ${seatInfo}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(ticket.priceDetails.totalPrice)}
                  </div>
                </div>
              );
            })}
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