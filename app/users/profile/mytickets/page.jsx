"use client";
import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { generateTicketsPDF } from '../../../../utils/paidEventTicketGenerator';
import axios from '@/utils/axiosConfig';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { FaQrcode, FaDownload } from 'react-icons/fa';

const EnhancedMyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTickets, setSelectedEventTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState(null);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months
  const [expandedPurchases, setExpandedPurchases] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { invoiceNumber: 'tickets' | 'details' }

  // Fetch all user tickets
  useEffect(() => {
    const fetchAllMyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/paid/my-paid-tickets`,
          {
            withCredentials: true,
          }
        );

        const data = response.data;

        if (data.success) {
          setTickets(data.tickets);
          
          // Extract unique events from tickets using eventSnapshot from the LATEST ticket per event
          const eventMap = data.tickets.reduce((acc, ticket) => {
            const eventKey = ticket.event || ticket.eventSnapshot?.eventCode;
            if (eventKey) {
              // If we haven't seen this event yet, or this ticket is newer, update the event info
              if (!acc[eventKey] || new Date(ticket.createdAt) > new Date(acc[eventKey].createdAt)) {
                acc[eventKey] = {
                  id: eventKey,
                  title: ticket.eventSnapshot?.title,
                  dateTime: ticket.eventSnapshot?.dateTime,
                  venue: ticket.eventSnapshot?.venue,
                  eventCode: ticket.eventSnapshot?.eventCode,
                  organizer: ticket.eventSnapshot?.organizer,
                  timeZone: ticket.eventSnapshot?.timeZone,
                  createdAt: ticket.createdAt // Keep track of ticket creation time
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

          console.log(`✅ Found ${data.count} tickets across ${uniqueEvents.length} events`);
        } else {
          throw new Error(data.message || 'API returned success: false');
        }

      } catch (err) {
        console.error('❌ Error fetching tickets:', err);
        setError(`${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMyTickets();
  }, []);

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

  // Filter tickets when event is selected
  useEffect(() => {
    if (selectedEventId && tickets.length > 0) {
      const eventTickets = tickets.filter(ticket => {
        const ticketEventId = ticket.event || ticket.eventSnapshot?.eventCode; 
        return ticketEventId === selectedEventId;
      });
      
      // Group tickets by invoice number for purchase groups
      const groupedTickets = groupTicketsByInvoice(eventTickets);
      setSelectedEventTickets(groupedTickets);
    } else {
      setSelectedEventTickets([]);
    }
  }, [selectedEventId, tickets]);

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone) => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback to regular date formatting
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
    }
  };

  // Group tickets by invoice number (same purchase)
  const groupTicketsByInvoice = (tickets) => {
    const grouped = tickets.reduce((acc, ticket) => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!acc[invoiceNumber]) {
        acc[invoiceNumber] = [];
      }
      acc[invoiceNumber].push(ticket);
      return acc;
    }, {});

    // Convert to array and sort by purchase date
    return Object.values(grouped).sort((a, b) => 
      new Date(b[0].createdAt) - new Date(a[0].createdAt)
    );
  };

  // Calculate total for a ticket group
  const calculateGroupTotal = (ticketGroup) => {
    return ticketGroup.reduce((sum, ticket) => sum + (ticket.priceDetails?.totalPrice || ticket.ticketType?.price || 0), 0);
  };

  // Format seat information for display
  const formatSeats = (ticketGroup) => {
    const allSeats = ticketGroup.flatMap(ticket => ticket.seats || []);
    
    if (allSeats.length === 0) {
      return 'General Admission';
    }

    if (allSeats.length === 1) {
      return `${allSeats[0].row}-${allSeats[0].seatNumber}`;
    }

    // Group by row
    const seatsByRow = allSeats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(parseInt(seat.seatNumber));
      return acc;
    }, {});

    const formattedRows = Object.entries(seatsByRow).map(([row, numbers]) => {
      numbers.sort((a, b) => a - b);
      
      if (numbers.length === 1) {
        return `${row}-${numbers[0]}`;
      } else if (areConsecutive(numbers)) {
        return `${row}-${numbers[0]} to ${row}-${numbers[numbers.length - 1]}`;
      } else {
        return `${row}: ${numbers.join(', ')}`;
      }
    });

    return formattedRows.join(', ');
  };

 // Check if numbers are consecutive
  const areConsecutive = (numbers) => {
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) return false;
    }
    return true;
  };

  // 🆕 NEW: Group tickets by type within a ticket group
  const groupTicketsByType = (ticketGroup) => {
    const typeGroups = {};
    
    ticketGroup.forEach(ticket => {
      const typeName = ticket.ticketType.name;
      if (!typeGroups[typeName]) {
        typeGroups[typeName] = {
          name: typeName,
          count: 0,
          tickets: []
        };
      }
      typeGroups[typeName].count++;
      typeGroups[typeName].tickets.push(ticket);
    });
    
    return Object.values(typeGroups);
  };


  // Get refund status
  const getRefundStatus = (ticketGroup) => {
    const fullyRefundedTickets = ticketGroup.filter(t => t.refundStatus === 'full');
    const partiallyRefundedTickets = ticketGroup.filter(t => t.refundStatus === 'partial');
    
    if (fullyRefundedTickets.length === 0 && partiallyRefundedTickets.length === 0) return null;
    
    if (fullyRefundedTickets.length === ticketGroup.length) {
      return { type: 'full', text: 'Fully Refunded' };
    } else if (partiallyRefundedTickets.length > 0 || fullyRefundedTickets.length > 0) {
      const refundedCount = fullyRefundedTickets.length + partiallyRefundedTickets.length;
      return { type: 'partial', text: `${refundedCount}/${ticketGroup.length} Refunded` };
    }
  };

  // Handle tab click for purchases
  const handleTabClick = (invoiceNumber, tab) => {
    const isCurrentlyExpanded = expandedPurchases.has(invoiceNumber);
    const currentTab = activeTab[invoiceNumber] || 'tickets';
    
    if (!isCurrentlyExpanded) {
      const newExpanded = new Set(expandedPurchases);
      newExpanded.add(invoiceNumber);
      setExpandedPurchases(newExpanded);
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    } else if (currentTab === tab) {
      const newExpanded = new Set(expandedPurchases);
      newExpanded.delete(invoiceNumber);
      setExpandedPurchases(newExpanded);
    } else {
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your tickets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Tickets Yet</h2>
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Paid Events - My Tickets</h2>
      </div>

      {/* Event Selector with Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          {/* Combined Date Filter and Event Selector */}
          <div className="flex flex-col sm:flex-row sm:gap-4">
            {/* Date Filter - Compact */}
            <div className="sm:w-1/3">
              <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-600 mb-1">
                Date Range
              </label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
                <option value="1year">Last year</option>
                <option value="all">Show all</option>
              </select>
            </div>

            {/* Event Selector - Compact */}
            <div className="flex-1 mt-3 sm:mt-0">
              <label htmlFor="eventSelect" className="block text-xs font-medium text-gray-600 mb-1">
                Select Event
              </label>
              <select
                id="eventSelect"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white truncate"
              >
                <option value="">Choose an event</option>
                {filteredEvents.length === 0 ? (
                  <option disabled>No events found</option>
                ) : (
                  filteredEvents.map((event) => {
                    const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                    return (
                      <option key={event.id} value={event.id}>
                        {event.eventCode} - {event.title} - {eventDateTime.date} - {eventDateTime.time}
                      </option>
                    );
                  })
                )}
              </select>

              {filteredEvents.length === 0 && events.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No events in selected range. Try a different date filter.
                </p>
              )}
            </div>
          </div>

          {/* Data Retention Warning - More compact */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Please save your tickets. Events older than 2 years will be deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Event Tickets */}
      {selectedEventId && selectedEventTickets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            // Get the latest ticket across ALL tickets for this event (not just first group)
            const allEventTickets = tickets.filter(ticket => {
              const ticketEventId = ticket.event || ticket.eventSnapshot?.eventCode;
              return ticketEventId === selectedEventId;
            });
            // Sort by createdAt to get the absolute latest ticket
            const latestTicket = allEventTickets.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            const eventInfo = latestTicket?.eventSnapshot || selectedEvent;
            const timeZone = eventInfo.timeZone;
            const eventDateTime = formatEventDateTime(eventInfo.dateTime, timeZone);
            
            return (
              <div className="bg-gray-50 border-b border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* Event Title */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {eventInfo.title}
                  </h3>
                  
                  {/* Event Code */}
                  <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                    {eventInfo.eventCode}
                  </span>
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-1 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{eventDateTime.combined}</span>
                  </div>
                  
                  {/* Venue */}
                  <div className="flex items-center gap-1 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{eventInfo.venue}</span>
                  </div>

                  {/* Address - Full width on new line if exists */}
                  {eventInfo.address && (
                    <div className="w-full flex items-start gap-1 text-gray-600 text-xs sm:text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{eventInfo.address}</span>
                    </div>
                  )}

                  {/* Organizer Info - Full width on new line */}
                  <div className="w-full border-t border-gray-200 pt-3 mt-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-600">
                      <div>
                        <span className="font-medium text-gray-700">Organizer:</span> {eventInfo.organizer?.name || 'Event Organizer'}
                      </div>
                      {(eventInfo.organizer?.contact || eventInfo.organizer?.phone) && (
                        <div>
                          <span className="font-medium text-gray-700">Contact:</span> {eventInfo.organizer.contact || eventInfo.organizer.phone}
                        </div>
                      )}
                      {eventInfo.organizer?.email && eventInfo.organizer.email.trim() && (
                        <div className="break-all">
                          <span className="font-medium text-gray-700">Email:</span> {eventInfo.organizer.email}
                        </div>
                      )}
                      {eventInfo.organizer?.abn && (
                        <div>
                          <span className="font-medium text-gray-700">ABN:</span> {eventInfo.organizer.abn}
                        </div>
                      )}
                      {eventInfo.organizer?.website && eventInfo.organizer.website.trim() && (
                        <div className="break-all">
                          <span className="font-medium text-gray-700">Website:</span> <a href={eventInfo.organizer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{eventInfo.organizer.website}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ticket Purchase Groups */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-w-4xl mx-auto">
            
            {selectedEventTickets.map((ticketGroup, index) => {
              const representative = ticketGroup[0];
              const invoiceNumber = representative.invoiceNumber;
              const isExpanded = expandedPurchases.has(invoiceNumber);
              const totalAmount = calculateGroupTotal(ticketGroup);
              const seatInfo = formatSeats(ticketGroup);
              const refundStatus = getRefundStatus(ticketGroup);
              const typeGroups = groupTicketsByType(ticketGroup);
              
              return (
                <div key={`${invoiceNumber}-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Purchase Header */}
                  <div className="p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Purchased on {new Date(representative.createdAt).toLocaleDateString()}
                        </span>
                        {refundStatus && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${refundStatus.type === 'full' ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-100'}`}>
                            {refundStatus.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 sm:p-4 flex gap-2 border-t border-gray-200">
                    <button
                      onClick={() => handleTabClick(invoiceNumber, 'tickets')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isExpanded && (activeTab[invoiceNumber] || 'tickets') === 'tickets'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      View Ticket Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTicketGroup(ticketGroup);
                        setShowTicketsModal(true);
                      }}
                      className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    >
                      <FaQrcode className="inline mr-2" />
                      View QR Codes
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Ticket Details Tab */}
                      <div className="p-3 sm:p-4 bg-white">
                        <div className="space-y-2">
                          {ticketGroup.map((ticket, idx) => {
                            const isRefunded = ticket.refundStatus === 'full' || ticket.checkInStatus === 'cancelled';
                            return (
                              <div key={ticket._id} className={`border-b last:border-0 pb-2 last:pb-0 ${isRefunded ? 'opacity-60' : ''}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">{isRefunded ? '✗' : '✓'}</span>
                                    <div>
                                      <div className="text-sm sm:text-base font-mono font-medium text-gray-900">
                                        {ticket.ticketNumber}
                                        {isRefunded && <span className="ml-2 text-xs font-bold text-red-600">[REFUNDED]</span>}
                                      </div>
                                      <div className="text-xs sm:text-sm text-gray-600">
                                        {ticket.ticketType.name}
                                      </div>
                                    </div>
                                  </div>
                                  {ticket.seats?.[0] && (
                                    <div className="text-xs sm:text-sm text-gray-600">
                                      Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tickets Modal */}
      {showTicketsModal && selectedTicketGroup && (
        <TicketsModal
          ticketGroup={selectedTicketGroup}
          onClose={() => {
            setShowTicketsModal(false);
            setSelectedTicketGroup(null);
          }}
        />
      )}
    </div>
  );
};


// Tickets Modal Component - Simple ticket style
const TicketsModal = ({ ticketGroup, onClose }) => {
  // Get event information from the first ticket
  const firstTicket = ticketGroup[0];
  const eventInfo = firstTicket.eventSnapshot;
  
  // Format event date with timezone support
  const formatEventDateTime = () => {
    try {
      const date = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'h:mm a');
      return { date, time };
    } catch (error) {
      const fallbackDate = new Date(eventInfo.dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  };

  const { date, time } = formatEventDateTime();

  // PDF Download function for tickets
  const downloadTicketsPDF = () => {
    toast.info('Downloading tickets...');
    generateTicketsPDF(ticketGroup, eventInfo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Close button - Fixed at top */}
        <div className="flex-shrink-0 flex justify-end p-3 sm:p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Ticket Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {/* Event Details - Centered */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{eventInfo.title}</h2>
            <p className="text-sm text-gray-600 font-mono">Event ID: {eventInfo.eventCode}</p>
          </div>

          {/* Date, Time and Location - Left aligned with spacing */}
          <div className="mb-6 text-sm text-gray-700">
            <div className="flex items-center mb-1">
              <span className="mr-2">📅</span>
              <span>{date} at {time}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span>{eventInfo.venue}</span>
            </div>
          </div>

          {/* Dotted Line Separator */}
          <div className="border-b-2 border-dotted border-gray-400 mb-6"></div>

          {/* Ticket List - With QR codes */}
          <div className="space-y-4">
            {ticketGroup.map((ticket) => {
              const isRefunded = ticket.refundStatus === 'full' || ticket.checkInStatus === 'cancelled';
              return (
                <div key={ticket._id} className={`flex flex-col items-center py-3 border-b last:border-0 ${isRefunded ? 'bg-red-50' : ''}`}>
                  {isRefunded && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded mb-2 text-sm font-bold">
                      ⚠️ REFUNDED - NOT VALID FOR ENTRY
                    </div>
                  )}
                  <div className="font-mono text-sm font-medium mb-1">{ticket.ticketNumber}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {ticket.ticketType.name}
                    {ticket.seats?.[0] && (
                      <span className="ml-2">
                        (Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber})
                      </span>
                    )}
                  </div>
                  <div className={`bg-white p-2 rounded border relative ${isRefunded ? 'border-red-300 opacity-40' : 'border-gray-200'}`}>
                    <QRCodeSVG 
                      value={ticket.ticketNumber}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                    {isRefunded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 text-white font-bold text-4xl rounded-full w-16 h-16 flex items-center justify-center transform rotate-12 shadow-lg">
                          ✗
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${isRefunded ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {isRefunded ? 'Not valid for entry' : 'Scan at entrance'}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Download Button - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={downloadTicketsPDF}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FaDownload className="inline mr-2" />
            Download QR Codes as PDF
          </button>
        </div>
      </div>
    </div>
  );
};


export default EnhancedMyTicketsPage;