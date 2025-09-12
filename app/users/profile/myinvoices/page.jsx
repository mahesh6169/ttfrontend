"use client";
import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import jsPDF from 'jspdf';
import axios from '@/utils/axiosConfig';

const MyInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventInvoices, setSelectedEventInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months

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

  // Get invoice status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': { color: 'bg-green-100 text-green-800', text: 'Paid' },
      'partially_refunded': { color: 'bg-orange-100 text-orange-800', text: 'Partially Refunded' },
      'fully_refunded': { color: 'bg-red-100 text-red-800', text: 'Fully Refunded' }
    };

    const config = statusConfig[status] || statusConfig['paid'];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Handle view invoice with API call
  const handleViewInvoice = async (invoice) => {
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
        console.log('Invoice data loaded:', data.invoice.invoiceNumber);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={fetchInvoices} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Invoices Yet</h2>
        <p className="text-gray-600 mb-4">You haven't purchased any tickets yet.</p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Invoices</h2>
      </div>

      {/* Event Selector with Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="space-y-4">
          {/* Date Filter */}
          <div>
            <label htmlFor="dateFilter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter by Date Range
            </label>
            <select
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="3months">Last 3 months</option>
              <option value="6months">Last 6 months</option>
              <option value="1year">Last year</option>
              <option value="all">Show all</option>
            </select>
          </div>

          {/* Event Selector */}
          <div>
            <label htmlFor="eventSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select Event to View Invoices
            </label>
            <select
              id="eventSelect"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Choose an event --</option>
              {filteredEvents.map((event) => {
                const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                return (
                  <option key={event.id} value={event.id}>
                    {event.title} - {eventDateTime.combined} at {event.venue}
                  </option>
                );
              })}
            </select>
            {filteredEvents.length === 0 && events.length > 0 && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                No events found in the selected date range. Try selecting a different range.
              </p>
            )}
          </div>

          {/* Data Retention Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-amber-800">
              <strong>Note:</strong> Please save your invoices. Events older than 2 years will be deleted by admin.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Event Invoices */}
      {selectedEventId && selectedEventInvoices.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            if (!selectedEvent) return null;
            const eventDateTime = formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone);
            
            return (
              <div className="bg-gray-50 border-b">
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Event Details Container - 2 columns on desktop */}
                    <div className="md:col-span-2 bg-white rounded-lg p-4">
                      {/* Event Title and ID in one line */}
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                        {selectedEvent.title} ({selectedEvent.eventCode})
                      </h3>

                      {/* Event Details */}
                      <div className="space-y-3">
                        {/* Date & Time */}
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm sm:text-base text-gray-700">
                            {eventDateTime.date} {eventDateTime.time} {selectedEvent.timeZone}
                          </span>
                        </div>

                        {/* Venue */}
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-sm sm:text-base text-gray-700">
                            {selectedEvent.venue}
                          </span>
                        </div>

                        {/* Address */}
                        {selectedEvent.address && (
                          <div className="flex items-start gap-3">
                            <div className="text-gray-500 mt-0.5">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-sm sm:text-base text-gray-700">
                              {selectedEvent.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Organized By Container - 1 column on desktop */}
                    <div className="md:col-span-1 bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">From:</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {selectedEvent.organizer?.name || 'Event Organizer'}
                          </p>
                        </div>
                        
                        {selectedEvent.organizer?.abn && (
                          <div>
                            <span className="text-sm text-gray-600">ABN:</span>
                            <p className="text-sm text-gray-900">
                              {selectedEvent.organizer.abn}
                            </p>
                          </div>
                        )}
                        
                        {(selectedEvent.organizer?.contact || selectedEvent.organizer?.phone) && (
                          <div>
                            <span className="text-sm text-gray-600">Contact:</span>
                            <p className="text-sm text-gray-900">
                              {selectedEvent.organizer.contact || selectedEvent.organizer.phone}
                            </p>
                          </div>
                        )}
                        
                        {selectedEvent.organizer?.email && selectedEvent.organizer.email.trim() && (
                          <div>
                            <span className="text-sm text-gray-600">Email-id:</span>
                            <p className="text-sm text-gray-900 break-all">
                              {selectedEvent.organizer.email}
                            </p>
                          </div>
                        )}
                        
                        {selectedEvent.organizer?.website && selectedEvent.organizer.website.trim() && (
                          <div>
                            <span className="text-sm text-gray-600">Website:</span>
                            <p className="text-sm text-gray-900 break-all">
                              <a href={selectedEvent.organizer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {selectedEvent.organizer.website}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Invoice List */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Your Invoices</h4>
            
            {selectedEventInvoices.map((invoice) => (
                <div key={invoice.invoiceNumber} 
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      {/* Invoice Header */}
                      <div className="flex items-center gap-3 mb-2 sm:mb-3">
                        <h5 className="text-sm sm:text-base font-semibold text-gray-900">
                          Invoice: {invoice.invoiceNumber}
                        </h5>
                        {getStatusBadge(invoice.status)}
                      </div>

                      {/* Invoice Details Grid */}
                      <div className="space-y-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3 sm:space-y-0 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Tickets:</span>
                          <div className="text-gray-900">{invoice.ticketCount}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Total Amount:</span>
                          <div className="text-gray-900">${invoice.amounts.total.toFixed(2)}</div>
                        </div>
                        
                        {invoice.hasRefunds && (
                          <div>
                            <span className="font-medium text-gray-700">Refunded:</span>
                            <div className="text-red-600">${invoice.amounts.totalRefunded.toFixed(2)}</div>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium text-gray-700">Purchase Date:</span>
                          <div className="text-gray-900">{formatDate(invoice.invoiceDate)}</div>
                        </div>
                      </div>

                    </div>

                    {/* Action Button */}
                    <div className="sm:ml-4">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        View Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={!hasMore}
            className={`px-4 py-2 rounded ${
              !hasMore 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          invoiceData={invoiceData}
          invoiceLoading={invoiceLoading}
          invoiceError={invoiceError}
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
const InvoiceModal = ({ invoice, invoiceData, invoiceLoading, invoiceError, onClose }) => {
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
  const downloadPDF = () => {
    if (!invoiceData) return;

    const doc = new jsPDF();
    let yPosition = 20;
    const leftMargin = 20;
    const rightMargin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    
    // INVOICE Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', leftMargin, yPosition);
    
    // Invoice Number and Date on the right
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Issue Date', pageWidth - rightMargin - 40, yPosition - 5);
    doc.setFont(undefined, 'bold');
    doc.text(formatDate(invoiceData.invoiceDate), pageWidth - rightMargin - 40, yPosition);
    
    yPosition += 8;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Invoice #${invoiceData.invoiceNumber}`, leftMargin, yPosition);
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
    
    // Purchase Details with timestamp
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`Purchase Details | ${formatDateTime(invoiceData.payment.paymentDate)}`, leftMargin, yPosition);
    yPosition += 10;
    
    // Table-like structure with borders
    const tableLeft = leftMargin;
    const col1Width = 80;
    const col2Width = 30;
    const col3Width = 35;
    const col4Width = 35;
    const tableWidth = col1Width + col2Width + col3Width + col4Width;
    
    // Table header background
    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, yPosition - 5, tableWidth, 8, 'F');
    
    // Table headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Ticket Type', tableLeft + 2, yPosition);
    doc.text('Quantity', tableLeft + col1Width + 2, yPosition);
    doc.text('Price', tableLeft + col1Width + col2Width + 2, yPosition);
    doc.text('Amount', tableLeft + col1Width + col2Width + col3Width + 2, yPosition);
    yPosition += 5;
    
    // Group line items by type
    doc.setFont(undefined, 'normal');
    const groupedItems = invoiceData.lineItems.reduce((acc, item) => {
      const key = item.ticketType.name;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          quantity: 0,
          price: item.ticketType.price,
          amount: 0
        };
      }
      acc[key].quantity += item.quantity || 1;
      acc[key].amount += (item.ticketType.price * (item.quantity || 1));
      return acc;
    }, {});
    
    // Draw rows
    Object.values(groupedItems).forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tableLeft, yPosition - 4, tableWidth, 6, 'F');
      }
      
      doc.text(item.name, tableLeft + 2, yPosition);
      doc.text(item.quantity.toString(), tableLeft + col1Width + 10, yPosition, { align: 'center' });
      doc.text(`$${item.price.toFixed(2)}`, tableLeft + col1Width + col2Width + 15, yPosition, { align: 'right' });
      doc.text(`$${item.amount.toFixed(2)}`, tableLeft + col1Width + col2Width + col3Width + 15, yPosition, { align: 'right' });
      yPosition += 6;
    });
    
    // Total row
    doc.setDrawColor(200);
    doc.line(tableLeft, yPosition, tableLeft + tableWidth, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    const totalText = invoiceData.gstIncluded 
      ? `Total Paid: $${invoiceData.amounts.total.toFixed(2)} (incl. GST)`
      : `Total Paid: $${invoiceData.amounts.total.toFixed(2)}`;
    doc.text(totalText, tableLeft + col1Width + col2Width + col3Width + 15, yPosition, { align: 'right' });
    
    // Policy notes
    yPosition += 8;
    if (invoiceData.refundPolicy?.processingFeePolicy || invoiceData.refundPolicy?.policyText) {
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
    
    // Refunds section if any
    if (invoiceData.refunds && invoiceData.refunds.length > 0) {
      yPosition += 15;
      
      // Group refunds by transaction (sorted oldest first)
      const refundGroups = groupRefundsByTransaction(invoiceData.refunds);
      
      refundGroups.forEach((refundGroup, groupIndex) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Refund header with timestamp
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text(`Refund #${groupIndex + 1} | ${formatDateTime(refundGroup.refundDate)}`, leftMargin, yPosition);
        yPosition += 10;
        
        // Refund table header with red background
        doc.setFillColor(255, 240, 240);
        doc.rect(tableLeft, yPosition - 5, tableWidth, 8, 'F');
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Ticket Type', tableLeft + 2, yPosition);
        doc.text('Quantity', tableLeft + col1Width + 2, yPosition);
        doc.text('Price', tableLeft + col1Width + col2Width + 2, yPosition);
        doc.text('Refund Amount', tableLeft + col1Width + col2Width + col3Width + 2, yPosition);
        yPosition += 5;
        
        // Group refunded tickets by type
        doc.setFont(undefined, 'normal');
        const refundTicketsByType = refundGroup.tickets.reduce((acc, ticket) => {
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
        
        // Draw refund rows
        Object.values(refundTicketsByType).forEach((item, index) => {
          if (index % 2 === 1) {
            doc.setFillColor(255, 250, 250);
            doc.rect(tableLeft, yPosition - 4, tableWidth, 6, 'F');
          }
          
          doc.text(item.name, tableLeft + 2, yPosition);
          doc.text(item.quantity.toString(), tableLeft + col1Width + 10, yPosition, { align: 'center' });
          doc.text(`$${item.price.toFixed(2)}`, tableLeft + col1Width + col2Width + 15, yPosition, { align: 'right' });
          doc.setTextColor(220, 38, 38); // Red color for refund amounts
          doc.text(`$${item.refundAmount.toFixed(2)}`, tableLeft + col1Width + col2Width + col3Width + 15, yPosition, { align: 'right' });
          doc.setTextColor(0);
          yPosition += 6;
        });
        
        // Refund reason and notes
        yPosition += 3;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Refund Reason: ${refundGroup.reason || 'Customer request'}`, tableLeft, yPosition);
        yPosition += 4;
        if (invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable') {
          doc.text('* Processing fees are non-refundable', tableLeft, yPosition);
          yPosition += 4;
        }
        if (invoiceData.refundPolicy?.policyText) {
          doc.text(`* ${invoiceData.refundPolicy.policyText}`, tableLeft, yPosition);
          yPosition += 4;
        }
        doc.setTextColor(0);
        yPosition += 4;
      });
      
    }
    
    
    // Save the PDF
    const fileName = `Invoice_${invoiceData.invoiceNumber}_${new Date().getFullYear()}.pdf`;
    doc.save(fileName);
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

  // Helper function to group refunds by transaction for Refund Details table - sorted oldest first
  const groupRefundsByTransaction = (refunds) => {
    const grouped = refunds.reduce((acc, refund) => {
      const refundId = refund.stripeRefundId;
      if (!acc[refundId]) {
        acc[refundId] = {
          stripeRefundId: refundId,
          refundDate: refund.refundDate,
          reason: refund.reason,
          tickets: [],
          totalAmount: refund.refundAmount
        };
      }
      
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
            X
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8">
          {/* Loading/Error States */}
          {invoiceLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                  <h4 className="font-semibold text-gray-900 mb-3">From</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.event.organizer?.name || 'Event Organizer'}</p>
                    {invoiceData.event.organizer?.abn && (
                      <p className="text-gray-600">ABN: {invoiceData.event.organizer.abn}</p>
                    )}
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

              {/* Purchase Details Table with timestamp */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">
                  Purchase Details | {formatDateTime(invoiceData.payment.paymentDate)}
                </h4>
                
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
                        <td className="px-4 py-3 text-sm text-right font-bold">
                          Total Paid: ${invoiceData.amounts.total.toFixed(2)}
                          {invoiceData.gstIncluded && ' (incl. GST)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Policy Notes Below Table */}
                  {(invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' || invoiceData.refundPolicy?.policyText) && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
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

              {/* Refund Details Table with timestamps (only if refunds exist) - sorted oldest first */}
              {invoiceData.refunds && invoiceData.refunds.length > 0 && (
                <div className="mb-8">
                  {(() => {
                    const refundGroups = groupRefundsByTransaction(invoiceData.refunds);
                    return refundGroups.map((refundGroup, groupIndex) => (
                      <div key={refundGroup.stripeRefundId} className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">
                          Refund #{groupIndex + 1} | {formatDateTime(refundGroup.refundDate)}
                        </h4>
                        
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
                            {invoiceData.refundPolicy?.policyText && (
                              <p>* {invoiceData.refundPolicy.policyText}</p>
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
                  onClick={downloadPDF}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download PDF
                </button>
                <button 
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled
                >
                  Email Invoice (Coming Soon)
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