'use client';

import { useDispatch, useSelector } from 'react-redux';
import { 
  setShowRefundModal,
  clearSelectedTickets,
  selectSelectedTickets,
  selectRefundForm,
  selectTotalRefundAmount,
  selectAnalytics,
  selectInvoiceEligibility
} from '@/store/slices/events/refundSlice';
import { 
  IoTicket,
  IoReceiptOutline,
  IoStatsChartOutline
} from 'react-icons/io5';

export default function RefundSummary({ activeTab, eventId }) {
  const dispatch = useDispatch();
  const selectedTickets = useSelector(selectSelectedTickets);
  const refundForm = useSelector(selectRefundForm);
  const totalIndividualRefund = useSelector(selectTotalRefundAmount);
  const analytics = useSelector(selectAnalytics);
  const invoiceEligibility = useSelector(selectInvoiceEligibility);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const getSelectedCount = () => {
    return activeTab === 'individual' 
      ? selectedTickets.individual.length
      : Object.keys(selectedTickets.grouped).length;
  };

  const getTotalRefundAmount = () => {
  if (activeTab === 'individual') {
    return totalIndividualRefund;
  } else {
    return Object.entries(selectedTickets.grouped).reduce((total, [invoiceNumber, tickets]) => {
      const customAmount = refundForm.groupCustomAmounts[invoiceNumber]; // ADD THIS LINE
      const originalAmount = tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0);
      return total + (customAmount !== undefined ? customAmount : originalAmount); // MODIFY THIS LINE
    }, 0);
  }
};

  const getSelectedItemsDetails = () => {
    if (activeTab === 'individual') {
      return selectedTickets.individual.map(ticket => ({
        id: ticket.ticketNumber,
        label: ticket.ticketNumber,
        amount: refundForm.customAmounts[ticket.ticketNumber] || ticket.priceDetails.totalPrice,
        originalAmount: ticket.priceDetails.totalPrice,
        type: 'partial'
      }));
    } else {
  return Object.entries(selectedTickets.grouped).map(([invoiceNumber, tickets]) => {
    const customAmount = refundForm.groupCustomAmounts[invoiceNumber];
    const originalAmount = tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0);
    
    return {
      id: invoiceNumber,
      label: `${invoiceNumber} (${tickets.length} tickets)`,
      amount: customAmount !== undefined ? customAmount : originalAmount,
      originalAmount: originalAmount,
      type: 'full',
      ticketCount: tickets.length
    };
  });
}
  };

 


  const handleProcessRefund = () => {
    dispatch(setShowRefundModal(true));
  };

  const handleClearSelection = () => {
    dispatch(clearSelectedTickets());
  };

  const selectedCount = getSelectedCount();
  const totalAmount = getTotalRefundAmount();
  const selectedItems = getSelectedItemsDetails();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Refund Summary
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {activeTab === 'individual' ? 'Individual tickets' : 'Invoice groups'} selected for refund
        </p>
      </div>

{/* Content */}
<div className="p-6">
  {selectedCount > 0 ? (
    <>
      {/* Selected Items List */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Items</h4>
        <div className="space-y-2">
          {selectedItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <span className="text-sm text-gray-900">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="border-t border-gray-200 mt-4 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Total:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleProcessRefund}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Process Refund
      </button>
    </>
  ) : (
    /* Empty State */
    <div className="text-center py-8">
      <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
        {activeTab === 'individual' ? (
          <IoTicket className="h-full w-full" />
        ) : (
          <IoReceiptOutline className="h-full w-full" />
        )}
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-2">
        No {activeTab === 'individual' ? 'tickets' : 'invoices'} selected
      </h4>
      <p className="text-sm text-gray-600">
        Select {activeTab === 'individual' ? 'individual tickets' : 'invoice groups'} from the list to process refunds.
      </p>
    </div>
  )}
</div>

      {/* Analytics Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Refund Mode</span>
            <span className="font-medium capitalize text-gray-900">
              {activeTab} Refunds
            </span>
          </div>
          {analytics.totalRefundsProcessed > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <IoStatsChartOutline className="h-3 w-3 mr-1" />
              {analytics.totalRefundsProcessed} processed • {formatCurrency(analytics.totalAmountRefunded)} total
            </div>
          )}
        </div>
      </div>
    </div>
  );
}