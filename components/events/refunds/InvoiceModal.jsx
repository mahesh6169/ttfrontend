'use client';

import { formatInTimeZone } from 'date-fns-tz';

export default function InvoiceModal({ 
  invoiceData, 
  invoiceLoading, 
  invoiceError, 
  onClose 
}) {
  // Helper function to format dates consistently
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return new Date(dateString).toLocaleDateString();
    }
  };

  // Helper function to group line items by ticket type for Purchase Details table
  const groupLineItemsByType = (lineItems) => {
    const grouped = lineItems.reduce((acc, item) => {
      const typeName = item.ticketType.name;
      if (!acc[typeName]) {
        acc[typeName] = {
          name: typeName,
          price: item.ticketType.price,
          quantity: 0,
          amount: 0
        };
      }
      acc[typeName].quantity += item.quantity;
      acc[typeName].amount += (item.ticketType.price * item.quantity);
      return acc;
    }, {});

    return Object.values(grouped);
  };

  // Helper function to group refunds by transaction for Refund Details table
  const groupRefundsByTransaction = (refunds) => {
    const grouped = refunds.reduce((acc, refund) => {
      const refundId = refund.stripeRefundId;
      if (!acc[refundId]) {
        acc[refundId] = {
          stripeRefundId: refundId,
          refundDate: refund.refundDate,
          refundType: refund.refundType,
          reason: refund.reason,
          tickets: [],
          totalAmount: refund.refundAmount
        };
      }
      
      // Handle both individual and group refunds
      if (refund.refundType === 'group' && refund.ticketNumbers) {
        // Group refund: multiple tickets in one refund
        refund.ticketNumbers.forEach(ticketNumber => {
          acc[refundId].tickets.push({
            ticketNumber: ticketNumber,
            amount: refund.refundAmount / refund.ticketNumbers.length // Split amount evenly
          });
        });
      } else if (refund.refundType === 'individual' && refund.ticketNumber) {
        // Individual refund: single ticket
        acc[refundId].tickets.push({
          ticketNumber: refund.ticketNumber,
          amount: refund.refundAmount
        });
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => 
      new Date(b.refundDate) - new Date(a.refundDate)
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Invoice Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8">
          {/* Loading State */}
          {invoiceLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading invoice details...</span>
            </div>
          )}
          
          {/* Error State */}
          {invoiceError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">Error loading invoice: {invoiceError}</p>
            </div>
          )}
          
          {/* Show invoice content only if data is loaded */}
          {invoiceData && !invoiceLoading && (
            <>
              {/* Invoice Header */}
              <div className="border-b pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                    <p className="text-gray-600 mt-1">Invoice #{invoiceData.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-medium">{formatDate(invoiceData.invoiceDate)}</p>
                  </div>
                </div>
              </div>

              {/* Organizer and Buyer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Event Organizer</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.event.organizer?.name || 'Event Organizer'}</p>
                    <p className="text-gray-600">{invoiceData.event.organizer?.email || 'N/A'}</p>
                    {invoiceData.event.organizer?.phone && (
                      <p className="text-gray-600">{invoiceData.event.organizer.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Bill To</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.buyer.firstName} {invoiceData.buyer.lastName}</p>
                    <p className="text-gray-600">{invoiceData.buyer.email}</p>
                    {invoiceData.buyer.phone && (
                      <p className="text-gray-600">{invoiceData.buyer.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Event Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Event Title</p>
                    <p className="text-gray-900">{invoiceData.event.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Event Code</p>
                    <p className="text-gray-900 font-mono">{invoiceData.event.eventCode}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Date & Time</p>
                    <p className="text-gray-900">
                      {(() => {
                        try {
                          const date = formatInTimeZone(invoiceData.event.dateTime, invoiceData.event.timeZone, 'dd/MM/yyyy');
                          const time = formatInTimeZone(invoiceData.event.dateTime, invoiceData.event.timeZone, 'h:mm a');
                          return `${date} at ${time}`;
                        } catch (error) {
                          return new Date(invoiceData.event.dateTime).toLocaleString();
                        }
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Timezone: {invoiceData.event.timeZone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Venue</p>
                    <p className="text-gray-900">{invoiceData.event.venue}</p>
                  </div>
                  {invoiceData.event.address && (
                    <div className="md:col-span-2">
                      <p className="font-medium text-gray-700">Address</p>
                      <p className="text-gray-900">{invoiceData.event.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Details Table */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Purchase Details | {formatDate(invoiceData.payment.paymentDate)}</h4>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ticket Type</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {groupLineItemsByType(invoiceData.lineItems).map((group, index) => (
                        <tr key={group.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm border-t border-gray-100">{group.name}</td>
                          <td className="px-4 py-3 text-sm text-center border-t border-gray-100">{group.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right border-t border-gray-100">${group.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right border-t border-gray-100 font-medium">${group.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      
                      {/* Total Row */}
                      <tr className="bg-gray-50 border-t border-gray-300">
                        <td className="px-4 py-3 text-sm font-medium" colSpan="3"></td>
                        <td className="px-4 py-3 text-sm text-right font-bold">Total Paid: ${invoiceData.amounts.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Policy Notes Below Table */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                    {invoiceData.gstIncluded && (
                      <p>* GST included</p>
                    )}
                    {invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                      <p>* Processing fees are non-refundable</p>
                    )}
                    {invoiceData.refundPolicy?.policyText && (
                      <p>* {invoiceData.refundPolicy.policyText}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Refund Details Table (only if refunds exist) */}
              {invoiceData.refunds && invoiceData.refunds.length > 0 && (
                <div className="mb-8">
                  {(() => {
                    const refundGroups = groupRefundsByTransaction(invoiceData.refunds);
                    return refundGroups.map((refundGroup, groupIndex) => (
                      <div key={refundGroup.stripeRefundId} className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Refund Details | {formatDate(refundGroup.refundDate)}</h4>
                        
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-red-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ticket Type</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Refund Amount</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {(() => {
                                // Group refunded tickets by type for this refund transaction
                                const refundTicketsByType = refundGroup.tickets.reduce((acc, ticket) => {
                                  // Find the original line item to get ticket type info
                                  const originalItem = invoiceData.lineItems.find(item => 
                                    item.ticketNumber === ticket.ticketNumber
                                  );
                                  
                                  if (originalItem) {
                                    const typeName = originalItem.ticketType.name;
                                    if (!acc[typeName]) {
                                      acc[typeName] = {
                                        name: typeName,
                                        price: originalItem.ticketType.price,
                                        quantity: 0,
                                        refundAmount: 0
                                      };
                                    }
                                    acc[typeName].quantity += 1;
                                    acc[typeName].refundAmount += ticket.amount;
                                  }
                                  
                                  return acc;
                                }, {});

                                return Object.values(refundTicketsByType).map((group, index) => (
                                  <tr key={group.name} className={index % 2 === 0 ? 'bg-white' : 'bg-red-25'}>
                                    <td className="px-4 py-3 text-sm border-t border-gray-100">{group.name}</td>
                                    <td className="px-4 py-3 text-sm text-center border-t border-gray-100">{group.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-right border-t border-gray-100">${group.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-right border-t border-gray-100 font-medium text-red-600">${group.refundAmount.toFixed(2)}</td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                          
                          {/* Refund Reason and Policy Notes */}
                          <div className="px-4 py-3 bg-red-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                            <p>Refund Reason: {refundGroup.reason || 'Customer request'}</p>
                            {invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                              <p>* Processing fees are non-refundable</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button 
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  📄 Download PDF
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  📧 Email Invoice
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}