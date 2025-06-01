'use client';
import React, { useState, useEffect } from 'react';

const MyAllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Fetch all user tickets across all events
  useEffect(() => {
    const fetchAllMyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching all tickets for user');
        console.log('- API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

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

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (!response.ok) {
          console.error('❌ API Error:', data);
          throw new Error(data.message || `HTTP Error ${response.status}`);
        }

        if (data.success) {
          setTickets(data.tickets);
          console.log(`✅ Found ${data.count} total tickets`);
        } else {
          throw new Error(data.message || 'API returned success: false');
        }

      } catch (err) {
        console.error('❌ Error fetching tickets:', err);
        setError(`${err.message} (Check console for details)`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMyTickets();
  }, []);

  // Helper function to format seat information for a group
  const formatGroupSeatInfo = (ticketGroup) => {
    if (ticketGroup.length === 1) {
      return formatSeatInfo(ticketGroup[0]);
    }

    const allSeats = ticketGroup.flatMap(ticket => ticket.seats || []);
    
    if (allSeats.length === 0) {
      return `General Admission (${ticketGroup.length} tickets)`;
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

  // Helper to check if numbers are consecutive
  const areConsecutive = (numbers) => {
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) return false;
    }
    return true;
  };

  // Helper function to get total price for a group
  const getGroupTotalPrice = (ticketGroup) => {
    return ticketGroup.reduce((sum, ticket) => sum + ticket.priceDetails.totalPrice, 0);
  };

  // Helper function to format ticket numbers for a group
  const formatGroupTicketNumbers = (ticketGroup) => {
    if (ticketGroup.length === 1) {
      return ticketGroup[0].ticketNumber;
    }
    return `${ticketGroup.length} tickets: ${ticketGroup[0].ticketNumber}${ticketGroup.length > 1 ? ' +' + (ticketGroup.length - 1) + ' more' : ''}`;
  };

  // Helper function to format seat information
  const formatSeatInfo = (ticket) => {
    if (!ticket.seats || ticket.seats.length === 0) {
      return 'General Admission';
    }

    if (ticket.seats.length === 1) {
      return `${ticket.seats[0].row}-${ticket.seats[0].seatNumber}`;
    }

    if (ticket.seats.length <= 3) {
      return ticket.seats.map(seat => `${seat.row}-${seat.seatNumber}`).join(', ');
    }

    // For many seats, show summary
    const rows = [...new Set(ticket.seats.map(seat => seat.row))];
    if (rows.length === 1) {
      return `Row ${rows[0]} (${ticket.seats.length} seats)`;
    }
    return `${ticket.seats.length} seats across ${rows.length} rows`;
  };

  // Helper function to determine if seat changes are allowed
  const canChangeSeat = (ticket, event) => {
    const eventDate = new Date(event.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    
    return (
      ticket.status === 'confirmed' &&
      hoursUntilEvent > 2 && // Allow changes until 2 hours before event
      ticket.seats && ticket.seats.length > 0 // Only for seated events
    );
  };

  // Handle view ticket details (now handles both single tickets and groups)
  const handleViewTicket = (ticketOrGroup) => {
    if (Array.isArray(ticketOrGroup)) {
      // Handle group of tickets - could show a group modal or individual selection
      setSelectedTicket(ticketOrGroup);
    } else {
      // Handle single ticket
      setSelectedTicket(ticketOrGroup);
    }
    setShowTicketModal(true);
  };

  // Handle change seat (now handles both single tickets and groups)
  const handleChangeSeat = (ticketOrGroup) => {
    if (Array.isArray(ticketOrGroup)) {
      console.log('🔄 Change seats for ticket group:', ticketOrGroup.map(t => t.ticketNumber));
      // TODO: Implement group seat change modal
      alert(`Group seat change for ${ticketOrGroup.length} tickets coming soon!`);
    } else {
      console.log('🔄 Change seat for ticket:', ticketOrGroup.ticketNumber);
      // TODO: Implement single seat change modal
      alert('Seat change functionality coming soon!');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'checked-in': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get event timing info
  const getEventTiming = (dateTime) => {
    const eventDate = new Date(dateTime);
    const now = new Date();
    const diffHours = (eventDate - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { text: 'Past Event', color: 'text-gray-500', urgent: false };
    } else if (diffHours < 24) {
      return { text: 'Today', color: 'text-red-600', urgent: true };
    } else if (diffHours < 168) { // 7 days
      return { text: 'This Week', color: 'text-orange-600', urgent: true };
    } else {
      return { text: 'Upcoming', color: 'text-green-600', urgent: false };
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your tickets...</span>
      </div>
    );
  }

  // Handle error state
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

  // Handle no tickets
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

  // Group tickets by event and then by purchase groups
  const ticketsByEvent = tickets.reduce((acc, ticket) => {
    const eventId = ticket.event._id;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: ticket.event,
        ticketGroups: []
      };
    }
    acc[eventId].ticketGroups.push(ticket);
    return acc;
  }, {});

  // Smart grouping logic for tickets within each event
  const groupTicketsIntelligently = (tickets) => {
    // Sort tickets by purchase date and seat
    const sortedTickets = [...tickets].sort((a, b) => {
      // First by purchase date (same purchase session)
      const dateCompare = new Date(a.createdAt) - new Date(b.createdAt);
      if (Math.abs(dateCompare) > 60000) return dateCompare; // Different if >1 minute apart
      
      // Then by seat if available
      if (a.seats?.[0] && b.seats?.[0]) {
        const seatA = `${a.seats[0].row}-${a.seats[0].seatNumber}`;
        const seatB = `${b.seats[0].row}-${b.seats[0].seatNumber}`;
        return seatA.localeCompare(seatB);
      }
      
      return 0;
    });

    const groups = [];
    let currentGroup = [];

    sortedTickets.forEach((ticket, index) => {
      if (currentGroup.length === 0) {
        currentGroup = [ticket];
        return;
      }

      const lastTicket = currentGroup[currentGroup.length - 1];
      const shouldGroup = (
        // Same ticket type
        ticket.ticketType.name === lastTicket.ticketType.name &&
        // Same purchase session (within 2 minutes)
        Math.abs(new Date(ticket.createdAt) - new Date(lastTicket.createdAt)) < 120000 &&
        // Same attendee name (or both empty)
        (ticket.attendees?.[0]?.name || '') === (lastTicket.attendees?.[0]?.name || '') &&
        // Sequential or close seats (if seated)
        areSeatsRelated(ticket.seats?.[0], lastTicket.seats?.[0])
      );

      if (shouldGroup) {
        currentGroup.push(ticket);
      } else {
        groups.push(currentGroup);
        currentGroup = [ticket];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Helper to check if seats are related (sequential or same row)
  const areSeatsRelated = (seatA, seatB) => {
    if (!seatA || !seatB) return true; // General admission tickets can group
    
    if (seatA.row !== seatB.row) return false; // Different rows
    
    const numA = parseInt(seatA.seatNumber);
    const numB = parseInt(seatB.seatNumber);
    
    return Math.abs(numA - numB) <= 3; // Within 3 seats of each other
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
        <span className="text-sm text-gray-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} across {Object.keys(ticketsByEvent).length} event{Object.keys(ticketsByEvent).length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Events with Tickets */}
      {Object.values(ticketsByEvent)
        .sort((a, b) => new Date(a.event.dateTime) - new Date(b.event.dateTime))
        .map(({ event, ticketGroups }) => {
          const timing = getEventTiming(event.dateTime);
          const intelligentGroups = groupTicketsIntelligently(ticketGroups);
          
          return (
            <div key={event._id} className={`bg-white border rounded-lg shadow-sm ${timing.urgent ? 'border-orange-200' : 'border-gray-200'}`}>
              {/* Event Header */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">{event.title}</h3>
                  <span className={`text-sm font-medium ${timing.color}`}>
                    {timing.text}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>📅 {new Date(event.dateTime).toLocaleDateString()}</span>
                  <span>🕐 {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>📍 {event.venue}</span>
                </div>
              </div>

              {/* Ticket Groups for this event */}
              <div className="px-6 pb-6 space-y-3">
                {intelligentGroups.map((ticketGroup, groupIndex) => {
                  const isGroup = ticketGroup.length > 1;
                  const representativeTicket = ticketGroup[0];
                  const seatInfo = formatGroupSeatInfo(ticketGroup);
                  const canChange = ticketGroup.every(ticket => canChangeSeat(ticket, event));
                  const groupTotal = getGroupTotalPrice(ticketGroup);
                  const ticketNumbers = formatGroupTicketNumbers(ticketGroup);
                  
                  return (
                    <div key={`group-${groupIndex}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {representativeTicket.ticketType.name}
                              {isGroup && <span className="text-sm font-normal text-gray-600">({ticketGroup.length} tickets)</span>}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(representativeTicket.status)}`}>
                              {representativeTicket.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">
                                {isGroup ? 'Tickets:' : 'Ticket:'}
                              </span> {ticketNumbers}
                            </p>
                            <p>
                              <span className="font-medium">
                                {isGroup ? 'Seats:' : 'Seat:'}
                              </span> {seatInfo}
                            </p>
                            {representativeTicket.attendees?.length > 0 && (
                              <p>
                                <span className="font-medium">Attendee:</span> {representativeTicket.attendees[0].name}
                                {isGroup && ticketGroup.length > 1 && ` (${ticketGroup.length} tickets)`}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="font-semibold text-green-600 mb-2">
                            ${groupTotal.toFixed(2)}
                            {isGroup && <span className="text-xs block text-gray-500">${representativeTicket.priceDetails.totalPrice} each</span>}
                          </p>
                          <p className="text-xs text-gray-500 mb-3">
                            {new Date(representativeTicket.paymentDate).toLocaleDateString()}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewTicket(isGroup ? ticketGroup : representativeTicket)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              👁️ {isGroup ? 'View All' : 'View'}
                            </button>
                            {canChange && (
                              <button
                                onClick={() => handleChangeSeat(isGroup ? ticketGroup : representativeTicket)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              >
                                🔄 {isGroup ? 'Change Seats' : 'Change Seat'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expandable individual tickets for groups */}
                      {isGroup && (
                        <details className="mt-3 pt-3 border-t border-gray-200">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            View individual tickets ({ticketGroup.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {ticketGroup.map((ticket, ticketIndex) => (
                              <div key={ticket._id} className="text-xs text-gray-600 bg-white rounded p-2">
                                <span className="font-medium">{ticket.ticketNumber}</span>
                                {ticket.seats?.[0] && (
                                  <span className="ml-2">• Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber}</span>
                                )}
                                <button
                                  onClick={() => handleViewTicket(ticket)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  View QR
                                </button>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketModal(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
};

// Ticket Details Modal Component
// Ticket Details Modal Component - Enhanced for groups
const TicketDetailsModal = ({ ticket, onClose }) => {
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  
  // Handle both single tickets and groups
  const isGroup = Array.isArray(ticket);
  const tickets = isGroup ? ticket : [ticket];
  const currentTicket = tickets[selectedTicketIndex];
  
  const seatInfo = currentTicket.seats && currentTicket.seats.length > 0 
    ? currentTicket.seats.map(seat => `${seat.row}-${seat.seatNumber}`).join(', ')
    : 'General Admission';

  // Generate QR code placeholder
  const generateQRCode = (ticketNumber) => {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white" stroke="black"/>
        <text x="100" y="100" text-anchor="middle" fill="black" font-size="12">
          QR: ${ticketNumber}
        </text>
      </svg>
    `)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">
            {isGroup ? `Ticket ${selectedTicketIndex + 1} of ${tickets.length}` : 'Ticket Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Group Navigation */}
        {isGroup && tickets.length > 1 && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Select ticket to view:</span>
              <span className="text-xs text-gray-500">{tickets.length} tickets total</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {tickets.map((t, index) => (
                <button
                  key={t._id}
                  onClick={() => setSelectedTicketIndex(index)}
                  className={`px-3 py-1 text-xs rounded ${
                    index === selectedTicketIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.seats?.[0] ? `${t.seats[0].row}-${t.seats[0].seatNumber}` : `Ticket ${index + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <img
              src={generateQRCode(currentTicket.ticketNumber)}
              alt="Ticket QR Code"
              className="mx-auto mb-2 border"
            />
            <p className="text-sm text-gray-600">Show this QR code at the event</p>
          </div>

          {/* Event Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">{currentTicket.event.title}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>📅 {new Date(currentTicket.event.dateTime).toLocaleDateString()}</p>
              <p>🕐 {new Date(currentTicket.event.dateTime).toLocaleTimeString()}</p>
              <p>📍 {currentTicket.event.venue}</p>
              {currentTicket.event.address && (
                <p className="text-xs">{currentTicket.event.address.formattedAddress}</p>
              )}
            </div>
          </div>

          {/* Ticket Info */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Type:</span>
              <span className="font-medium">{currentTicket.ticketType.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket Number:</span>
              <span className="font-medium font-mono">{currentTicket.ticketNumber}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Seat:</span>
              <span className="font-medium">{seatInfo}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Price:</span>
              <span className="font-medium text-green-600">${currentTicket.priceDetails.totalPrice}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{currentTicket.status}</span>
            </div>

            {currentTicket.attendees?.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Attendee:</span>
                <span className="font-medium">{currentTicket.attendees[0].name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Download {isGroup ? 'This Ticket' : 'Ticket'}
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
              Share {isGroup ? 'This Ticket' : 'Ticket'}
            </button>
          </div>

          {/* Group Actions */}
          {isGroup && (
            <div className="border-t pt-4">
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Download All ({tickets.length})
                </button>
                <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Change All Seats
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAllTickets;