"use client";
import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
        <span className="text-sm text-gray-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} across {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Event to View Tickets
        </label>
        <select
          id="eventSelect"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choose an event --</option>
          {events.map((event) => {
            const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
            return (
              <option key={event.id} value={event.id}>
                {event.title} - {eventDateTime.combined} at {event.venue}
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
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{eventInfo.title}</h3>
                <div className="text-sm text-gray-500 mb-3 font-mono">
                  Event ID: {eventInfo.eventCode}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">📅 Date & Time:</span><br />
                    {eventDateTime.date} at {eventDateTime.time}
                    <div className="text-xs text-gray-500 mt-1">Timezone: {timeZone}</div>
                  </div>
                  <div>
                    <span className="font-medium">📍 Venue:</span><br />
                    {eventInfo.venue}
                    {eventInfo.address && <div className="text-xs mt-1">{eventInfo.address}</div>}
                  </div>
                  <div>
                    <span className="font-medium">👤 Organizer:</span><br />
                    {eventInfo.organizer?.name || 'N/A'}
                    {eventInfo.organizer?.email && <div className="text-xs mt-1">{eventInfo.organizer.email}</div>}
                    {eventInfo.organizer?.phone && <div className="text-xs mt-1">{eventInfo.organizer.phone}</div>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ticket Purchase Groups */}
          <div className="p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Your Purchases</h4>
            
            {selectedEventTickets.map((ticketGroup, index) => {
              const representative = ticketGroup[0];
              const totalAmount = calculateGroupTotal(ticketGroup);
              const seatInfo = formatSeats(ticketGroup);
              const refundStatus = getRefundStatus(ticketGroup);
              
              return (
                <div key={`${representative.invoiceNumber}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Purchase Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h5 className="font-semibold text-gray-900">
                          Invoice: {representative.invoiceNumber}
                        </h5>
                        {refundStatus && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${refundStatus.type === 'full' ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-100'}`}>
                            {refundStatus.text}
                          </span>
                        )}
                      </div>

                      {/* Purchase Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Tickets:</span>
                          <div className="text-gray-900">
                            {(() => {
                              const typeGroups = groupTicketsByType(ticketGroup);
                              return typeGroups.map((group, index) => (
                                <span key={group.name}>
                                  {group.count} x {group.name}
                                  {index < typeGroups.length - 1 ? ', ' : ''}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Seats:</span>
                          <div className="text-gray-900">{seatInfo}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Purchase Date:</span>
                          <div className="text-gray-900">{new Date(representative.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          setSelectedTicketGroup(ticketGroup);
                          setShowTicketsModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
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
        </div>
      </div>
    </div>
  );
};


export default EnhancedMyTicketsPage;