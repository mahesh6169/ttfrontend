'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setShowRefundModal,
  setRefundReason,
  clearRefundForm,
  clearSelectedTickets,
  processIndividualRefund,
  processGroupRefund,
  selectUI,
  selectSelectedTickets,
  selectRefundForm,
  selectSelectedEvent,
  selectProcessing,
  selectTotalRefundAmount
} from '@/store/slices/events/refundSlice';
import { 
  IoClose,
  IoWarningOutline,
  IoCheckmarkCircle,
  IoCash
} from 'react-icons/io5';
import LoadingSpinner from './LoadingSpinner';

export default function RefundModal() {
  const dispatch = useDispatch();
  const ui = useSelector(selectUI);
  const selectedTickets = useSelector(selectSelectedTickets);
  const refundForm = useSelector(selectRefundForm);
  const selectedEvent = useSelector(selectSelectedEvent);
  const processing = useSelector(selectProcessing);
  const totalIndividualRefund = useSelector(selectTotalRefundAmount);

  const [localReason, setLocalReason] = useState(refundForm.reason);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLocalReason(refundForm.reason);
  }, [refundForm.reason]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const getTotalRefundAmount = () => {
    if (ui.activeTab === 'individual') {
      return totalIndividualRefund;
    } else {
      return Object.entries(selectedTickets.grouped).reduce((total, [invoiceNumber, tickets]) => {
        return total + tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0);
      }, 0);
    }
  };

  const getRefundSummary = () => {
    if (ui.activeTab === 'individual') {
      return {
        type: 'Individual Tickets',
        count: selectedTickets.individual.length,
        items: selectedTickets.individual.map(ticket => ({
          id: ticket.ticketNumber,
          name: ticket.ticketNumber,
          amount: refundForm.customAmounts[ticket.ticketNumber] || ticket.priceDetails.totalPrice,
          originalAmount: ticket.priceDetails.totalPrice
        }))
      };
    } else {
      return {
        type: 'Invoice Groups',
        count: Object.keys(selectedTickets.grouped).length,
        items: Object.entries(selectedTickets.grouped).map(([invoiceNumber, tickets]) => ({
          id: invoiceNumber,
          name: `${invoiceNumber} (${tickets.length} tickets)`,
          amount: tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0),
          originalAmount: tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0)
        }))
      };
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      dispatch(setShowRefundModal(false));
      setLocalReason('');
    }
  };

  const handleReasonChange = (value) => {
    setLocalReason(value);
    dispatch(setRefundReason(value));
  };

  const handleConfirmRefund = async () => {
    if (!localReason.trim()) {
      return;
    }

    setIsProcessing(true);

    try {
      if (ui.activeTab === 'individual') {
        for (const ticket of selectedTickets.individual) {
          const customAmount = refundForm.customAmounts[ticket.ticketNumber];
          await dispatch(processIndividualRefund({
            eventId: selectedEvent._id,
            ticketNumber: ticket.ticketNumber,
            refundAmount: customAmount || ticket.priceDetails.totalPrice,
            reason: localReason.trim()
          })).unwrap();
        }
      } else {
        for (const [invoiceNumber, tickets] of Object.entries(selectedTickets.grouped)) {
          await dispatch(processGroupRefund({
            eventId: selectedEvent._id,
            invoiceNumber: invoiceNumber,
            reason: localReason.trim()
          })).unwrap();
        }
      }

      setTimeout(() => {
        dispatch(clearRefundForm());
        dispatch(clearSelectedTickets());
        dispatch(setShowRefundModal(false));
        setIsProcessing(false);
        setLocalReason('');
      }, 2000);

    } catch (error) {
      setIsProcessing(false);
    }
  };

  const summary = getRefundSummary();
  const totalAmount = getTotalRefundAmount();
  const isLoading = processing.individual.loading || processing.group.loading || isProcessing;
  const hasSuccess = processing.individual.success || processing.group.success;
  const hasError = processing.individual.error || processing.group.error;

  if (!ui.showRefundModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Refund
            </h3>
            {!isProcessing && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <IoClose className="h-6 w-6" />
              </button>
            )}
          </div>

          {hasSuccess && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <IoCheckmarkCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">
                      Refund Processed Successfully
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {ui.activeTab === 'individual' 
                        ? `${selectedTickets.individual.length} ticket(s) have been refunded`
                        : `${Object.keys(selectedTickets.grouped).length} invoice group(s) have been refunded`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <IoWarningOutline className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Refund Failed
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {processing.individual.error || processing.group.error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !hasSuccess && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <LoadingSpinner size="sm" color="blue" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Processing Refund...
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Please wait while we process your refund request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasSuccess && (
            <>
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Refund Summary</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">{summary.type}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.count} item{summary.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {summary.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate flex-1 mr-2">{item.name}</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                          {item.amount !== item.originalAmount && (
                            <div className="text-xs text-yellow-600">
                              (was {formatCurrency(item.originalAmount)})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-900">Total Refund</span>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={localReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  placeholder="Please provide a reason for this refund (e.g., event cancelled, customer request, etc.)"
                  rows={3}
                  disabled={isLoading}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be included in the refund notification to customers.
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <IoWarningOutline className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium text-red-800">Important Notice</h5>
                      <ul className="text-sm text-red-700 mt-1 space-y-1">
                        <li>• This action cannot be undone</li>
                        <li>• Refunded tickets will be permanently cancelled</li>
                        <li>• Seats will be released and made available for sale</li>
                        <li>• Customers will receive refund notifications</li>
                        <li>• Payment processing may take 3-5 business days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            {hasSuccess ? (
              <button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRefund}
                  disabled={!localReason.trim() || isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Processing...</span>
                    </div>
                  ) : (
                    <>
                      Confirm Refund
                      <span className="block text-xs font-normal opacity-90">
                        {formatCurrency(totalAmount)}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}