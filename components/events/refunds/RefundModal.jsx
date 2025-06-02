'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Actions
import {
  initiateRefund,
  deleteTicket,
  closeRefundModal,
  updateRefundForm,
  resetRefundForm,
  setRefundAmount,
  nextModalStep,
  prevModalStep,
  setModalStep,
  clearError
} from '@/store/slices/events/refundSlice';

// Components
import LoadingSpinner from '@/components/LoadingSpinner';

const RefundModal = ({ isOpen, mode, ticket, event, onClose }) => {
  const dispatch = useDispatch();

  // Redux State
  const {
    processing,
    error,
    refundForm,
    refundModal
  } = useSelector((state) => state.refunds);

  // Local State
  const [isClosing, setIsClosing] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Calculate refund amounts
  const totalPrice = ticket?.priceDetails?.totalPrice || 0;
  const alreadyRefunded = ticket?.refundedAmount || 0;
  const maxRefundable = Math.max(0, totalPrice - alreadyRefunded);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && ticket) {
      dispatch(resetRefundForm());
      setCustomAmount(maxRefundable.toString());
      setDeleteReason('');
      dispatch(setModalStep(1));
    }
  }, [isOpen, ticket, maxRefundable, dispatch]);

  // Handle modal close
  const handleClose = () => {
    if (processing) return; // Prevent closing during processing
    
    setIsClosing(true);
    setTimeout(() => {
      dispatch(closeRefundModal());
      dispatch(resetRefundForm());
      setIsClosing(false);
      onClose?.();
    }, 150);
  };

  // Handle refund amount selection
  const handleAmountSelect = (amount) => {
    setCustomAmount(amount.toString());
    dispatch(setRefundAmount(amount));
  };

  // Handle custom amount input
  const handleCustomAmountChange = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    if (numValue > maxRefundable) return;
    
    setCustomAmount(value);
    dispatch(setRefundAmount(numValue));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (mode === 'refund') {
      handleRefundSubmit();
    } else if (mode === 'delete') {
      handleDeleteSubmit();
    }
  };

  // Handle refund submission
  const handleRefundSubmit = () => {
    const amount = parseFloat(customAmount);
    
    if (!refundForm.reason.trim()) {
      return; // Form validation will show error
    }

    if (amount <= 0 || amount > maxRefundable) {
      return; // Amount validation will show error
    }

    dispatch(initiateRefund({
      eventId: event._id,
      ticketNumber: ticket.ticketNumber,
      reason: refundForm.reason,
      refundAmount: amount
    }));
  };

  // Handle delete submission
  const handleDeleteSubmit = () => {
    if (!deleteReason.trim()) {
      return; // Validation will show error
    }

    dispatch(deleteTicket({
      eventId: event._id,
      ticketNumber: ticket.ticketNumber,
      reason: deleteReason
    }));
  };

  // Validation helpers
  const isValidRefund = () => {
    const amount = parseFloat(customAmount);
    return refundForm.reason.trim().length > 0 && 
           amount > 0 && 
           amount <= maxRefundable;
  };

  const isValidDelete = () => {
    return deleteReason.trim().length > 0;
  };

  if (!isOpen) return null;

  // Render step content based on mode and step
  const renderStepContent = () => {
    if (mode === 'delete') {
      return renderDeleteContent();
    }

    switch (refundModal.step) {
      case 1:
        return renderRefundStep1();
      case 2:
        return renderRefundStep2();
      case 3:
        return renderRefundStep3();
      default:
        return renderRefundStep1();
    }
  };

  // Delete ticket content
  const renderDeleteContent = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket</h3>
        <p className="text-gray-600">
          This will permanently delete ticket <span className="font-mono font-semibold">{ticket?.ticketNumber}</span>
        </p>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Warning</h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                <li>This action cannot be undone</li>
                <li>Ticket must be fully refunded first</li>
                <li>Seats will be released automatically</li>
                <li>Inventory will be restored</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reason Input */}
      <div>
        <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason for deletion *
        </label>
        <textarea
          id="delete-reason"
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="Please provide a reason for deleting this ticket..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        {deleteReason.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Reason is required</p>
        )}
      </div>
    </div>
  );

  // Refund Step 1: Confirmation
  const renderRefundStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Refund</h3>
        <p className="text-gray-600">
          Refund ticket <span className="font-mono font-semibold">{ticket?.ticketNumber}</span>
        </p>
      </div>

      {/* Ticket Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Ticket Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Ticket Type:</span>
            <span className="font-medium">{ticket?.ticketType?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Original Price:</span>
            <span className="font-medium">${totalPrice.toFixed(2)}</span>
          </div>
          {alreadyRefunded > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Already Refunded:</span>
              <span className="font-medium text-red-600">-${alreadyRefunded.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">Max Refundable:</span>
            <span className="font-semibold text-green-600">${maxRefundable.toFixed(2)}</span>
          </div>
          {ticket?.seats && ticket.seats.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Seats:</span>
              <span className="font-medium">
                {ticket.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Buyer Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Buyer Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{ticket?.attendees?.[0]?.name || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{ticket?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Purchase Date:</span>
            <span className="font-medium">
              {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Refund Step 2: Amount and Reason
  const renderRefundStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Refund Details</h3>
        <p className="text-gray-600">Set the refund amount and provide a reason</p>
      </div>

      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Refund Amount *
        </label>
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleAmountSelect(maxRefundable)}
            className={`px-4 py-3 text-sm font-medium rounded-lg border ${
              parseFloat(customAmount) === maxRefundable
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Full Refund
            <div className="text-xs text-gray-500">${maxRefundable.toFixed(2)}</div>
          </button>
          
          <button
            type="button"
            onClick={() => handleAmountSelect(maxRefundable * 0.5)}
            className={`px-4 py-3 text-sm font-medium rounded-lg border ${
              parseFloat(customAmount) === maxRefundable * 0.5
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            50% Refund
            <div className="text-xs text-gray-500">${(maxRefundable * 0.5).toFixed(2)}</div>
          </button>
          
          <button
            type="button"
            onClick={() => handleAmountSelect(0)}
            className={`px-4 py-3 text-sm font-medium rounded-lg border ${
              parseFloat(customAmount) === 0
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            No Refund
            <div className="text-xs text-gray-500">$0.00</div>
          </button>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label htmlFor="custom-amount" className="block text-sm text-gray-600 mb-2">
            Or enter custom amount:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="custom-amount"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              min="0"
              max={maxRefundable}
              step="0.01"
              className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">AUD</span>
            </div>
          </div>
          {parseFloat(customAmount) > maxRefundable && (
            <p className="mt-1 text-sm text-red-600">
              Amount cannot exceed ${maxRefundable.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Reason Input */}
      <div>
        <label htmlFor="refund-reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason for refund *
        </label>
        <textarea
          id="refund-reason"
          value={refundForm.reason}
          onChange={(e) => dispatch(updateRefundForm({ field: 'reason', value: e.target.value }))}
          placeholder="e.g., Customer request, event cancelled, duplicate purchase..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {refundForm.reason.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Reason is required</p>
        )}
      </div>

      {/* Refund Impact */}
      {parseFloat(customAmount) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Refund Impact</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Refund will be processed immediately via Stripe</li>
            {parseFloat(customAmount) === maxRefundable && (
              <>
                <li>• Seats will be released and made available</li>
                <li>• Ticket inventory will be restored</li>
                <li>• Ticket status will be marked as refunded</li>
              </>
            )}
            {parseFloat(customAmount) < maxRefundable && (
              <li>• This is a partial refund - ticket remains active</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  // Refund Step 3: Confirmation
  const renderRefundStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Refund</h3>
        <p className="text-gray-600">Please review the refund details before processing</p>
      </div>

      {/* Refund Summary */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-4">Refund Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-blue-700">Ticket Number:</span>
            <span className="font-mono font-semibold text-blue-900">{ticket?.ticketNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Refund Amount:</span>
            <span className="font-semibold text-blue-900">${parseFloat(customAmount).toFixed(2)} AUD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Refund Type:</span>
            <span className="font-semibold text-blue-900">
              {parseFloat(customAmount) === maxRefundable ? 'Full Refund' : 'Partial Refund'}
            </span>
          </div>
          <div className="border-t border-blue-200 pt-3">
            <div className="text-blue-700 text-sm font-medium mb-1">Reason:</div>
            <div className="text-blue-900 text-sm bg-white rounded px-3 py-2">
              {refundForm.reason}
            </div>
          </div>
        </div>
      </div>

      {/* Final Warning */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600">
              Once processed, this refund will be immediately sent to the customer's original payment method.
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}>
          
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'delete' ? 'Delete Ticket' : 'Process Refund'}
              </h2>
              <button
                onClick={handleClose}
                disabled={processing}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress Steps (for refund mode) */}
            {mode === 'refund' && (
              <div className="mt-4">
                <div className="flex items-center">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        step <= refundModal.step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`w-12 h-1 mx-2 ${
                          step < refundModal.step ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Review</span>
                  <span>Details</span>
                  <span>Confirm</span>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-white px-6 pb-6">
            {/* Error Display */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(clearError())}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step Content */}
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <div className="flex space-x-3">
              {/* Back Button (for refund mode) */}
              {mode === 'refund' && refundModal.step > 1 && (
                <button
                  onClick={() => dispatch(prevModalStep())}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              {/* Cancel Button */}
              <button
                onClick={handleClose}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Action Button */}
              {mode === 'delete' ? (
                <button
                  onClick={handleSubmit}
                  disabled={processing || !isValidDelete()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                >
                  {processing && <LoadingSpinner size="small" className="mr-2" />}
                  {processing ? 'Deleting...' : 'Delete Ticket'}
                </button>
              ) : (
                <>
                  {refundModal.step < 3 ? (
                    <button
                      onClick={() => dispatch(nextModalStep())}
                      disabled={processing || (refundModal.step === 2 && !isValidRefund())}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={processing || !isValidRefund()}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                    >
                      {processing && <LoadingSpinner size="small" className="mr-2" />}
                      {processing ? 'Processing...' : 'Process Refund'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;