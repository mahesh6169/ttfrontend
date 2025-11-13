'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';
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
import RefundInvoiceCard from '@/components/events/refunds/RefundInvoiceCard';
import Pagination from '@/components/Pagination';

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
  const [dateFilter, setDateFilter] = useState('3months'); // Add date filter state
  const [instructionsOpen, setInstructionsOpen] = useState(false); // Add state for collapsible instructions
  const itemsPerPage = 10; // Reduced for less scrolling

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

    try {
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
    } catch (error) {
      // Error is already shown in the UI via processing.error
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
    }
  };

  // Apply date filtering
  const getFilteredEvents = () => {
    if (!events.list || events.list.length === 0) return [];
    
    let filtered = [...events.list];
    
    switch (dateFilter) {
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = events.list.filter(event => event.dateTime && new Date(event.dateTime) >= threeMonthsAgo);
        break;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = events.list.filter(event => event.dateTime && new Date(event.dateTime) >= sixMonthsAgo);
        break;
      case '1year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = events.list.filter(event => event.dateTime && new Date(event.dateTime) >= oneYearAgo);
        break;
      case 'all':
      default:
        // Show all events
        break;
    }
    
    // Sort by date (most recent first)
    return filtered.sort((a, b) => {
      if (!a.dateTime) return 1;
      if (!b.dateTime) return -1;
      return new Date(b.dateTime) - new Date(a.dateTime);
    });
  };

  const filteredEvents = getFilteredEvents();

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
        `${ticket.buyer.firstName} ${ticket.buyer.lastName}`.toLowerCase().includes(searchLower) ||
        ticket.ticketType.name.toLowerCase().includes(searchLower)
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
    <>
      <div className="space-y-2 sm:space-y-3">
        {/* Page Header - Compact */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Refund Management</h2>
        </div>
        {/* Event Selector - Reduced padding */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          {events.loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : events.error ? (
            <div className="text-red-600 text-sm">
              Error loading events: {events.error}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Combined Date Filter and Event Selector on Mobile */}
              <div className="flex flex-col sm:flex-row sm:gap-4">
              {/* Date Filter - Compact on mobile */}
              <div className="sm:w-1/3">
                <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-600 mb-1">
                  Date Range
                </label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="3months">Last 3 months</option>
                  <option value="6months">Last 6 months</option>
                  <option value="1year">Last year</option>
                  <option value="all">Show all</option>
                </select>
              </div>

              {/* Event Selector - Optimized for mobile */}
              <div className="flex-1 mt-3 sm:mt-0">
                <label htmlFor="eventSelect" className="block text-xs font-medium text-gray-600 mb-1">
                  Select Paid Event
                </label>
                <select
                  id="eventSelect"
                  value={selectedEvent?._id || ''}
                  onChange={(e) => {
                    const eventId = e.target.value;
                    if (eventId) {
                      const event = events.list.find(ev => ev._id === eventId);
                      if (event) handleEventSelect(event);
                    } else {
                      dispatch(setSelectedEvent(null));
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white truncate"
                >
                  <option value="">Choose a paid event</option>
                  
                  {filteredEvents.length === 0 ? (
                    <option disabled>No paid events found</option>
                  ) : (
                    filteredEvents.map((event) => {
                      const eventDateTime = event.dateTime ? formatEventDateTime(event.dateTime, event.timeZone) : { date: 'No date' };
                      // Always use concise format that works on all screens
                      return (
                        <option key={event._id} value={event._id}>
                          {event.title} • {eventDateTime.date} {event.isDeleted ? '(Deleted)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>

                {filteredEvents.length === 0 && events.list.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No events in selected range. Try a different date filter.
                  </p>
                )}
              </div>
            </div>

            {/* Data Retention Warning - More compact */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Events older than 2 years will be deleted.
              </p>
            </div>
          </div>
          )}
        </div>

        {/* Selected Event Details - Compact */}
        {selectedEvent && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Event Title */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {selectedEvent.title}
              </h3>
              
              {/* Event Code */}
              <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                {selectedEvent.eventCode}
              </span>
              
              {/* Deleted Badge if applicable */}
              {selectedEvent.isDeleted && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Deleted
                </span>
              )}
              
              {/* Date & Time */}
              {selectedEvent.dateTime && (
                <div className="flex items-center gap-1 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone).combined} ({selectedEvent.timeZone})</span>
                </div>
              )}
              
              {/* Venue */}
              {selectedEvent.venue && (
                <div className="flex items-center gap-1 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedEvent.venue}</span>
                </div>
              )}
              
              {/* Capacity if available */}
              {selectedEvent.capacity > 0 && (
                <div className="text-gray-600">
                  <span>Capacity: {selectedEvent.capacity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics - Compact spacing */}
        {selectedEvent && ticketsState.list.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
            <div className="flex items-center justify-around sm:justify-start sm:space-x-6 lg:space-x-8">
              {/* Total Invoices */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-blue-600">{Object.keys(ticketsByInvoice).length}</span>
                  <span className="hidden sm:inline text-gray-600 ml-1">Total Invoices</span>
                  <span className="sm:hidden text-gray-600 block text-xs">Invoices</span>
                </div>
              </div>
              
              {/* Total Tickets */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-green-600">{ticketsState.list.length}</span>
                  <span className="hidden sm:inline text-gray-600 ml-1">Total Tickets</span>
                  <span className="sm:hidden text-gray-600 block text-xs">Tickets</span>
                </div>
              </div>

              {/* Refunded Tickets */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-red-600">
                    {ticketsState.list.filter(t => t.totalRefundedAmount > 0).length}
                  </span>
                  <span className="hidden sm:inline text-gray-600 ml-1">Refunded Tickets</span>
                  <span className="sm:hidden text-gray-600 block text-xs">Refunded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEvent && (
          <>

            {/* Search Bar - Match CheckIn Page */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 border-b bg-gray-50">
                <div className="relative">
                  {/* Search Icon */}
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                      />
                    </svg>
                  </div>
                  
                  {/* Search Input */}
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Invoice #, Ticket #, Name, Email"
                    className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  
                  {/* Clear Button */}
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                      type="button"
                    >
                      <svg 
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M6 18L18 6M6 6l12 12" 
                        />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Field hints */}
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-medium">Examples:</span> INV-KYJDS-001, TKT-KYJDS-0001, John Smith, john@example.com
                </div>
              </div>
            </div>

            {/* Instructions - Collapsible on Mobile */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setInstructionsOpen(!instructionsOpen)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-blue-100 border-b border-blue-200 flex items-center justify-between text-left hover:bg-blue-150 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <IoInformationCircleOutline className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-900">How to process refunds</h3>
                </div>
                <svg 
                  className={`h-4 w-4 text-blue-600 transition-transform sm:hidden ${
                    instructionsOpen ? 'rotate-180' : ''
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 9l-7 7-7-7" 
                  />
                </svg>
              </button>
              
              {/* Instructions Content - Always visible on desktop, collapsible on mobile */}
              <div className={`${
                instructionsOpen ? 'block' : 'hidden sm:block'
              } p-3 sm:p-4`}>
                <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-900">1.</span>
                    <span>Click invoice to view tickets</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-900">2.</span>
                    <span>Select tickets to refund</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-900">3.</span>
                    <span>Enter amount (or leave blank for full refund)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-blue-900">4.</span>
                    <span>Add reason & process refund</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Refund Summary - Show after instructions on mobile only */}
            <div className="lg:hidden">
              {selectedTickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Refund Summary</h3>
                  
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Selected tickets:</span>
                      <span className="font-medium">{selectedTickets.length}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total refund:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(calculateRefundTotal())}</span>
                    </div>
                  </div>

                  {/* Selected tickets list */}
                  <div className="mb-3 max-h-40 overflow-y-auto">
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

                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Refund reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => handleReasonChange(e.target.value)}
                      placeholder="Please provide a reason..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2.5 mb-3">
                    <div className="flex items-start">
                      <IoWarningOutline className="h-3.5 w-3.5 text-yellow-600 mr-1.5 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-yellow-700">
                        <p className="font-medium text-xs">Important:</p>
                        <ul className="mt-0.5 space-y-0.5">
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
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing.loading ? (
                      'Processing...'
                    ) : (
                      `Process Refund (${formatCurrency(calculateRefundTotal())})`
                    )}
                  </button>

                  {processing.error && (
                    <div className="mt-2 text-xs sm:text-sm text-red-600">
                      Error: {processing.error}
                    </div>
                  )}

                  {processing.success && (
                    <div className="mt-2 text-xs sm:text-sm text-green-600">
                      Refund processed successfully!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Tickets List */}
              <div className="lg:col-span-3 space-y-2 sm:space-y-3">
              {ticketsState.list.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <IoTicket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Yet</h3>
                  <p className="text-sm text-gray-500">
                    No tickets have been purchased for this event yet.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tickets will appear here once customers make purchases.
                  </p>
                </div>
              ) : paginatedInvoices.map(([invoiceNumber, tickets]) => (
                <RefundInvoiceCard
                  key={invoiceNumber}
                  invoiceNumber={invoiceNumber}
                  tickets={tickets}
                  isExpanded={expandedInvoices[invoiceNumber] || false}
                  onToggleExpand={toggleInvoiceExpanded}
                  selectedTickets={selectedTickets}
                  onTicketSelect={handleTicketSelect}
                  onAmountChange={handleAmountChange}
                  localAmounts={localAmounts}
                  amountWarnings={amountWarnings}
                  formatCurrency={formatCurrency}
                />
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="text-sm text-gray-600 text-center mb-2">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
                  </div>
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
              </div>

              {/* Right Column - Sticky Refund Summary - Desktop Only */}
              <div className="hidden lg:block lg:col-span-1">
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
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}