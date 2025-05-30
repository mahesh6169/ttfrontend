// MyAllTickets.jsx - For a general "My Tickets" page

'use client';
import React, { useState, useEffect } from 'react';

const MyAllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all user tickets across all events
  useEffect(() => {
    const fetchAllMyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Debug logs
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

  // Group tickets by event
  const ticketsByEvent = tickets.reduce((acc, ticket) => {
    const eventId = ticket.event._id;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: ticket.event,
        tickets: []
      };
    }
    acc[eventId].tickets.push(ticket);
    return acc;
  }, {});

  // Render tickets grouped by event
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
        <span className="text-sm text-gray-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} across {Object.keys(ticketsByEvent).length} event{Object.keys(ticketsByEvent).length !== 1 ? 's' : ''}
        </span>
      </div>

      {Object.values(ticketsByEvent).map(({ event, tickets: eventTickets }) => (
        <div key={event._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {/* Event Header */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📅 {new Date(event.dateTime).toLocaleDateString()}</span>
              <span>🕐 {new Date(event.dateTime).toLocaleTimeString()}</span>
              <span>📍 {event.venue}</span>
            </div>
          </div>

          {/* Tickets for this event */}
          <div className="space-y-3">
            {eventTickets.map((ticket) => (
              <div key={ticket._id} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {ticket.ticketType.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Ticket: {ticket.ticketNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: <span className="capitalize font-medium">{ticket.status}</span>
                  </p>
                  {ticket.attendees?.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Attendee: {ticket.attendees[0].name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${ticket.priceDetails.totalPrice}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyAllTickets;