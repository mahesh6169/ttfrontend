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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  // 🆕 NEW: Add invoice state
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  // 🆕 NEW: Add tickets modal state
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
          
          // Extract unique events from tickets using eventSnapshot only
          const uniqueEvents = data.tickets.reduce((acc, ticket) => {
            const eventKey = ticket.event || ticket.eventSnapshot?.eventCode; // event is now just eventId string
            if (eventKey && !acc.find(e => e.id === eventKey)) {
              acc.push({
                id: eventKey,
                title: ticket.eventSnapshot?.title,
                dateTime: ticket.eventSnapshot?.dateTime,
                venue: ticket.eventSnapshot?.venue,
                eventCode: ticket.eventSnapshot?.eventCode,
                organizer: ticket.eventSnapshot?.organizer,
                timeZone: ticket.eventSnapshot?.timeZone
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
    const refundedTickets = ticketGroup.filter(t => t.refundStatus === 'refunded');
    if (refundedTickets.length === 0) return null;
    
    if (refundedTickets.length === ticketGroup.length) {
      return { type: 'full', text: 'Fully Refunded' };
    } else {
      return { type: 'partial', text: `${refundedTickets.length}/${ticketGroup.length} Refunded` };
    }
  };

  // 🆕 NEW: Handle view invoice with API call
  const handleViewInvoice = async (ticketGroup) => {
    const representative = ticketGroup[0];
    const invoiceNumber = representative.invoiceNumber;
    
    setInvoiceLoading(true);
    setInvoiceError(null);
    setSelectedTicketGroup(ticketGroup);
    setShowInvoiceModal(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/invoices/${invoiceNumber}`,
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
        setInvoiceData(data.invoice);
        console.log('✅ Invoice data loaded:', data.invoice.invoiceNumber);
      } else {
        throw new Error(data.message || 'Failed to load invoice');
      }

    } catch (err) {
      console.error('❌ Error fetching invoice:', err);
      setInvoiceError(err.message);
    } finally {
      setInvoiceLoading(false);
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
            const firstTicket = selectedEventTickets[0][0]; // First ticket of first group
            const eventInfo = firstTicket.eventSnapshot || selectedEvent;
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

                    {/* Action Buttons */}
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleViewInvoice(ticketGroup)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        📄 View Invoice
                      </button>
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

      {/* Invoice Modal */}
      {showInvoiceModal && selectedTicketGroup && (
        <InvoiceModal
          ticketGroup={selectedTicketGroup}
          invoiceData={invoiceData}
          invoiceLoading={invoiceLoading}
          invoiceError={invoiceError}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedTicketGroup(null);
            setInvoiceData(null);
            setInvoiceError(null);
          }}
        />
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

// Enhanced Invoice Modal Component with proper Purchase and Refund Details tables
const InvoiceModal = ({ ticketGroup, invoiceData, invoiceLoading, invoiceError, onClose }) => {
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

  // Helper function to group refunds by transaction for Refund Details table
  const groupRefundsByTransaction = (refunds) => {
    const grouped = refunds.reduce((acc, refund) => {
      const refundId = refund.stripeRefundId;
      if (!acc[refundId]) {
        acc[refundId] = {
          stripeRefundId: refundId,
          refundDate: refund.refundDate,
          refundType: refund.refundType,
          reason: refund.reason,
          tickets: [],
          totalAmount: refund.refundAmount
        };
      }
      
      // Handle both individual and group refunds
      if (refund.refundType === 'group' && refund.ticketNumbers) {
        // Group refund: multiple tickets in one refund
        refund.ticketNumbers.forEach(ticketNumber => {
          acc[refundId].tickets.push({
            ticketNumber: ticketNumber,
            amount: refund.refundAmount / refund.ticketNumbers.length // Split amount evenly
          });
        });
      } else if (refund.refundType === 'individual' && refund.ticketNumber) {
        // Individual refund: single ticket
        acc[refundId].tickets.push({
          ticketNumber: refund.ticketNumber,
          amount: refund.refundAmount
        });
      }
      
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => 
      new Date(b.refundDate) - new Date(a.refundDate)
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
            ✕
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
                  <h4 className="font-semibold text-gray-900 mb-3">Event Organizer</h4>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{invoiceData.event.organizer?.name || 'Event Organizer'}</p>
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

              {/* ✅ ENHANCED: Purchase Details Table */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Purchase Details | {formatDate(invoiceData.payment.paymentDate)}</h4>
                
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
                        <td className="px-4 py-3 text-sm text-right font-bold">Total Paid: ${invoiceData.amounts.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Policy Notes Below Table */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                    {invoiceData.gstIncluded && (
                      <p>* GST included</p>
                    )}
                    {invoiceData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                      <p>* Processing fees are non-refundable</p>
                    )}
                    {invoiceData.refundPolicy?.policyText && (
                      <p>* {invoiceData.refundPolicy.policyText}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ ENHANCED: Refund Details Table (only if refunds exist) */}
              {invoiceData.refunds && invoiceData.refunds.length > 0 && (
                <div className="mb-8">
                  {(() => {
                    const refundGroups = groupRefundsByTransaction(invoiceData.refunds);
                    return refundGroups.map((refundGroup, groupIndex) => (
                      <div key={refundGroup.stripeRefundId} className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Refund Details | {formatDate(refundGroup.refundDate)}</h4>
                        
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
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  📄 Download PDF
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  📧 Email Invoice
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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