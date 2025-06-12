'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCustomRefundAmount, selectRefundForm } from '@/store/slices/events/refundSlice';
import { 
  IoTicket, 
  IoPerson, 
  IoCash,
  IoCalendarOutline,
  IoLocationOutline,
  IoCheckmarkCircle,
  IoChevronDown,
  IoChevronUp
} from 'react-icons/io5';

export default function RefundTicketCard({ ticket, isSelected, onToggleSelect }) {
  const dispatch = useDispatch();
  const refundForm = useSelector(selectRefundForm);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

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

  const getSeatDisplayText = () => {
    if (!ticket.seats || ticket.seats.length === 0) {
      return 'General Admission';
    }
    return ticket.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ');
  };

  return (
    <div className={`bg-white border rounded-lg shadow-sm transition-all duration-200 ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left Section - Ticket Info */}
          <div className="flex items-start space-x-4 flex-1">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0 pt-1">
              <button
                onClick={onToggleSelect}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {isSelected && (
                  <IoCheckmarkCircle className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Ticket Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center text-blue-600">
                  <IoTicket className="h-5 w-5 mr-1" />
                  <span className="text-sm font-mono font-medium">{ticket.ticketNumber}</span>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {ticket.status}
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

          {/* Right Section - Price & Actions */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900 mb-2">
              {formatCurrency(ticket.priceDetails.totalPrice)}
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Purchased {formatDate(ticket.createdAt)}
            </p>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <IoChevronUp className="h-4 w-4 mr-1" />
                  Less Details
                </>
              ) : (
                <>
                  <IoChevronDown className="h-4 w-4 mr-1" />
                  More Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom Refund Amount (when selected) */}
        {isSelected && (
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

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">{formatCurrency(ticket.priceDetails.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-medium">{formatCurrency(ticket.priceDetails.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Payment Date:</span>
                  <span>{formatDate(ticket.paymentDate)}</span>
                </div>
                {ticket.paymentIntentId && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Payment ID:</span>
                    <span className="font-mono">{ticket.paymentIntentId.slice(-8)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Attendee Details</h4>
              <div className="space-y-2">
                {ticket.attendees && ticket.attendees.length > 0 ? (
                  ticket.attendees.map((attendee, index) => (
                    <div key={index} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{attendee.name}</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          attendee.checkedIn 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {attendee.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </span>
                      </div>
                      {attendee.checkedIn && attendee.checkInTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          Checked in: {formatDate(attendee.checkInTime)}
                        </p>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No attendee information available</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Snapshot */}
          {ticket.eventSnapshot && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Event Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <IoCalendarOutline className="h-4 w-4 mr-2" />
                  {formatDate(ticket.eventSnapshot.dateTime)}
                </div>
                <div className="flex items-center text-gray-600">
                  <IoLocationOutline className="h-4 w-4 mr-2" />
                  {ticket.eventSnapshot.venue}
                </div>
              </div>
              {ticket.eventSnapshot.organizer && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Organizer:</span> {ticket.eventSnapshot.organizer.name}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}