
"use client";
import React, { useState, useEffect } from 'react';

const EnhancedMyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTickets, setSelectedEventTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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
          
          // Extract unique events from tickets using eventSnapshot
          const uniqueEvents = data.tickets.reduce((acc, ticket) => {
            const eventKey = ticket.event?._id || ticket.eventSnapshot?.eventCode;
            if (eventKey && !acc.find(e => e.id === eventKey)) {
              acc.push({
                id: eventKey,
                title: ticket.eventSnapshot?.title || ticket.event?.title,
                dateTime: ticket.eventSnapshot?.dateTime || ticket.event?.dateTime,
                venue: ticket.eventSnapshot?.venue || ticket.event?.venue,
                eventCode: ticket.eventSnapshot?.eventCode,
                organizer: ticket.eventSnapshot?.organizer
              });
            }
            return acc;
          }, []);

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
        const ticketEventId = ticket.event?._id || ticket.eventSnapshot?.eventCode;
        return ticketEventId === selectedEventId;
      });
      
      // Group tickets by invoice number for purchase groups
      const groupedTickets = groupTicketsByInvoice(eventTickets);
      setSelectedEventTickets(groupedTickets);
    } else {
      setSelectedEventTickets([]);
    }
  }, [selectedEventId, tickets]);

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

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'checked-in': return 'text-blue-600 bg-blue-100';
      case 'refunded': return 'text-red-600 bg-red-100';
      case 'held': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get refund status
  const getRefundStatus = (ticketGroup) => {
    const refundedTickets = ticketGroup.filter(t => t.refundStatus === 'refunded');
    if (refundedTickets.length === 0) return null;
    
    if (refundedTickets.length === ticketGroup.length) {
      return { type: 'full', text: 'Fully Refunded' };
    } else {
      return { type: 'partial', text: `${refundedTickets.length}/${ticketGroup.length} Refunded` };
    }
  };

  // Handle view invoice
  const handleViewInvoice = (ticketGroup) => {
    setSelectedTicketGroup(ticketGroup);
    setShowInvoiceModal(true);
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
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {new Date(event.dateTime).toLocaleDateString()} at {event.venue}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Event Tickets */}
      {selectedEventId && selectedEventTickets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            const firstTicket = selectedEventTickets[0][0]; // First ticket of first group
            const eventInfo = firstTicket.eventSnapshot || selectedEvent;
            
            return (
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{eventInfo.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">📅 Date & Time:</span><br />
                    {new Date(eventInfo.dateTime).toLocaleDateString()} at {new Date(eventInfo.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          Purchase #{index + 1}
                        </h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(representative.status)}`}>
                          {representative.status}
                        </span>
                        {refundStatus && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${refundStatus.type === 'full' ? 'text-red-600 bg-red-100' : 'text-orange-600 bg-orange-100'}`}>
                            {refundStatus.text}
                          </span>
                        )}
                      </div>

                      {/* Purchase Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Invoice Number:</span>
                          <div className="text-gray-900 font-mono text-xs">{representative.invoiceNumber}</div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Tickets:</span>
                          <div className="text-gray-900">{ticketGroup.length} x {representative.ticketType.name}</div>
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

                      {/* Buyer Information */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Buyer:</span>
                            <div className="text-gray-900">{representative.buyer?.firstName} {representative.buyer?.lastName}</div>
                            <div className="text-gray-600 text-xs">{representative.buyer?.email}</div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Total Amount:</span>
                            <div className="text-lg font-bold text-green-600">${totalAmount.toFixed(2)}</div>
                            {ticketGroup.length > 1 && (
                              <div className="text-xs text-gray-500">${(totalAmount / ticketGroup.length).toFixed(2)} per ticket</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Individual Tickets Summary */}
                      {ticketGroup.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <details className="group">
                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                              View Individual Tickets ({ticketGroup.length})
                            </summary>
                            <div className="mt-2 space-y-2">
                              {ticketGroup.map((ticket) => (
                                <div key={ticket._id} className="bg-gray-50 rounded p-2 text-xs">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-medium">{ticket.ticketNumber}</span>
                                      {ticket.seats?.[0] && (
                                        <span className="ml-2 text-gray-600">• Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber}</span>
                                      )}
                                    </div>
                                    <span className="text-green-600 font-medium">${ticket.priceDetails?.totalPrice || ticket.ticketType?.price}</span>
                                  </div>
                                  {ticket.attendees?.[0] && (
                                    <div className="text-gray-600 mt-1">Attendee: {ticket.attendees[0].name}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="ml-4">
                      <button
                        onClick={() => handleViewInvoice(ticketGroup)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        📄 View Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && selectedTicketGroup && (
        <InvoiceModal
          ticketGroup={selectedTicketGroup}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedTicketGroup(null);
          }}
        />
      )}
    </div>
  );
};

// Invoice Modal Component
const InvoiceModal = ({ ticketGroup, onClose }) => {
  const representative = ticketGroup[0];
  const eventInfo = representative.eventSnapshot || representative.event;
  const totalAmount = ticketGroup.reduce((sum, ticket) => sum + (ticket.priceDetails?.totalPrice || ticket.ticketType?.price || 0), 0);

  const formatSeats = (ticket) => {
    if (!ticket.seats || ticket.seats.length === 0) return 'General Admission';
    return ticket.seats.map(seat => `${seat.row}-${seat.seatNumber}`).join(', ');
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
          {/* Invoice Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-gray-600 mt-1">Invoice #{representative.invoiceNumber}</p>
                <p className="text-sm text-gray-500">Ticket #{representative.ticketNumber}{ticketGroup.length > 1 ? ` (+${ticketGroup.length - 1} more)` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Issue Date</p>
                <p className="font-medium">{new Date(representative.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 mt-2">Payment Date</p>
                <p className="font-medium">{new Date(representative.paymentDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Organizer and Buyer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Event Organizer</h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{eventInfo.organizer?.name || 'Event Organizer'}</p>
                <p className="text-gray-600">{eventInfo.organizer?.email || 'N/A'}</p>
                {eventInfo.organizer?.phone && (
                  <p className="text-gray-600">{eventInfo.organizer.phone}</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Bill To</h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{representative.buyer?.firstName} {representative.buyer?.lastName}</p>
                <p className="text-gray-600">{representative.buyer?.email}</p>
                {representative.buyer?.phone && (
                  <p className="text-gray-600">{representative.buyer.phone}</p>
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
                <p className="text-gray-900">{eventInfo.title}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Event Code</p>
                <p className="text-gray-900 font-mono">{eventInfo.eventCode}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Date & Time</p>
                <p className="text-gray-900">
                  {new Date(eventInfo.dateTime).toLocaleDateString()} at {new Date(eventInfo.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Venue</p>
                <p className="text-gray-900">{eventInfo.venue}</p>
              </div>
              {eventInfo.address && (
                <div className="md:col-span-2">
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-gray-900">{eventInfo.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Items Table */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">Ticket Details</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Ticket Number</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Seat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Attendee</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketGroup.map((ticket, index) => (
                    <tr key={ticket._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-mono border-b">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 text-sm border-b">{ticket.ticketType.name}</td>
                      <td className="px-4 py-3 text-sm border-b">{formatSeats(ticket)}</td>
                      <td className="px-4 py-3 text-sm border-b">{ticket.attendees?.[0]?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-right border-b">${(ticket.priceDetails?.totalPrice || ticket.ticketType?.price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="font-medium">Subtotal:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t border-gray-300">
                <span>Total Paid:</span>
                <span className="text-green-600">${totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Platform fees automatically deducted by payment processor
              </p>
            </div>
          </div>

          {/* Payment Information */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Payment Method</p>
                <p className="text-gray-900">Credit Card</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Transaction ID</p>
                <p className="text-gray-900 font-mono text-xs">{representative.paymentIntentId}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  representative.status === 'confirmed' ? 'text-green-600 bg-green-100' :
                  representative.status === 'refunded' ? 'text-red-600 bg-red-100' :
                  'text-gray-600 bg-gray-100'
                }`}>
                  {representative.status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📄 Download PDF
            </button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              📧 Email Invoice
            </button>
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              🎫 View Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMyTicketsPage;