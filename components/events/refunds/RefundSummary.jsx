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
  IoCash,
  IoTicket,
  IoReceiptOutline,
  IoWarningOutline,
  IoTrashOutline,
  IoShieldCheckmarkOutline,
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
      return Object.entries(selectedTickets.grouped).map(([invoiceNumber, tickets]) => ({
        id: invoiceNumber,
        label: `${invoiceNumber} (${tickets.length} tickets)`,
        amount: tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0),
        originalAmount: tickets.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0),
        type: 'full',
        ticketCount: tickets.length
      }));
    }
  };

  const hasCustomAmounts = () => {
    return activeTab === 'individual' && Object.keys(refundForm.customAmounts).length > 0;
  };

  const getRefundTypeExplanation = () => {
    if (activeTab === 'individual') {
      return {
        title: 'Individual (Partial) Refunds',
        description: 'Each ticket creates a partial refund against the original payment transaction',
        icon: <IoTicket className="h-5 w-5 text-blue-600" />,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      };
    } else {
      return {
        title: 'Group (Full Transaction) Refunds',
        description: 'One complete refund for the entire original payment transaction',
        icon: <IoCash className="h-5 w-5 text-purple-600" />,
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-800'
      };
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
  const refundTypeInfo = getRefundTypeExplanation();

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
        {/* Refund Type Explanation */}
        <div className={`${refundTypeInfo.bgColor} ${refundTypeInfo.borderColor} border rounded-lg p-4 mb-6`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {refundTypeInfo.icon}
            </div>
            <div>
              <h4 className={`text-sm font-medium ${refundTypeInfo.textColor}`}>
                {refundTypeInfo.title}
              </h4>
              <p className={`text-sm ${refundTypeInfo.textColor} mt-1`}>
                {refundTypeInfo.description}
              </p>
            </div>
          </div>
        </div>

        {selectedCount > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {activeTab === 'individual' ? (
                      <IoTicket className="h-5 w-5 text-blue-600 mr-2" />
                    ) : (
                      <IoReceiptOutline className="h-5 w-5 text-blue-600 mr-2" />
                    )}
                    <span className="text-sm font-medium text-blue-900">
                      {selectedCount} {activeTab === 'individual' ? 'Ticket' : 'Invoice Group'}{selectedCount !== 1 ? 's' : ''} Selected
                    </span>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="Clear selection"
                  >
                    <IoTrashOutline className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalAmount)}
                </div>
                <p className="text-sm text-blue-700">
                  Total refund amount ({activeTab === 'individual' ? 'partial' : 'full'} transaction{selectedCount !== 1 ? 's' : ''})
                </p>
              </div>

              {/* Custom amounts notice */}
              {hasCustomAmounts() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <IoWarningOutline className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Custom amounts set</p>
                      <p className="text-sm text-yellow-700">
                        Some tickets have custom refund amounts that differ from the original price.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Items List */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Selected Items</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.label}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.type === 'full' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.type === 'full' ? 'Full Transaction' : 'Partial Transaction'}
                          </span>
                        </div>
                        {item.amount !== item.originalAmount && (
                          <p className="text-xs text-yellow-600">
                            Custom amount: {formatCurrency(item.amount)} 
                            <span className="text-gray-500">
                              {' '}(was {formatCurrency(item.originalAmount)})
                            </span>
                          </p>
                        )}
                        {item.ticketCount && (
                          <p className="text-xs text-gray-500">
                            {item.ticketCount} tickets in this transaction
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProcessRefund}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Process {activeTab === 'individual' ? 'Partial' : 'Full'} Refund{selectedCount !== 1 ? 's' : ''}
              <span className="block text-sm font-normal opacity-90">
                {formatCurrency(totalAmount)} total • {activeTab === 'individual' ? 'Multiple' : 'Single'} Stripe transaction{selectedCount !== 1 && activeTab === 'individual' ? 's' : ''}
              </span>
            </button>

            {/* Enhanced Refund Warning */}
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <IoWarningOutline className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Refund Warning</p>
                  <div className="text-sm text-red-700 mt-1">
                    <p>• This action cannot be undone</p>
                    <p>• Refunded tickets will be permanently cancelled</p>
                    <p>• Seats will be released and made available for sale</p>
                    {activeTab === 'individual' && (
                      <p>• Each ticket creates a separate partial refund against the payment</p>
                    )}
                    {activeTab === 'group' && (
                      <p>• Full transaction refund - all tickets in invoice refunded together</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
            
            {/* Refund Type Helper */}
            <div className="mt-4 text-xs text-gray-500">
              <p className="font-medium">
                {activeTab === 'individual' ? 'Individual Mode:' : 'Group Mode:'}
              </p>
              <p>
                {activeTab === 'individual' 
                  ? 'Creates partial refunds against payment transactions'
                  : 'Creates full refunds for complete invoice transactions'
                }
              </p>
            </div>
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