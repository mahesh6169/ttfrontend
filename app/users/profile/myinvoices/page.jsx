"use client";
import React, { useState, useEffect, Fragment } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import jsPDF from 'jspdf';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import axios from '@/utils/axiosConfig';
import { FaDownload, FaRegCalendarAlt, FaMapMarkerAlt, FaBriefcase, FaRegEnvelope, FaPhoneAlt } from 'react-icons/fa';
import Pagination from '@/components/Pagination';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];


const MyInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventInvoices, setSelectedEventInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  const [invoiceMode, setInvoiceMode] = useState('invoice'); // 'invoice' | 'refund'
  const [targetRefundId, setTargetRefundId] = useState(null); // stripeRefundId shown when mode === 'refund'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months
  const [eventInvoicePage, setEventInvoicePage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all user invoices
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/invoices/my-invoices?page=${currentPage}&limit=20`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.success) {
        setInvoices(data.invoices);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.hasMore);
        
        // Extract unique events from invoices using the LATEST invoice per event
        const eventMap = data.invoices.reduce((acc, invoice) => {
          const eventKey = invoice.event.eventCode;
          if (eventKey) {
            // If we haven't seen this event yet, or this invoice is newer, update the event info
            if (!acc[eventKey] || new Date(invoice.createdAt) > new Date(acc[eventKey].createdAt)) {
              acc[eventKey] = {
                id: eventKey,
                eventCode: eventKey,
                title: invoice.event.title,
                dateTime: invoice.event.dateTime,
                venue: invoice.event.venue,
                address: invoice.event.address,
                timeZone: invoice.event.timeZone,
                organizer: invoice.event.organizer,
                createdAt: invoice.createdAt // Keep track of invoice creation time
              };
            }
          }
          return acc;
        }, {});
        
        // Convert to array and remove createdAt field
        const uniqueEvents = Object.values(eventMap).map(({ createdAt, ...event }) => event);

        // Sort events by date (most recent first)
        uniqueEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        setEvents(uniqueEvents);
        
        console.log(`Found ${data.count} invoices across ${uniqueEvents.length} events`);
      } else {
        throw new Error(data.message || 'API returned success: false');
      }

    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(`${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filtering to events
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    let filtered = [...events];

    switch (dateFilter) {
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = events.filter(event => new Date(event.dateTime) >= threeMonthsAgo);
        break;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = events.filter(event => new Date(event.dateTime) >= sixMonthsAgo);
        break;
      case '1year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = events.filter(event => new Date(event.dateTime) >= oneYearAgo);
        break;
      case 'all':
      default:
        // Show all events
        break;
    }

    setFilteredEvents(filtered);
  }, [events, dateFilter]);

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone) => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      console.error('Error formatting date:', error);
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
    }
  };

  // Format date helper
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

  // Handle view invoice with API call
  // Opens the modal over a fetched invoice. mode 'invoice' shows purchase details; mode 'refund'
  // shows only the one refund transaction (refundStripeId).
  const openInvoiceView = async (invoice, mode = 'invoice', refundStripeId = null) => {
    setInvoiceMode(mode);
    setTargetRefundId(refundStripeId);
    setInvoiceLoading(true);
    setInvoiceError(null);
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/invoices/${invoice.invoiceNumber}`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (data.success) {
        setInvoiceData(data.invoice);
      } else {
        throw new Error(data.message || 'Failed to load invoice');
      }

    } catch (err) {
      console.error('Error fetching invoice:', err);
      setInvoiceError(err.message);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleViewInvoice = (invoice) => openInvoiceView(invoice, 'invoice');
  const handleViewRefund = (invoice, refundStripeId) => openInvoiceView(invoice, 'refund', refundStripeId);

  // Group an invoice's embedded refund entries into transactions (one per stripeRefundId),
  // summing the amount and carrying the human-readable refund id. Sorted oldest first.
  const groupRefundsForList = (refunds) => {
    const grouped = (refunds || []).reduce((acc, r) => {
      const key = r.stripeRefundId || 'unknown';
      if (!acc[key]) acc[key] = { stripeRefundId: r.stripeRefundId, refundRequestId: r.refundRequestId, refundDate: r.refundDate, totalAmount: 0 };
      acc[key].totalAmount += (r.refundAmount || 0);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(a.refundDate) - new Date(b.refundDate));
  };

  // Filter invoices when event is selected
  useEffect(() => {
    if (selectedEventId && invoices.length > 0) {
      const eventInvoices = invoices.filter(invoice => 
        invoice.event.eventCode === selectedEventId
      );
      setSelectedEventInvoices(eventInvoices);
    } else {
      setSelectedEventInvoices([]);
    }
  }, [selectedEventId, invoices]);

  if (loading || showSkeleton) {
    return (
      <div className="space-y-6">
        <ProfilePageHeading title="My Invoices" />
        {showSkeleton && <PageSkeleton variant="list" rows={6} />}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ProfilePageHeading title="My Invoices" />
        <ErrorState onRetry={fetchInvoices} />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div>
        <ProfilePageHeading title="My Invoices" />
        <EmptyState
          title="No invoices yet"
          description="You don't have any invoices yet."
          actionLabel="Browse Events"
          actionHref="/events"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfilePageHeading title="My Invoices" />

      {/* Event Selector with Date Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="space-y-3">
          {/* Combined Date Filter and Event Selector */}
          <div className="flex flex-col sm:flex-row sm:gap-4">
            {/* Date Filter - Compact */}
            <div className="sm:w-1/3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
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

            {/* Event Selector - Compact */}
            <div className="flex-1 mt-3 sm:mt-0">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Select Event
              </label>
              {(() => {
                const selectedEvent = events.find((e) => e.id === selectedEventId);
                return (
                  <Listbox value={selectedEventId} onChange={setSelectedEventId}>
                    <div className="relative">
                      <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                        <span className={`block truncate ${selectedEvent ? 'text-slate-900' : 'text-slate-500'}`}>
                          {selectedEvent
                            ? `${selectedEvent.eventCode} - ${selectedEvent.title}`
                            : 'Choose an event'}
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
                                  Choose an event
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
                              No events found
                            </div>
                          ) : (
                            filteredEvents.map((event) => {
                              const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                              return (
                                <ListboxOption
                                  key={event.id}
                                  value={event.id}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                        {event.eventCode} - {event.title} - {eventDateTime.date} - {eventDateTime.time}
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
                );
              })()}

              {filteredEvents.length === 0 && events.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No events in selected range. Try a different date filter.
                </p>
              )}
            </div>
          </div>

          {/* Data retention note */}
          <p className="text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-600">Note:</span> Please save your invoices — events older than 2 years are removed.
          </p>
        </div>
      </div>

      {/* Selected Event Invoices */}
      {selectedEventId && selectedEventInvoices.length > 0 && (
        <div className="space-y-4">
          {/* Event panel — details + organiser (two cards) */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            if (!selectedEvent) return null;
            const timeZone = selectedEvent.timeZone;
            const eventDateTime = formatEventDateTime(selectedEvent.dateTime, timeZone);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Event details */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                      {selectedEvent.eventCode}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-teal-700">
                      {selectedEvent.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
                    <div className="flex items-start gap-2">
                      <FaRegCalendarAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{eventDateTime.date}</p>
                        <p className="text-xs text-slate-500">Starts at {eventDateTime.time} ({timeZone})</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{selectedEvent.venue}</p>
                        {selectedEvent.address && (
                          <p className="text-xs text-slate-500">{selectedEvent.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer contact */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Organizer Contact
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FaBriefcase />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{selectedEvent.organizer?.name || 'Event Organizer'}</p>
                      <p className="text-xs text-slate-500">Host Organization</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {selectedEvent.organizer?.email && selectedEvent.organizer.email.trim() && (
                      <a
                        href={`mailto:${selectedEvent.organizer.email}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors break-all"
                      >
                        <FaRegEnvelope className="text-teal-600 shrink-0" />
                        <span className="truncate">{selectedEvent.organizer.email}</span>
                      </a>
                    )}
                    {(selectedEvent.organizer?.contact || selectedEvent.organizer?.phone) && (
                      <a
                        href={`tel:${selectedEvent.organizer.contact || selectedEvent.organizer.phone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors"
                      >
                        <FaPhoneAlt className="text-teal-600 shrink-0" />
                        <span>{selectedEvent.organizer.contact || selectedEvent.organizer.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Invoice record cards */}
          <div className="space-y-3 sm:space-y-4">
            {(() => {
              const paginatedInvoices = selectedEventInvoices.slice(
                (eventInvoicePage - 1) * itemsPerPage,
                eventInvoicePage * itemsPerPage
              );
              return paginatedInvoices;
            })().map((invoice) => {
              const refundGroups = (invoice.refunds && invoice.refunds.length > 0)
                ? groupRefundsForList(invoice.refunds)
                : [];
              return (
                <div key={invoice.invoiceNumber} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Invoice row: Invoice ID (left) + View Invoice (right) */}
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 truncate">
                      <span className="text-slate-500">Invoice </span>
                      <span className="font-mono font-medium text-slate-800">{invoice.invoiceNumber}</span>
                    </div>
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="text-teal-700 hover:text-teal-800 hover:underline font-semibold shrink-0"
                    >
                      View Invoice
                    </button>
                  </div>

                  {/* Refund rows — mimic the invoice row */}
                  {refundGroups.length > 0 && (
                    <div className="border-t border-slate-200 divide-y divide-slate-100">
                      {refundGroups.map((g, i) => (
                        <div key={g.stripeRefundId || i} className="p-3 sm:p-4 flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0 truncate">
                            <span className="text-slate-500">Refund </span>
                            <span className="font-mono font-medium text-slate-800">{g.refundRequestId || g.stripeRefundId}</span>
                          </div>
                          <button
                            onClick={() => handleViewRefund(invoice, g.stripeRefundId)}
                            className="text-teal-700 hover:text-teal-800 hover:underline font-semibold shrink-0"
                          >
                            View Refund
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination - Only show when event selected and has multiple pages */}
          {(() => {
            const totalInvoicePages = Math.ceil(selectedEventInvoices.length / itemsPerPage);
            return totalInvoicePages > 1 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                <div className="text-sm text-slate-600 text-center mb-2">
                  Showing {((eventInvoicePage - 1) * itemsPerPage) + 1} - {Math.min(eventInvoicePage * itemsPerPage, selectedEventInvoices.length)} of {selectedEventInvoices.length} invoices
                </div>
                <Pagination
                  currentPage={eventInvoicePage}
                  totalPages={totalInvoicePages}
                  onPageChange={(page) => setEventInvoicePage(page)}
                />
              </div>
            ) : null;
          })()}
        </div>
      )}


      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          invoiceData={invoiceData}
          invoiceLoading={invoiceLoading}
          invoiceError={invoiceError}
          mode={invoiceMode}
          targetRefundId={targetRefundId}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
            setInvoiceData(null);
            setInvoiceError(null);
          }}
        />
      )}
    </div>
  );
};

// Enhanced Invoice Modal Component with timestamps
const InvoiceModal = ({ invoice, invoiceData, invoiceLoading, invoiceError, onClose, mode = 'invoice', targetRefundId = null }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const isRefundView = mode === 'refund';
  
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
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

  // PDF Download function
  const downloadPDF = async () => {
    if (!invoiceData) return;

    setIsDownloading(true);
    
    // Small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    const doc = new jsPDF();
    let yPosition = 20;
    const leftMargin = 20;
    const rightMargin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // Header identity — INVOICE or REFUND
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(isRefundView ? 'REFUND' : 'INVOICE', leftMargin, yPosition);

    // Right-side meta
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const metaX = pageWidth - rightMargin - 50;
    if (isRefundView) {
      doc.text('Refund Date', metaX, yPosition - 5);
      doc.setFont(undefined, 'bold');
      doc.text(targetRefund?.refundDate ? formatDate(targetRefund.refundDate) : '-', metaX, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text('Invoice Reference', metaX, yPosition + 7);
      doc.setFont(undefined, 'bold');
      doc.text(invoiceData.invoiceNumber, metaX, yPosition + 12);
    } else {
      doc.text('Issue Date', metaX, yPosition - 5);
      doc.setFont(undefined, 'bold');
      doc.text(formatDate(invoiceData.invoiceDate), metaX, yPosition);
    }

    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(
      isRefundView
        ? (targetRefund?.refundRequestId ? `Refund #${targetRefund.refundRequestId}` : 'Refund')
        : `Invoice #${invoiceData.invoiceNumber}`,
      leftMargin,
      yPosition
    );
    doc.setTextColor(0);
    yPosition += 15;
    
    // Line separator
    doc.setDrawColor(200);
    doc.line(leftMargin, yPosition, pageWidth - rightMargin, yPosition);
    yPosition += 15;
    
    // Two column layout - Organizer and Buyer
    const colWidth = contentWidth / 2;
    
    // Store starting position for right column
    const startY = yPosition;
    
    // From (left column)
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('From', leftMargin, yPosition);
    yPosition += 6;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(invoiceData.event.organizer?.name || 'Event Organizer', leftMargin, yPosition);
    yPosition += 5;
    doc.setTextColor(100);
    
    // Add ABN if exists
    if (invoiceData.event.organizer?.abn) {
      doc.text(`ABN: ${invoiceData.event.organizer.abn}`, leftMargin, yPosition);
      yPosition += 5;
    }
    
    // Add email if exists
    if (invoiceData.event.organizer?.email) {
      doc.text(invoiceData.event.organizer.email, leftMargin, yPosition);
      yPosition += 5;
    }
    
    // Add phone if exists
    if (invoiceData.event.organizer?.phone) {
      doc.text(invoiceData.event.organizer.phone, leftMargin, yPosition);
      yPosition += 5;
    }
    
    // Add website if exists
    if (invoiceData.event.organizer?.website) {
      doc.text(invoiceData.event.organizer.website, leftMargin, yPosition);
      yPosition += 5;
    }
    
    // Adjust yPosition to account for actual fields shown
    yPosition -= 5; // Remove extra spacing from last field
    doc.setTextColor(0);
    
    // Bill To (right column) - use stored starting position
    let rightColY = startY;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To', leftMargin + colWidth, rightColY);
    rightColY += 6;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`${invoiceData.buyer.firstName} ${invoiceData.buyer.lastName}`, leftMargin + colWidth, rightColY);
    rightColY += 5;
    doc.setTextColor(100);
    doc.text(invoiceData.buyer.email, leftMargin + colWidth, rightColY);
    if (invoiceData.buyer.phone) {
      rightColY += 5;
      doc.text(invoiceData.buyer.phone, leftMargin + colWidth, rightColY);
    }
    doc.setTextColor(0);
    
    yPosition = Math.max(yPosition, rightColY) + 15;
    
    // Event Information Box
    doc.setFillColor(245, 245, 245);
    doc.rect(leftMargin, yPosition - 8, contentWidth, 50, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Event Information', leftMargin + 5, yPosition);
    yPosition += 8;
    
    // Event details in grid format
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    // Row 1
    doc.setTextColor(100);
    doc.text('Event Title', leftMargin + 5, yPosition);
    doc.text('Event Code', leftMargin + colWidth, yPosition);
    doc.setTextColor(0);
    yPosition += 4;
    doc.setFontSize(10);
    doc.text(invoiceData.event.title, leftMargin + 5, yPosition);
    doc.text(invoiceData.event.eventCode, leftMargin + colWidth, yPosition);
    yPosition += 8;
    
    // Row 2
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Date & Time', leftMargin + 5, yPosition);
    doc.text('Venue', leftMargin + colWidth, yPosition);
    doc.setTextColor(0);
    yPosition += 4;
    doc.setFontSize(10);
    const eventDateTime = formatInTimeZone(invoiceData.event.dateTime, invoiceData.event.timeZone, 'dd/MM/yyyy \'at\' h:mm a');
    doc.text(eventDateTime, leftMargin + 5, yPosition);
    doc.text(invoiceData.event.venue, leftMargin + colWidth, yPosition);
    yPosition += 4;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Timezone: ${invoiceData.event.timeZone}`, leftMargin + 5, yPosition);
    doc.setTextColor(0);
    
    yPosition += 8;
    
    // Address if exists
    if (invoiceData.event.address) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Address', leftMargin + 5, yPosition);
      doc.setTextColor(0);
      yPosition += 4;
      doc.setFontSize(10);
      doc.text(invoiceData.event.address, leftMargin + 5, yPosition);
    }
    
    yPosition += 15;
    
    // (No "Purchase Details" heading — matches the on-screen invoice; the table is self-explanatory.)

    // Tickets table — invoice shows Price/Discount/Amount; refund shows Amount/Refund Amount.
    const tableLeft = leftMargin;
    const tableWidth = 180;

    if (!isRefundView) {
      const col1Width = 55; // Ticket Type
      const col2Width = 25; // Quantity
      const col3Width = 30; // Price
      const col4Width = 35; // Discount
      const qtyCenterX = tableLeft + col1Width + col2Width / 2;
      const priceRightX = tableLeft + col1Width + col2Width + col3Width - 2;
      const discRightX = tableLeft + col1Width + col2Width + col3Width + col4Width - 2;
      const amountRightX = tableLeft + tableWidth - 2;

      // Header band
      doc.setFillColor(240, 240, 240);
      doc.rect(tableLeft, yPosition - 5, tableWidth, 8, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Ticket Type', tableLeft + 2, yPosition);
      doc.text('Quantity', qtyCenterX, yPosition, { align: 'center' });
      doc.text('Price', priceRightX, yPosition, { align: 'right' });
      doc.text('Discount', discRightX, yPosition, { align: 'right' });
      doc.text('Amount', amountRightX, yPosition, { align: 'right' });
      yPosition += 9; // clear the grey band before the first row

      // Group by ticket type (bundle packs collapse to one "admits N" line at the pack price).
      const groups = groupLineItemsByType(invoiceData.lineItems);

      doc.setFont(undefined, 'normal');
      groups.forEach((item, index) => {
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableLeft, yPosition - 4, tableWidth, 6, 'F');
        }
        doc.text(item.name, tableLeft + 2, yPosition);
        doc.text(item.quantity.toString(), qtyCenterX, yPosition, { align: 'center' });
        doc.text(`$${item.price.toFixed(2)}`, priceRightX, yPosition, { align: 'right' });
        doc.text(item.discount > 0 ? `-$${item.discount.toFixed(2)}` : '-', discRightX, yPosition, { align: 'right' });
        doc.text(`$${item.amount.toFixed(2)}`, amountRightX, yPosition, { align: 'right' });
        yPosition += 6;
      });

      // Separator + Total (with Subtotal + Discount lines when a discount applied, matching the email)
      doc.setDrawColor(200);
      doc.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition);
      yPosition += 5;
      const amt = invoiceData.amounts;
      if (amt.discount && amt.discount.amount > 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Subtotal: $${(amt.subtotal ?? amt.total).toFixed(2)}`, amountRightX, yPosition, { align: 'right' });
        yPosition += 5;
        doc.setTextColor(13, 148, 136);
        doc.text(`Discount${amt.discount.code ? ` (${amt.discount.code})` : ''}: -$${amt.discount.amount.toFixed(2)}`, amountRightX, yPosition, { align: 'right' });
        yPosition += 5;
        doc.setTextColor(0);
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      const totalText = invoiceData.gstIncluded
        ? `Total Paid: $${invoiceData.amounts.total.toFixed(2)} (incl. GST)`
        : `Total Paid: $${invoiceData.amounts.total.toFixed(2)}`;
      doc.text(totalText, amountRightX, yPosition, { align: 'right' });

      // Discount code note (so the code itself is visible, not just the amount)
      if (invoiceData.amounts?.discount && invoiceData.amounts.discount.amount > 0) {
        yPosition += 6;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100);
        const dTypes = [...new Set(invoiceData.lineItems.filter(i => (i.discountAmount || 0) > 0).map(i => i.ticketType.name))];
        const dSuffix = dTypes.length ? ` to ${dTypes.join(', ')}` : '';
        doc.text(`* Discount code ${invoiceData.amounts.discount.code} applied${dSuffix}`, tableLeft, yPosition);
        doc.setTextColor(0);
      }
    } else {
      // Refund table: Ticket Type | Quantity | Amount (paid after discount) | Refund Amount
      const rCol1 = 60; // Ticket Type
      const rCol2 = 35; // Quantity
      const rCol3 = 40; // Amount
      const rQtyCenterX = tableLeft + rCol1 + rCol2 / 2;
      const rAmountRightX = tableLeft + rCol1 + rCol2 + rCol3 - 2;
      const rRefundRightX = tableLeft + tableWidth - 2;

      // Header band
      doc.setFillColor(240, 240, 240);
      doc.rect(tableLeft, yPosition - 5, tableWidth, 8, 'F');
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Ticket Type', tableLeft + 2, yPosition);
      doc.text('Quantity', rQtyCenterX, yPosition, { align: 'center' });
      doc.text('Amount', rAmountRightX, yPosition, { align: 'right' });
      doc.text('Refund Amount', rRefundRightX, yPosition, { align: 'right' });
      yPosition += 9; // clear the grey band before the first row

      // Group the refunded tickets by type; Amount = paid after discount, Refund Amount = refunded.
      const refundTickets = (targetRefund?.tickets || []).reduce((acc, ticket) => {
        const originalItem = invoiceData.lineItems.find(item => item.ticketNumber === ticket.ticketNumber);
        if (originalItem) {
          const typeName = originalItem.ticketType.name;
          if (!acc[typeName]) acc[typeName] = { name: typeName, quantity: 0, amount: 0, refundAmount: 0 };
          const qty = originalItem.quantity || 1;
          acc[typeName].quantity += qty;
          acc[typeName].amount += (originalItem.ticketType.price * qty) - (originalItem.discountAmount || 0);
          acc[typeName].refundAmount += ticket.amount;
        }
        return acc;
      }, {});

      doc.setFont(undefined, 'normal');
      Object.values(refundTickets).forEach((item, index) => {
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(tableLeft, yPosition - 4, tableWidth, 6, 'F');
        }
        doc.text(item.name, tableLeft + 2, yPosition);
        doc.text(item.quantity.toString(), rQtyCenterX, yPosition, { align: 'center' });
        doc.text(`$${item.amount.toFixed(2)}`, rAmountRightX, yPosition, { align: 'right' });
        doc.text(`$${item.refundAmount.toFixed(2)}`, rRefundRightX, yPosition, { align: 'right' });
        yPosition += 6;
      });

      // Bottom separator
      doc.setDrawColor(200);
      doc.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition);
    }

    // Terms and Conditions (refund policy) — matches the on-screen invoice
    if (invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' || invoiceData.refundPolicy?.policyText) {
      yPosition += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(80);
      doc.text('Terms and Conditions:', tableLeft, yPosition);
      yPosition += 5;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      if (invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable') {
        doc.text('* Processing fees are non-refundable', tableLeft, yPosition);
        yPosition += 4;
      }
      if (invoiceData.refundPolicy?.policyText) {
        doc.text(`* ${invoiceData.refundPolicy.policyText}`, tableLeft, yPosition);
        yPosition += 4;
      }
      doc.setTextColor(0);
    }

    // (No refunds section — the invoice is a purchase-time snapshot; refunds are their own REF- documents.)


    // Save the PDF
    const fileName = isRefundView
      ? `Refund_${targetRefund?.refundRequestId || invoiceData.invoiceNumber}_${new Date().getTime()}.pdf`
      : `Invoice_${invoiceData.invoiceNumber}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    
    // Small delay before removing loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsDownloading(false);
  };

  // Helper function to format date with time
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return new Date(dateString).toLocaleString();
    }
  };

  // Helper function to group line items by ticket type for Purchase Details table.
  // A bundle pack shows as ONE line at the pack price with "admits N" (events-bundle-pricing.md D8):
  // its amount is packPrice x packs - discount, never a rounded per-ticket share x quantity (which
  // would read $50.01). Singles group by type; amount is the NET line total (base - discount).
  const groupLineItemsByType = (lineItems) => {
    const r2 = (n) => Math.round(n * 100) / 100;
    const grouped = lineItems.reduce((acc, item) => {
      const isPack = !!(item.pack && item.pack.id);
      const typeName = item.ticketType.name;
      if (!acc[typeName]) {
        acc[typeName] = {
          name: typeName,
          isPack,
          price: isPack ? item.pack.price : item.ticketType.price,
          tickets: 0,
          packIds: new Set(),
          discount: 0,
        };
      }
      const g = acc[typeName];
      g.tickets += (item.quantity || 1);
      g.discount += (item.discountAmount || 0);
      if (isPack) g.packIds.add(item.pack.id);
      return acc;
    }, {});

    return Object.values(grouped).map((g) => {
      if (g.isPack) {
        const packs = g.packIds.size || 1;
        const admits = Math.round(g.tickets / packs);
        return { name: `${g.name} (admits ${admits})`, price: g.price, quantity: packs, discount: r2(g.discount), amount: r2(g.price * packs - g.discount) };
      }
      return { name: g.name, price: g.price, quantity: g.tickets, discount: r2(g.discount), amount: r2(g.price * g.tickets - g.discount) };
    });
  };

  // Helper function to group refunds by transaction for Refund Details table - sorted oldest first
  const groupRefundsByTransaction = (refunds) => {
    const grouped = refunds.reduce((acc, refund) => {
      const refundId = refund.stripeRefundId;
      if (!acc[refundId]) {
        acc[refundId] = {
          stripeRefundId: refundId,
          refundRequestId: refund.refundRequestId,
          refundDate: refund.refundDate,
          reason: refund.reason,
          tickets: [],
          totalAmount: 0
        };
      }
      acc[refundId].totalAmount += (refund.refundAmount || 0);
      
      // All refunds are now individual - one ticket per refund entry
      if (refund.ticketNumber) {
        acc[refundId].tickets.push({
          ticketNumber: refund.ticketNumber,
          amount: refund.refundAmount
        });
      }
      
      return acc;
    }, {});

    // Sort refunds by date - oldest first
    return Object.values(grouped).sort((a, b) =>
      new Date(a.refundDate) - new Date(b.refundDate)
    );
  };

  // In refund view, the specific refund being shown — drives the header's REF id + refund date.
  const targetRefund = (isRefundView && invoiceData?.refunds?.length)
    ? groupRefundsByTransaction(invoiceData.refunds).find(g => !targetRefundId || g.stripeRefundId === targetRefundId)
    : null;

  // Ticket types the discount actually covered (lines with a real discount), for the "applied to …" note.
  const discountedTypeNames = invoiceData?.lineItems
    ? [...new Set(invoiceData.lineItems.filter(i => (i.discountAmount || 0) > 0).map(i => i.ticketType.name))]
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[calc(100vh-100px)] flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-teal-700">{isRefundView ? 'Refund Details' : 'Invoice Details'}</h3>
          <button
            onClick={onClose}
            className="text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Invoice Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Loading/Error States */}
          {invoiceLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-2">Loading invoice details...</span>
            </div>
          )}
          
          {invoiceError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">Error loading invoice: {invoiceError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Show invoice content only if data is loaded */}
          {invoiceData && !invoiceLoading && (
            <>
              {/* Header — invoice or refund identity */}
              <div className="border-b pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{isRefundView ? 'REFUND' : 'INVOICE'}</h2>
                    <p className="text-slate-600 mt-1">
                      {isRefundView
                        ? (targetRefund?.refundRequestId ? `Refund #${targetRefund.refundRequestId}` : 'Refund')
                        : `Invoice #${invoiceData.invoiceNumber}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {isRefundView ? (
                      <>
                        <p className="text-sm text-slate-600">Refund Date</p>
                        <p className="font-medium">{targetRefund?.refundDate ? formatDate(targetRefund.refundDate) : '—'}</p>
                        <p className="text-sm text-slate-600 mt-2">Invoice Reference</p>
                        <p className="font-medium">{invoiceData.invoiceNumber}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600">Issue Date</p>
                        <p className="font-medium">{formatDate(invoiceData.invoiceDate)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Organizer and Buyer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">From</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.event.organizer?.name || 'Event Organizer'}</p>
                    {invoiceData.event.organizer?.abn && (
                      <p className="text-slate-600">ABN: {invoiceData.event.organizer.abn}</p>
                    )}
                    <p className="text-slate-600">{invoiceData.event.organizer?.email || 'N/A'}</p>
                    {invoiceData.event.organizer?.phone && (
                      <p className="text-slate-600">{invoiceData.event.organizer.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Bill To</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.buyer.firstName} {invoiceData.buyer.lastName}</p>
                    <p className="text-slate-600">{invoiceData.buyer.email}</p>
                    {invoiceData.buyer.phone && (
                      <p className="text-slate-600">{invoiceData.buyer.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h4 className="font-semibold text-slate-900 mb-4">Event Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">Event Title</p>
                    <p className="text-slate-900">{invoiceData.event.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Event Code</p>
                    <p className="text-slate-900 font-mono">{invoiceData.event.eventCode}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Date & Time</p>
                    <p className="text-slate-900">
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
                    <p className="text-xs text-slate-500 mt-1">Timezone: {invoiceData.event.timeZone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Venue</p>
                    <p className="text-slate-900">{invoiceData.event.venue}</p>
                  </div>
                  {invoiceData.event.address && (
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-700">Address</p>
                      <p className="text-slate-900">{invoiceData.event.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Purchase Details Table with timestamp — invoice view only */}
              {!isRefundView && (
              <div className="mb-8">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Table scrolls sideways on small screens if columns don't fit */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-slate-700">Ticket Type</th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-slate-700">Quantity</th>
                          <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-700">Price</th>
                          <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-700">Discount</th>
                          <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {groupLineItemsByType(invoiceData.lineItems).map((group, index) => (
                          <tr key={group.name} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm border-t border-slate-100 whitespace-nowrap">{group.name}</td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-center border-t border-slate-100">{group.quantity}</td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-right border-t border-slate-100 whitespace-nowrap">${group.price.toFixed(2)}</td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-right border-t border-slate-100 text-teal-700 whitespace-nowrap">
                              {group.discount > 0 ? `-$${group.discount.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-right border-t border-slate-100 font-medium whitespace-nowrap">${group.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Money summary - outside the table so it stays visible on mobile (never clipped by
                      table overflow). When a discount applied, show Subtotal + Discount (code + amount)
                      before Total Paid, matching the buyer email. */}
                  <div className="bg-slate-50 border-t border-slate-300 px-3 sm:px-4 py-3 text-right text-sm text-slate-900 space-y-1">
                    {invoiceData.amounts?.discount && invoiceData.amounts.discount.amount > 0 && (
                      <>
                        <div className="text-slate-600">Subtotal: ${(invoiceData.amounts.subtotal ?? invoiceData.amounts.total).toFixed(2)}</div>
                        <div className="text-teal-700">Discount{invoiceData.amounts.discount.code ? ` (${invoiceData.amounts.discount.code})` : ''}: -${invoiceData.amounts.discount.amount.toFixed(2)}</div>
                      </>
                    )}
                    <div className="font-bold">Total Paid: ${invoiceData.amounts.total.toFixed(2)}{invoiceData.gstIncluded && ' (incl. GST)'}</div>
                  </div>

                  {/* Notes Below Table — discount code (informational) + Terms & Conditions (refund policy) */}
                  {((invoiceData.amounts?.discount && invoiceData.amounts.discount.amount > 0) || invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' || invoiceData.refundPolicy?.policyText) && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
                      {invoiceData.amounts?.discount && invoiceData.amounts.discount.amount > 0 && (
                        <p>* Discount code {invoiceData.amounts.discount.code} applied{discountedTypeNames.length ? ` to ${discountedTypeNames.join(', ')}` : ''}</p>
                      )}
                      {(invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' || invoiceData.refundPolicy?.policyText) && (
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700">Terms and Conditions:</p>
                          {invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                            <p>* Processing fees are non-refundable</p>
                          )}
                          {invoiceData.refundPolicy?.policyText && (
                            <p>* {invoiceData.refundPolicy.policyText}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* The invoice is a purchase-time snapshot — refunds are NOT appended here; they open as
                  their own Refund links/views from the list. */}

              {/* Refund view: show only the opened refund transaction */}
              {isRefundView && invoiceData.refunds && invoiceData.refunds.length > 0 && (
                <div className="mb-8">
                  {(() => {
                    const refundGroups = groupRefundsByTransaction(invoiceData.refunds)
                      .filter((g) => !targetRefundId || g.stripeRefundId === targetRefundId);
                    return refundGroups.map((refundGroup, groupIndex) => (
                      <div key={refundGroup.stripeRefundId} className="mb-6">
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Table scrolls sideways on small screens if columns don't fit */}
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-slate-700">Ticket Type</th>
                                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-slate-700">Quantity</th>
                                  <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-700">Amount</th>
                                  <th className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-700">Refund Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                {(() => {
                                  // Group refunded tickets by type for this refund transaction.
                                  // Amount = what was paid for that ticket (price after discount); Refund Amount = refunded.
                                  const refundTicketsByType = refundGroup.tickets.reduce((acc, ticket) => {
                                    const originalItem = invoiceData.lineItems.find(item =>
                                      item.ticketNumber === ticket.ticketNumber
                                    );

                                    if (originalItem) {
                                      const typeName = originalItem.ticketType.name;
                                      if (!acc[typeName]) {
                                        acc[typeName] = { name: typeName, quantity: 0, amount: 0, refundAmount: 0 };
                                      }
                                      const qty = originalItem.quantity || 1;
                                      acc[typeName].quantity += qty;
                                      acc[typeName].amount += (originalItem.ticketType.price * qty) - (originalItem.discountAmount || 0);
                                      acc[typeName].refundAmount += ticket.amount;
                                    }

                                    return acc;
                                  }, {});

                                  return Object.values(refundTicketsByType).map((group, index) => (
                                    <tr key={group.name} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm border-t border-slate-100 whitespace-nowrap">{group.name}</td>
                                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-center border-t border-slate-100">{group.quantity}</td>
                                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-right border-t border-slate-100 whitespace-nowrap">${group.amount.toFixed(2)}</td>
                                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-right border-t border-slate-100 font-medium whitespace-nowrap">${group.refundAmount.toFixed(2)}</td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>

                          {/* Terms and Conditions (refund policy) */}
                          {(invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' || invoiceData.refundPolicy?.policyText) && (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                              <p className="font-semibold text-slate-700">Terms and Conditions:</p>
                              {invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                                <p>* Processing fees are non-refundable</p>
                              )}
                              {invoiceData.refundPolicy?.policyText && (
                                <p>* {invoiceData.refundPolicy.policyText}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Actions — PDF download (invoice or refund) as a teal text link */}
              <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <FaDownload size={13} />
                  {isDownloading
                    ? 'Generating…'
                    : (isRefundView ? 'Download Refund' : 'Download Invoice')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInvoicesPage;