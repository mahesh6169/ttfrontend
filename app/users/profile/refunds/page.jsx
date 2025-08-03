'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOrganizerEvents,
  fetchRefundableTickets,
  setSelectedEvent,
  processRefund,
  toggleTicketSelection,
  setCustomRefundAmount,
  setRefundReason,
  clearSelectedTickets,
  clearRefundForm,
  selectEvents,
  selectSelectedEvent,
  selectTicketsState,
  selectSelectedTickets,
  selectRefundForm,
  selectProcessing,
} from '@/store/slices/events/refundSlice';
import { 
  IoChevronDown,
  IoTicket,
  IoCash,
  IoCheckmarkCircle,
  IoWarningOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';

export default function RefundsPage() {
  const dispatch = useDispatch();
  const events = useSelector(selectEvents);
  const selectedEvent = useSelector(selectSelectedEvent);
  const ticketsState = useSelector(selectTicketsState);
  const selectedTickets = useSelector(selectSelectedTickets);
  const refundForm = useSelector(selectRefundForm);
  const processing = useSelector(selectProcessing);

  const [refundReason, setLocalRefundReason] = useState('');
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [amountWarnings, setAmountWarnings] = useState({});
  const [localAmounts, setLocalAmounts] = useState({});
  const itemsPerPage = 20;

  // Fetch events on mount
  useEffect(() => {
    dispatch(fetchOrganizerEvents());
  }, [dispatch]);

  // Fetch tickets when event is selected
  useEffect(() => {
    if (selectedEvent?._id) {
      dispatch(fetchRefundableTickets({ 
        eventId: selectedEvent._id,
        page: 1,
        limit: 100 // Get all tickets
      }));
    }
  }, [selectedEvent?._id, dispatch]);

  const handleEventSelect = (event) => {
    dispatch(clearSelectedTickets());
    dispatch(clearRefundForm());
    dispatch(setSelectedEvent(event));
    setExpandedInvoices({});
    setLocalAmounts({});
    setAmountWarnings({});
  };

  const toggleInvoiceExpanded = (invoiceNumber) => {
    setExpandedInvoices(prev => ({
      ...prev,
      [invoiceNumber]: !prev[invoiceNumber]
    }));
  };

  const handleTicketSelect = (ticket) => {
    dispatch(toggleTicketSelection(ticket));
    // Clear warning and local amount when deselecting
    if (selectedTickets.some(t => t.ticketNumber === ticket.ticketNumber)) {
      setAmountWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[ticket.ticketNumber];
        return newWarnings;
      });
      setLocalAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[ticket.ticketNumber];
        return newAmounts;
      });
    }
  };

  const handleAmountChange = (ticketNumber, amount, maxAmount) => {
    // Update local state for immediate display
    setLocalAmounts(prev => ({
      ...prev,
      [ticketNumber]: amount
    }));

    // Clear warning if clearing the field
    if (amount === '' || amount === null) {
      dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
      setAmountWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[ticketNumber];
        return newWarnings;
      });
      return;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return; // Don't update if invalid
    }
    
    // Check if amount exceeds max
    if (numAmount > maxAmount) {
      // Set warning
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: `Amount capped at maximum refundable: ${formatCurrency(maxAmount)}`
      }));
      // Cap at max refundable amount
      dispatch(setCustomRefundAmount({ ticketNumber, amount: maxAmount }));
      setLocalAmounts(prev => ({
        ...prev,
        [ticketNumber]: maxAmount.toFixed(2)
      }));
    } else {
      // Clear warning if amount is valid
      setAmountWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[ticketNumber];
        return newWarnings;
      });
      dispatch(setCustomRefundAmount({ ticketNumber, amount: numAmount }));
    }
  };

  const handleReasonChange = (value) => {
    setLocalRefundReason(value);
    dispatch(setRefundReason(value));
  };

  const calculateRefundTotal = () => {
    return selectedTickets.reduce((total, ticket) => {
      const customAmount = refundForm.customAmounts[ticket.ticketNumber];
      if (customAmount !== undefined) {
        return total + customAmount;
      } else {
        // Use the actual ticket refund amount - needs to be fixed in backend
        const maxRefundable = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
        return total + maxRefundable;
      }
    }, 0);
  };

  const handleProcessRefund = async () => {
    if (!refundReason.trim() || selectedTickets.length === 0) {
      return;
    }

    // Build tickets array with individual amounts
    const tickets = selectedTickets.map(ticket => {
      const customAmount = refundForm.customAmounts[ticket.ticketNumber];
      const amount = customAmount !== undefined ? 
        customAmount : 
        (ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0));
      
      return {
        ticketNumber: ticket.ticketNumber,
        amount: amount
      };
    });

    await dispatch(processRefund({
      eventId: selectedEvent._id,
      tickets,
      reason: refundReason.trim()
    })).unwrap();

    // Reset after success
    dispatch(clearSelectedTickets());
    dispatch(clearRefundForm());
    setLocalRefundReason('');
    setLocalAmounts({});
    setAmountWarnings({});
    
    // Re-fetch tickets to get updated refund amounts
    dispatch(fetchRefundableTickets({ 
      eventId: selectedEvent._id,
      page: 1,
      limit: 100
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Group tickets by invoice
  const ticketsByInvoice = ticketsState.list.reduce((groups, ticket) => {
    if (!groups[ticket.invoiceNumber]) {
      groups[ticket.invoiceNumber] = [];
    }
    groups[ticket.invoiceNumber].push(ticket);
    return groups;
  }, {});

  // Filter invoices based on search
  const filteredInvoices = Object.entries(ticketsByInvoice).filter(([invoiceNumber, tickets]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      invoiceNumber.toLowerCase().includes(searchLower) ||
      tickets.some(ticket => 
        ticket.ticketNumber.toLowerCase().includes(searchLower) ||
        ticket.buyer.email.toLowerCase().includes(searchLower) ||
        `${ticket.buyer.firstName} ${ticket.buyer.lastName}`.toLowerCase().includes(searchLower)
      )
    );
  });

  // Paginate invoices
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
            <p className="mt-2 text-gray-600">Process refunds for your paid events</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Event
          </label>
          <select
            value={selectedEvent?._id || ''}
            onChange={(e) => {
              const event = events.list.find(ev => ev._id === e.target.value);
              if (event) handleEventSelect(event);
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an event...</option>
            {events.list.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title} - {event.eventCode}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <>
            {/* Search and Stats Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by invoice, ticket number, or buyer..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-4 text-sm text-gray-600">
                  {filteredInvoices.length} invoices • {ticketsState.list.length} tickets
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <IoInformationCircleOutline className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">How to process refunds</h3>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Click on invoice numbers to expand and see individual tickets</li>
                    <li>• Select the tickets you want to refund</li>
                    <li>• Enter custom amounts or leave blank for full refund</li>
                    <li>• Add a refund reason and click "Process Refund"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Tickets List */}
              <div className="lg:col-span-3 space-y-4">
              {paginatedInvoices.map(([invoiceNumber, tickets]) => {
                const isExpanded = expandedInvoices[invoiceNumber];
                const invoiceTotal = tickets.reduce((sum, t) => sum + t.priceDetails.totalPrice, 0);
                // totalRefundedAmount is stored per ticket
                const invoiceRefunded = tickets.reduce((sum, t) => sum + (t.totalRefundedAmount || 0), 0);
                const hasSelectedTickets = tickets.some(t => 
                  selectedTickets.some(st => st.ticketNumber === t.ticketNumber)
                );
                const allTicketsRefunded = tickets.every(t => {
                  const maxRefundable = t.priceDetails.totalPrice - (t.totalRefundedAmount || 0);
                  return maxRefundable <= 0;
                });

                return (
                  <div key={invoiceNumber} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Invoice Header */}
                    <div 
                      className={`p-4 cursor-pointer ${
                        allTicketsRefunded 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : hasSelectedTickets 
                          ? 'bg-blue-50 hover:bg-blue-100' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => !allTicketsRefunded && toggleInvoiceExpanded(invoiceNumber)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <IoChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          <span className={`font-semibold ${allTicketsRefunded ? 'text-gray-500' : 'text-gray-900'}`}>
                            {invoiceNumber}
                          </span>
                          <span className="text-sm text-gray-500">({tickets.length} tickets)</span>
                          {allTicketsRefunded && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Fully Refunded
                            </span>
                          )}
                          {!allTicketsRefunded && invoiceRefunded > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Partially Refunded
                            </span>
                          )}
                          {hasSelectedTickets && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span>Total: {formatCurrency(invoiceTotal)}</span>
                          {invoiceRefunded > 0 && (
                            <span className="ml-3 text-red-600">
                              Refunded: {formatCurrency(invoiceRefunded)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual Tickets */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                        {tickets.map((ticket) => {
                          const isSelected = selectedTickets.some(t => t.ticketNumber === ticket.ticketNumber);
                          const maxRefundable = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
                          const customAmount = refundForm.customAmounts[ticket.ticketNumber];
                          const isFullyRefunded = maxRefundable <= 0;

                          return (
                            <div 
                              key={ticket.ticketNumber} 
                              className={`bg-white p-4 rounded-lg border ${
                                isFullyRefunded 
                                  ? 'border-red-200 bg-red-50 opacity-75' 
                                  : isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                  {/* Selection Checkbox */}
                                  <button
                                    onClick={() => !isFullyRefunded && handleTicketSelect(ticket)}
                                    disabled={isFullyRefunded}
                                    className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center ${
                                      isFullyRefunded
                                        ? 'bg-red-100 border-red-300 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    {isFullyRefunded ? (
                                      <span className="text-red-600 text-xs">✕</span>
                                    ) : isSelected ? (
                                      <IoCheckmarkCircle className="w-3 h-3" />
                                    ) : null}
                                  </button>

                                  {/* Ticket Info */}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <IoTicket className="h-4 w-4 text-gray-400" />
                                      <span className="font-mono text-sm font-medium">{ticket.ticketNumber}</span>
                                      <span className="text-xs text-gray-500">{ticket.ticketType.name}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {ticket.buyer.firstName} {ticket.buyer.lastName} • {ticket.buyer.email}
                                    </div>
                                    {ticket.seats?.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Seats: {ticket.seats.map(s => `${s.row}${s.seatNumber}`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Price Info */}
                                <div className="text-right">
                                  <div className="text-sm font-medium">{formatCurrency(ticket.priceDetails.totalPrice)}</div>
                                  {ticket.totalRefundedAmount > 0 && (
                                    <div className="text-xs text-red-600">
                                      Refunded: {formatCurrency(ticket.totalRefundedAmount)}
                                    </div>
                                  )}
                                  <div className="text-xs text-green-600">
                                    Available: {formatCurrency(maxRefundable)}
                                  </div>
                                </div>
                              </div>

                              {/* Custom Amount Input (when selected) */}
                              {isSelected && !isFullyRefunded && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Custom refund amount (leave empty for full refund)
                                  </label>
                                  <div className="flex items-center space-x-2">
                                    <div className="relative flex-1">
                                      <IoCash className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                                      <input
                                        type="number"
                                        min="0"
                                        max={maxRefundable}
                                        step="0.01"
                                        value={localAmounts[ticket.ticketNumber] !== undefined ? localAmounts[ticket.ticketNumber] : (customAmount || '')}
                                        onChange={(e) => handleAmountChange(ticket.ticketNumber, e.target.value, maxRefundable)}
                                        onWheel={(e) => e.target.blur()}
                                        onBlur={(e) => {
                                          // Auto-format to 2 decimal places on blur
                                          const value = e.target.value;
                                          if (value && !isNaN(value)) {
                                            const formatted = parseFloat(value).toFixed(2);
                                            setLocalAmounts(prev => ({
                                              ...prev,
                                              [ticket.ticketNumber]: formatted
                                            }));
                                            dispatch(setCustomRefundAmount({ ticketNumber: ticket.ticketNumber, amount: parseFloat(formatted) }));
                                          }
                                        }}
                                        placeholder={maxRefundable.toFixed(2)}
                                        className={`w-full pl-8 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                                          amountWarnings[ticket.ticketNumber] 
                                            ? 'border-amber-400 focus:ring-amber-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      Max: {formatCurrency(maxRefundable)}
                                    </span>
                                  </div>
                                  {amountWarnings[ticket.ticketNumber] && (
                                    <div className="mt-1 text-xs text-amber-600 flex items-center">
                                      <IoWarningOutline className="h-3 w-3 mr-1" />
                                      {amountWarnings[ticket.ticketNumber]}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </div>

              {/* Right Column - Sticky Refund Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Summary</h3>
                    
                    {selectedTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <IoTicket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No tickets selected
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Select tickets from the list to process refunds
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Selected tickets:</span>
                            <span className="font-medium">{selectedTickets.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total refund:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(calculateRefundTotal())}</span>
                          </div>
                        </div>

                        {/* Selected tickets list */}
                        <div className="mb-4 max-h-48 overflow-y-auto">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Selected tickets:</h4>
                          <div className="space-y-1">
                            {selectedTickets.map(ticket => {
                              const customAmount = refundForm.customAmounts[ticket.ticketNumber];
                              const refundAmount = customAmount !== undefined ? customAmount : 
                                (ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0));
                              
                              return (
                                <div key={ticket.ticketNumber} className="text-xs text-gray-600 flex justify-between">
                                  <span className="truncate">{ticket.ticketNumber}</span>
                                  <span className="font-medium">{formatCurrency(refundAmount)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refund reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={refundReason}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            placeholder="Please provide a reason..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                          <div className="flex items-start">
                            <IoWarningOutline className="h-4 w-4 text-yellow-600 mr-2 flex-shrink-0" />
                            <div className="text-xs text-yellow-700">
                              <p className="font-medium">Important:</p>
                              <ul className="mt-1 space-y-0.5">
                                <li>• Cannot be undone</li>
                                <li>• Tickets will be cancelled</li>
                                <li>• Seats will be released</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleProcessRefund}
                          disabled={!refundReason.trim() || processing.loading}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing.loading ? (
                            'Processing...'
                          ) : (
                            `Process Refund (${formatCurrency(calculateRefundTotal())})`
                          )}
                        </button>

                        {processing.error && (
                          <div className="mt-3 text-sm text-red-600">
                            Error: {processing.error}
                          </div>
                        )}

                        {processing.success && (
                          <div className="mt-3 text-sm text-green-600">
                            Refund processed successfully!
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}