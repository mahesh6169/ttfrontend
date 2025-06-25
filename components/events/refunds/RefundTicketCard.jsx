'use client';

import { useState } from 'react';
import InvoiceModal from './InvoiceModal';
import { useDispatch, useSelector } from 'react-redux';
import { setCustomRefundAmount, selectRefundForm } from '@/store/slices/events/refundSlice';
import { 
  IoTicket, 
  IoPerson, 
  IoCash,
  IoCheckmarkCircle
} from 'react-icons/io5';

export default function RefundTicketCard({ ticket, isSelected, onToggleSelect }) {
  const dispatch = useDispatch();
  const refundForm = useSelector(selectRefundForm);
  
  const [customAmount, setCustomAmount] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [invoiceData, setInvoiceData] = useState(null);
const [invoiceLoading, setInvoiceLoading] = useState(false);
const [invoiceError, setInvoiceError] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    dispatch(setCustomRefundAmount({
      ticketNumber: ticket.ticketNumber,
      amount: value ? parseFloat(value) : null
    }));
  };

  const getRefundAmount = () => {
    const customRefundAmount = refundForm.customAmounts[ticket.ticketNumber];
    return customRefundAmount !== undefined ? customRefundAmount : ticket.priceDetails.totalPrice;
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

 const getSeatDisplayText = () => {
  if (!ticket.seats || ticket.seats.length === 0) {
    return 'General Admission';
  }
  return ticket.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ');
};

// Check if ticket is refunded
const isRefunded = ticket.refundStatus === 'refunded' || ticket.status === 'refunded';

return (
  <>
    <div className={`bg-white border rounded-lg shadow-sm transition-all duration-200 ${
      isRefunded 
        ? 'border-red-200 bg-red-50 opacity-75' 
        : isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Section - Ticket Info */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0 pt-1">
              <button
                onClick={isRefunded ? undefined : onToggleSelect}
                disabled={isRefunded}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isRefunded
                    ? 'bg-red-100 border-red-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {isRefunded ? (
                  <span className="text-red-600 text-xs">✕</span>
                ) : isSelected ? (
                  <IoCheckmarkCircle className="w-3 h-3" />
                ) : null}
              </button>
            </div>

            {/* Ticket Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center text-blue-600">
                  <IoTicket className="h-5 w-5 mr-1" />
                  <span className="text-sm font-mono font-medium">{ticket.ticketNumber}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isRefunded 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isRefunded ? `Refunded - ${formatDate(ticket.refundedAt)}` : ticket.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer Information */}
                <div>
                  <div className="flex items-center text-gray-900 mb-1">
                    <IoPerson className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">
                      {ticket.buyer.firstName} {ticket.buyer.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{ticket.buyer.email}</p>
                  {ticket.buyer.phone && (
                    <p className="text-sm text-gray-600 ml-6">{ticket.buyer.phone}</p>
                  )}
                </div>

                {/* Ticket Details */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Type:</span> {ticket.ticketType.name}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Seats:</span> {getSeatDisplayText()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Invoice:</span> {ticket.invoiceNumber}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Invoice Button */}
          <div className="flex-shrink-0 text-right">
            <button
              onClick={() => handleViewInvoice(ticket.ticketNumber)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-2"
            >
              📄 View Invoice
            </button>
            <p className="text-xs text-gray-500">
              Purchased {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>

        {/* Custom Refund Amount (when selected) */}
        {isSelected && !isRefunded && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-blue-900">
                  Refund Amount
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
                      max={ticket.priceDetails.totalPrice}
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder={ticket.priceDetails.totalPrice.toString()}
                      className="block w-full pl-9 pr-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  of {formatCurrency(ticket.priceDetails.totalPrice)}
                </div>
              </div>
              
              <p className="text-xs text-blue-600 mt-2">
                Leave empty for full refund. Enter partial amount for custom refund.
              </p>
            </div>
          </div>
        )}
      </div>
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