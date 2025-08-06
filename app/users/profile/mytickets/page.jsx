"use client";
import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import jsPDF from 'jspdf';

const EnhancedMyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTickets, setSelectedEventTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState(null);
  const [showTicketsModal, setShowTicketsModal] = useState(false);

  // Fetch all user tickets
  useEffect(() => {
    const fetchAllMyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/paid/my-paid-tickets`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP Error ${response.status}`);
        }

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Tickets</h2>
        <span className="text-xs sm:text-sm text-gray-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} across {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <label htmlFor="eventSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          Select Event to View Tickets
        </label>
        <select
          id="eventSelect"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choose an event --</option>
          {events.map((event) => {
            const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
            return (
              <option key={event.id} value={event.id}>
                {event.title} - {eventDateTime.combined}
              </option>
            );
          })}
        </select>
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
              <div className="bg-gray-50 border-b">
                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Event Details Container - 2 columns on desktop */}
                    <div className="md:col-span-2 bg-white rounded-lg p-4">
                      {/* Event Title and ID in one line */}
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                        {eventInfo.title} ({eventInfo.eventCode})
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
                            {eventDateTime.date} {eventDateTime.time} {timeZone}
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
                            {eventInfo.venue}
                          </span>
                        </div>

                        {/* Address */}
                        {eventInfo.address && (
                          <div className="flex items-start gap-3">
                            <div className="text-gray-500 mt-0.5">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-sm sm:text-base text-gray-700">
                              {eventInfo.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Organized By Container - 1 column on desktop */}
                    <div className="md:col-span-1 bg-white rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Organizer:</span>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {eventInfo.organizer?.name || 'Event Organizer'}
                          </p>
                        </div>
                        
                        {eventInfo.organizer?.contact && (
                          <div>
                            <span className="text-sm text-gray-600">Contact:</span>
                            <p className="text-sm text-gray-900">
                              {eventInfo.organizer.contact}
                            </p>
                          </div>
                        )}
                        
                        {eventInfo.organizer?.email && (
                          <div>
                            <span className="text-sm text-gray-600">Email-id:</span>
                            <p className="text-sm text-gray-900 break-all">
                              {eventInfo.organizer.email}
                            </p>
                          </div>
                        )}
                        
                        {eventInfo.organizer?.abn && (
                          <div>
                            <span className="text-sm text-gray-600">ABN:</span>
                            <p className="text-sm text-gray-900">
                              {eventInfo.organizer.abn}
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

          {/* Ticket Purchase Groups */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Your Purchases</h4>
            
            {selectedEventTickets.map((ticketGroup, index) => {
              const representative = ticketGroup[0];
              const totalAmount = calculateGroupTotal(ticketGroup);
              const seatInfo = formatSeats(ticketGroup);
              const refundStatus = getRefundStatus(ticketGroup);
              
              return (
                <div key={`${representative.invoiceNumber}-${index}`} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      {/* Purchase Header */}
                      <div className="flex items-center gap-3 mb-2 sm:mb-3">
                        <h5 className="text-sm sm:text-base font-semibold text-gray-900">
                          Invoice: {representative.invoiceNumber}
                        </h5>
                        {refundStatus && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${refundStatus.type === 'full' ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-100'}`}>
                            {refundStatus.text}
                          </span>
                        )}
                      </div>

                      {/* Purchase Details Grid */}
                      <div className="space-y-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3 sm:space-y-0 text-xs sm:text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Tickets:</span>
                          <span className="ml-1 text-gray-900">
                            {(() => {
                              const typeGroups = groupTicketsByType(ticketGroup);
                              return typeGroups.map((group, index) => (
                                <span key={group.name}>
                                  {group.count} x {group.name}
                                  {index < typeGroups.length - 1 ? ', ' : ''}
                                </span>
                              ));
                            })()}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Seats:</span>
                          <span className="ml-1 text-gray-900">{seatInfo}</span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Purchase Date:</span>
                          <span className="ml-1 text-gray-900">{new Date(representative.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="sm:ml-4">
                      <button
                        onClick={() => {
                          setSelectedTicketGroup(ticketGroup);
                          setShowTicketsModal(true);
                        }}
                        className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        🎫 View Tickets
                      </button>
                    </div>
                  </div>
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
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const leftMargin = 20;
    const rightMargin = 20;
    let currentY = 20;
    
    // Event Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(eventInfo.title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Event ID
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Event ID: ${eventInfo.eventCode}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
    
    // Separator line
    doc.setDrawColor(150);
    doc.line(leftMargin, currentY, pageWidth - rightMargin, currentY);
    currentY += 15;
    
    // Event details header
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${date} at ${time}`, leftMargin, currentY);
    currentY += 6;
    doc.text(`Venue: ${eventInfo.venue}`, leftMargin, currentY);
    if (eventInfo.address) {
      currentY += 6;
      doc.text(`Address: ${eventInfo.address}`, leftMargin, currentY);
    }
    currentY += 6;
    doc.text(`From: ${eventInfo.organizer?.name || 'Event Organizer'}`, leftMargin, currentY);
    if (eventInfo.organizer?.abn) {
      currentY += 6;
      doc.text(`ABN: ${eventInfo.organizer.abn}`, leftMargin, currentY);
    }
    currentY += 15;
    
    // Tickets header
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TICKETS', leftMargin, currentY);
    currentY += 10;
    
    // Process each ticket - simple format
    doc.setFontSize(11);
    ticketGroup.forEach((ticket, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      // Ticket line
      doc.setFont(undefined, 'normal');
      let ticketLine = ticket.ticketNumber;
      
      // Add spacing to align ticket type
      const ticketNumWidth = doc.getTextWidth(ticket.ticketNumber);
      const desiredPosition = 80; // Position for ticket type
      const spacesNeeded = Math.max(1, Math.floor((desiredPosition - leftMargin - ticketNumWidth) / doc.getTextWidth(' ')));
      ticketLine += ' '.repeat(spacesNeeded);
      
      // Add ticket type
      ticketLine += ticket.ticketType.name;
      
      // Add seat if exists
      if (ticket.seats && ticket.seats.length > 0) {
        ticketLine += ` (Seat: ${ticket.seats[0].row}-${ticket.seats[0].seatNumber})`;
      }
      
      doc.text(ticketLine, leftMargin, currentY);
      currentY += 8;
    });
    
    // Footer
    currentY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0);
    
    // Save the PDF
    const fileName = `Tickets_${eventInfo.eventCode}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Ticket Content - Designed like a movie ticket */}
        <div className="px-8 pb-8">
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

          {/* Ticket List - Simple format */}
          <div className="space-y-2">
            {ticketGroup.map((ticket) => (
              <div key={ticket._id} className="flex justify-between items-center py-1">
                <span className="font-mono text-sm font-medium">{ticket.ticketNumber}</span>
                <span className="text-sm text-gray-700">
                  {ticket.ticketType.name}
                  {ticket.seats?.[0] && (
                    <span className="ml-2 text-gray-600">
                      (Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Download Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={downloadTicketsPDF}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📥 Download Tickets as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default EnhancedMyTicketsPage;