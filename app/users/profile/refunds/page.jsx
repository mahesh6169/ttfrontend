'use client';

import { useEffect, useState, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'react-toastify';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
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
  clearProcessingState,
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

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];

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
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false); // Mobile review sheet (below lg)
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

  // Mobile review sheet: lock body scroll + close on Esc while open.
  useEffect(() => {
    if (!mobileSummaryOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMobileSummaryOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileSummaryOpen]);

  // Auto-close the sheet when there's nothing selected (after process / deselect-all).
  useEffect(() => {
    if (selectedTickets.length === 0) setMobileSummaryOpen(false);
  }, [selectedTickets.length]);

  const handleEventSelect = (event) => {
    dispatch(clearSelectedTickets());
    dispatch(clearRefundForm());
    dispatch(setSelectedEvent(event));
    setExpandedInvoices({});
    setLocalAmounts({});
    setAmountWarnings({});
  };

  const toggleInvoiceExpanded = (invoiceNumber) => {
    // Accordion: opening one invoice collapses the others. Clicking the open
    // one closes it. Ticket selections live in the Refund Summary, so collapsing
    // a card never loses a selection.
    setExpandedInvoices(prev => (
      prev[invoiceNumber] ? {} : { [invoiceNumber]: true }
    ));
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
    // Special case: onInput detected invalid input (letters, e, E, etc.)
    if (amount === 'INVALID') {
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: '⚠️ Please enter a valid number'
      }));
      dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
      return;
    }
    
    // Check previous value BEFORE updating
    const hadPreviousValue = localAmounts[ticketNumber] && localAmounts[ticketNumber] !== '';
    
    // Update local state for immediate display
    setLocalAmounts(prev => ({
      ...prev,
      [ticketNumber]: amount
    }));

    // If empty, check if field had focus (intentional clear) or invalid input
    if (amount === '' || amount === null || amount === undefined) {
      // If there was previously a value, user typed invalid input that browser blocked
      if (hadPreviousValue) {
        setAmountWarnings(prev => ({
          ...prev,
          [ticketNumber]: '⚠️ Please enter a valid number'
        }));
        dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
        return;
      } else {
        // Otherwise, allow empty (will use max refundable)
        dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
        setAmountWarnings(prev => {
          const newWarnings = { ...prev };
          delete newWarnings[ticketNumber];
          return newWarnings;
        });
        return;
      }
    }
    
    const numAmount = parseFloat(amount);
    
    // Block invalid input (NaN from letters/special chars)
    if (isNaN(numAmount)) {
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: '⚠️ Please enter a valid number'
      }));
      // Clear from Redux so it doesn't get used
      dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
      return;
    }
    
    if (numAmount <= 0) {
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: '⚠️ Amount must be greater than $0'
      }));
      // Clear from Redux so it doesn't get used
      dispatch(setCustomRefundAmount({ ticketNumber, amount: null }));
      return;
    }
    
    // Check for more than 2 decimal places - auto-round and save
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      const roundedAmount = Math.round(numAmount * 100) / 100;
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: `⚠️ Rounded to ${formatCurrency(roundedAmount)}`
      }));
      dispatch(setCustomRefundAmount({ ticketNumber, amount: roundedAmount }));
      setLocalAmounts(prev => ({
        ...prev,
        [ticketNumber]: roundedAmount.toFixed(2)
      }));
      return;
    }
    
    // Check if amount exceeds max
    if (numAmount > maxAmount) {
      setAmountWarnings(prev => ({
        ...prev,
        [ticketNumber]: `⚠️ Maximum refundable: ${formatCurrency(maxAmount)}`
      }));
      dispatch(setCustomRefundAmount({ ticketNumber, amount: maxAmount }));
      setLocalAmounts(prev => ({
        ...prev,
        [ticketNumber]: maxAmount.toFixed(2)
      }));
    } else {
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
      // Check if there's a warning for this ticket (invalid amount)
      if (amountWarnings[ticket.ticketNumber]) {
        return total + 0; // Don't count tickets with invalid amounts
      }
      
      const customAmount = refundForm.customAmounts[ticket.ticketNumber];
      if (customAmount !== undefined && customAmount > 0) {
        return total + customAmount;
      } else {
        // Use the actual ticket refund amount
        const maxRefundable = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
        return total + maxRefundable;
      }
    }, 0);
  };

  const validateRefundAmounts = () => {
    if (selectedTickets.length === 0) {
      return { valid: false, hasWarnings: false };
    }

    // Check if any warnings exist
    const hasWarnings = Object.keys(amountWarnings).length > 0;
    if (hasWarnings) {
      return { valid: false, hasWarnings: true };
    }

    // Check if any selected ticket has invalid amount
    for (const ticket of selectedTickets) {
      const customAmount = refundForm.customAmounts[ticket.ticketNumber];
      const amount = customAmount !== undefined ? 
        customAmount : 
        (ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0));
      
      if (amount <= 0) {
        return { valid: false, hasWarnings: false };
      }
    }

    return { valid: true, hasWarnings: false };
  };

  const handleProcessRefund = async () => {
    if (!refundReason.trim() || selectedTickets.length === 0) {
      toast.warning('Please select at least one ticket and provide a reason');
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

      const result = await dispatch(processRefund({
        eventId: selectedEvent._id,
        tickets,
        reason: refundReason.trim()
      })).unwrap();

      // Show success toast
      toast.success(
        `✅ Refund processed successfully! ${formatCurrency(result.refund?.refundAmount || result.totalAmount)} refunded${result.refund?.seatsReleased > 0 ? ` • ${result.refund.seatsReleased} seat${result.refund.seatsReleased > 1 ? 's' : ''} released` : ''}`,
        {
          autoClose: 5000,
          position: 'top-right'
        }
      );

      // Reset after success
      dispatch(clearSelectedTickets());
      dispatch(clearRefundForm());
      setLocalRefundReason('');
      setLocalAmounts({});
      setAmountWarnings({});
      
      // Clear processing state after 3 seconds
      setTimeout(() => {
        dispatch(clearProcessingState());
      }, 3000);
      
      // Re-fetch tickets to get updated refund amounts
      dispatch(fetchRefundableTickets({ 
        eventId: selectedEvent._id,
        page: 1,
        limit: 100
      }));
    } catch (error) {
      // Show error toast
      toast.error(
        `❌ Refund failed: ${error || 'Unknown error occurred'}`,
        {
          autoClose: 7000,
          position: 'top-right'
        }
      );
      
      // Clear processing state after 5 seconds
      setTimeout(() => {
        dispatch(clearProcessingState());
      }, 5000);
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
      <div className={`space-y-2 sm:space-y-3 ${selectedTickets.length > 0 ? 'pb-28 lg:pb-0' : ''}`}>
        <ProfilePageHeading title="Refund Management" />
        {/* Event Selector - floating panel (shiny white, no border) */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
          {events.loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
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
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date Range
                </label>
                <Listbox value={dateFilter} onChange={setDateFilter}>
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                      <span className="block truncate text-slate-900">
                        {DATE_FILTER_OPTIONS.find((o) => o.value === dateFilter)?.label}
                      </span>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </ListboxButton>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                      >
                        {DATE_FILTER_OPTIONS.map((option) => (
                          <ListboxOption
                            key={option.value}
                            value={option.value}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  {option.label}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              {/* Event Selector - Optimized for mobile */}
              <div className="flex-1 mt-3 sm:mt-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Select Paid Event
                </label>
                <Listbox
                  value={selectedEvent?._id || ''}
                  onChange={(eventId) => {
                    if (eventId) {
                      const event = events.list.find(ev => ev._id === eventId);
                      if (event) handleEventSelect(event);
                    } else {
                      dispatch(setSelectedEvent(null));
                    }
                  }}
                >
                  <div className="relative">
                    <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                      <span className={`block truncate ${selectedEvent ? 'text-slate-900' : 'text-slate-500'}`}>
                        {selectedEvent ? selectedEvent.title : 'Choose a paid event'}
                      </span>
                      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </ListboxButton>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions
                        anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                        className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                      >
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                Choose a paid event
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                        {filteredEvents.length === 0 ? (
                          <div className="px-4 py-2.5 text-sm text-slate-400">
                            No paid events found
                          </div>
                        ) : (
                          filteredEvents.map((event) => {
                            const eventDateTime = event.dateTime ? formatEventDateTime(event.dateTime, event.timeZone) : { date: 'No date' };
                            return (
                              <ListboxOption
                                key={event._id}
                                value={event._id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                      {event.title} • {eventDateTime.date} {event.isDeleted ? '(Deleted)' : ''}
                                    </span>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </span>
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            );
                          })
                        )}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>

                {filteredEvents.length === 0 && events.list.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    No events in selected range. Try a different date filter.
                  </p>
                )}
              </div>
            </div>

            {/* Data Retention note - calm slate, no background */}
            <p className="text-xs text-slate-500">
              <strong className="font-semibold text-slate-600">Note:</strong> Events older than 2 years will be deleted.
            </p>
          </div>
          )}
        </div>

        {/* Selected Event Details - Compact */}
        {selectedEvent && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {/* Event Title */}
              <h3 className="text-base sm:text-lg font-bold text-teal-700">
                {selectedEvent.title}
              </h3>

              {/* Event Code */}
              <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                {selectedEvent.eventCode}
              </span>

              {/* Deleted Badge if applicable */}
              {selectedEvent.isDeleted && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  Deleted
                </span>
              )}

              {/* Date & Time */}
              {selectedEvent.dateTime && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone).combined} ({selectedEvent.timeZone})</span>
                </div>
              )}

              {/* Venue */}
              {selectedEvent.venue && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedEvent.venue}</span>
                </div>
              )}

              {/* Capacity if available */}
              {selectedEvent.capacity > 0 && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span>Capacity: {selectedEvent.capacity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics - Compact spacing */}
        {selectedEvent && ticketsState.list.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 sm:p-4">
            <div className="flex items-center justify-around sm:justify-start sm:space-x-6 lg:space-x-8">
              {/* Total Invoices */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-teal-700">{Object.keys(ticketsByInvoice).length}</span>
                  <span className="hidden sm:inline text-slate-500 ml-1">Total Invoices</span>
                  <span className="sm:hidden text-slate-500 block text-xs">Invoices</span>
                </div>
              </div>

              {/* Total Tickets */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-teal-700">{ticketsState.list.length}</span>
                  <span className="hidden sm:inline text-slate-500 ml-1">Total Tickets</span>
                  <span className="sm:hidden text-slate-500 block text-xs">Tickets</span>
                </div>
              </div>

              {/* Refunded Tickets — number/icon kept red (semantic) pending decision */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <div className="text-xs sm:text-base">
                  <span className="font-bold text-red-600">
                    {ticketsState.list.filter(t => t.totalRefundedAmount > 0).length}
                  </span>
                  <span className="hidden sm:inline text-slate-500 ml-1">Refunded Tickets</span>
                  <span className="sm:hidden text-slate-500 block text-xs">Refunded</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEvent && (
          <>

            {/* Search Bar - floating panel (shiny white, no border) */}
            <div className="bg-white rounded-xl shadow-md p-3">
              <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400"
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
                  className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
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
                      className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 hover:text-slate-600"
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
              <div className="mt-1 text-xs text-slate-500">
                <span className="font-medium">Examples:</span> INV-KYJDS-001, TKT-KYJDS-0001, John Smith, john@example.com
              </div>
            </div>

            {/* Instructions - Collapsible on Mobile */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setInstructionsOpen(!instructionsOpen)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <IoInformationCircleOutline className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700">How to process refunds</h3>
                </div>
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform sm:hidden ${
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
                <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-700">1.</span>
                    <span>Click invoice to view tickets</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-700">2.</span>
                    <span>Select tickets to refund</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-700">3.</span>
                    <span>Enter amount (or leave blank for full refund)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-slate-700">4.</span>
                    <span>Add reason & process refund</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Refund Summary — pinned action bar + expandable bottom sheet (below lg).
                Pinned at bottom-14 above the bottom nav on phones; bottom-0 on tablet (no nav). */}
            {selectedTickets.length > 0 && (
              <>
                {/* Pinned compact bar — floating card, inset from edges, just above the nav */}
                <div className="lg:hidden fixed bottom-16 md:bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
                  <div className="pointer-events-auto mx-auto max-w-xs bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''} selected
                      </div>
                      <div className="text-sm font-semibold text-teal-600">
                        {formatCurrency(calculateRefundTotal())}
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileSummaryOpen(true)}
                      className="shrink-0 flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Review
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expandable bottom sheet */}
                {mobileSummaryOpen && (
                  <div className="lg:hidden fixed inset-0 z-[55]" role="dialog" aria-modal="true">
                    {/* Dim backdrop */}
                    <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSummaryOpen(false)} />
                    {/* Sheet — centered & narrower, floating above the nav */}
                    <div className="absolute left-0 right-0 bottom-16 md:bottom-4 px-4 flex justify-center">
                      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl max-h-[75dvh] flex flex-col overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-200 shrink-0">
                        <h3 className="text-base font-semibold text-slate-800">Refund Summary</h3>
                        <button
                          onClick={() => setMobileSummaryOpen(false)}
                          aria-label="Close"
                          className="text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Scrollable body */}
                      <div className="overflow-y-auto px-4 py-3 flex-1">
                        <div className="space-y-1.5 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Selected tickets:</span>
                            <span className="font-medium">{selectedTickets.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total refund:</span>
                            <span className="font-medium text-teal-600">{formatCurrency(calculateRefundTotal())}</span>
                          </div>
                        </div>

                        {/* Selected tickets list */}
                        <div className="mb-3 max-h-40 overflow-y-auto">
                          <h4 className="text-xs font-medium text-slate-700 mb-2">Selected tickets:</h4>
                          <div className="space-y-1">
                            {selectedTickets.map(ticket => {
                              const hasWarning = amountWarnings[ticket.ticketNumber];
                              const customAmount = refundForm.customAmounts[ticket.ticketNumber];
                              let refundAmount;
                              if (hasWarning) {
                                refundAmount = 0;
                              } else if (customAmount !== undefined && customAmount > 0) {
                                refundAmount = customAmount;
                              } else {
                                refundAmount = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
                              }
                              return (
                                <div key={ticket.ticketNumber} className="text-xs text-slate-600 flex justify-between">
                                  <span className="truncate">{ticket.ticketNumber}</span>
                                  <span className={`font-medium ${hasWarning ? 'text-red-600' : ''}`}>
                                    {formatCurrency(refundAmount)}
                                    {hasWarning && ' ⚠️'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Refund reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={refundReason}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            placeholder="Please provide a reason..."
                            rows={3}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
                          <div className="flex items-start">
                            <IoWarningOutline className="h-3.5 w-3.5 text-amber-600 mr-1.5 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-slate-600">
                              <p className="font-medium text-xs text-amber-800">Important:</p>
                              <ul className="mt-0.5 space-y-0.5">
                                <li>• Cannot be undone</li>
                                <li>• Tickets will be cancelled</li>
                                <li>• Seats will be released</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer — Process button pinned in the sheet */}
                      <div className="px-4 py-3 border-t border-slate-200 shrink-0">
                        <button
                          onClick={handleProcessRefund}
                          disabled={!refundReason.trim() || processing.loading || !validateRefundAmounts().valid}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing.loading ? (
                            'Processing...'
                          ) : (
                            `Process Refund (${formatCurrency(calculateRefundTotal())})`
                          )}
                        </button>
                      </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Tickets List */}
              <div className="lg:col-span-2 space-y-2 sm:space-y-3">
              {ticketsState.list.length === 0 ? (
                <EmptyState
                  title="No tickets to refund"
                  description="You don't have any refundable tickets yet."
                />
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
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                  <div className="text-sm text-slate-600 text-center mb-2">
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
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Refund Summary</h3>
                    
                    {selectedTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <IoTicket className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">
                          No tickets selected
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Select tickets from the list to process refunds
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Selected tickets:</span>
                            <span className="font-medium">{selectedTickets.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Total refund:</span>
                            <span className="font-medium text-teal-600">{formatCurrency(calculateRefundTotal())}</span>
                          </div>
                        </div>

                        {/* Selected tickets list */}
                        <div className="mb-4 max-h-48 overflow-y-auto">
                          <h4 className="text-xs font-medium text-slate-700 mb-2">Selected tickets:</h4>
                          <div className="space-y-1">
                            {selectedTickets.map(ticket => {
                              // Check if there's a warning for this ticket (invalid amount)
                              const hasWarning = amountWarnings[ticket.ticketNumber];
                              const customAmount = refundForm.customAmounts[ticket.ticketNumber];
                              
                              // If warning exists, show $0, otherwise use custom or max
                              let refundAmount;
                              if (hasWarning) {
                                refundAmount = 0;
                              } else if (customAmount !== undefined && customAmount > 0) {
                                refundAmount = customAmount;
                              } else {
                                refundAmount = ticket.priceDetails.totalPrice - (ticket.totalRefundedAmount || 0);
                              }
                              
                              return (
                                <div key={ticket.ticketNumber} className="text-xs text-slate-600 flex justify-between">
                                  <span className="truncate">{ticket.ticketNumber}</span>
                                  <span className={`font-medium ${hasWarning ? 'text-red-600' : ''}`}>
                                    {formatCurrency(refundAmount)}
                                    {hasWarning && ' ⚠️'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Refund reason <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={refundReason}
                            onChange={(e) => handleReasonChange(e.target.value)}
                            placeholder="Please provide a reason..."
                            rows={3}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                          <div className="flex items-start">
                            <IoWarningOutline className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0" />
                            <div className="text-xs text-slate-600">
                              <p className="font-medium text-amber-800">Important:</p>
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
                          disabled={!refundReason.trim() || processing.loading || !validateRefundAmounts().valid}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 sm:px-4 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing.loading ? (
                            'Processing...'
                          ) : (
                            `Process Refund (${formatCurrency(calculateRefundTotal())})`
                          )}
                        </button>
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