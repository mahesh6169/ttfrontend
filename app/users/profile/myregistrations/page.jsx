'use client';

import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

import LoadingSpinner from '@/components/LoadingSpinner';

const MyFreeEventRegistrationsPage = () => {
  // Local state (like paid tickets page)
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFormResponses, setShowFormResponses] = useState(new Set());

  // Fetch all user registrations on mount
  useEffect(() => {
    const fetchAllMyRegistrations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/free/my-free-registrations`,
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
          setRegistrations(data.registrations);
          
          // Extract unique events from registrations using eventSnapshot
          const uniqueEvents = data.registrations.reduce((acc, registration) => {
            const eventKey = registration.event; // ObjectId string
            if (eventKey && !acc.find(e => e.id === eventKey)) {
              acc.push({
                id: eventKey,
                title: registration.eventSnapshot?.title,
                dateTime: registration.eventSnapshot?.dateTime,
                venue: registration.eventSnapshot?.venue,
                eventCode: registration.eventSnapshot?.eventCode,
                organizer: registration.eventSnapshot?.organizer,
                timeZone: registration.eventSnapshot?.timeZone,
                address: registration.eventSnapshot?.address
              });
            }
            return acc;
          }, []);

          // Sort events by date (most recent first)
          uniqueEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
          setEvents(uniqueEvents);

          console.log(`✅ Found ${data.registrations.length} registrations across ${uniqueEvents.length} events`);
        } else {
          throw new Error(data.message || 'API returned success: false');
        }

      } catch (err) {
        console.error('❌ Error fetching registrations:', err);
        setError(`${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMyRegistrations();
  }, []);

  // Filter registrations when event is selected
  useEffect(() => {
    if (selectedEventId && registrations.length > 0) {
      const eventRegistrations = registrations.filter(registration => {
        return registration.event === selectedEventId;
      });
      setSelectedEventRegistrations(eventRegistrations);
    } else {
      setSelectedEventRegistrations([]);
    }
  }, [selectedEventId, registrations]);

  // Handler for register - simplified version
  const handleRegister = async (eventId) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/free/register`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attendees: [{ name: 'Default Attendee' }] // You can enhance this later
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh registrations
        window.location.reload(); // Simple refresh, can be optimized later
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError(`Registration failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/free/unregister`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        // Refresh registrations
        window.location.reload(); // Simple refresh, can be optimized later
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError(`Unregistration failed: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

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

  // Create a lookup map for quick registered check
  const registrationMap = {};
  registrations.forEach((reg) => {
    registrationMap[reg.event] = reg;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your registrations...</span>
      </div>
    );
  }

  // Error state
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

  // No registrations state
  if (registrations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Registrations Yet</h2>
        <p className="text-gray-600 mb-4">You haven't registered for any free events yet.</p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Browse Events
        </button>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Free Event Registrations</h2>
        <span className="text-sm text-gray-500">
          {registrations.length} registration{registrations.length !== 1 ? 's' : ''} across {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Event to View Registration Details
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

      {/* Selected Event Details & Registrations */}
      {selectedEventId && selectedEventRegistrations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            const firstRegistration = selectedEventRegistrations[0];
            const eventInfo = firstRegistration.eventSnapshot || selectedEvent;
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
                    {eventInfo.address && (
                      <div className="text-xs mt-1">
                        {typeof eventInfo.address === 'string' 
                          ? eventInfo.address 
                          : eventInfo.address.formattedAddress || 
                            `${eventInfo.address.street || ''} ${eventInfo.address.suburb || ''} ${eventInfo.address.state || ''} ${eventInfo.address.postalCode || ''}`.trim()
                        }
                      </div>
                    )}
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

          {/* Registration Details */}
          <div className="p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Your Registration Details</h4>
            
            {selectedEventRegistrations.map((registration, index) => {
              return (
                <div key={registration._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Registration Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h5 className="font-semibold text-gray-900">
                          {registration.registrationNumber}
                        </h5>
                      </div>

                    {/* Registration Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Attendees:</span>
                        <div className="text-gray-900">
                          {registration.attendees.length} attendee{registration.attendees.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Registration Date:</span>
                        <div className="text-gray-900">{new Date(registration.createdAt).toLocaleDateString()}</div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <div className="text-gray-900 text-xs">{registration.email}</div>
                      </div>
                    </div>

                    {/* Form Responses (if any) - Moved before attendee list */}
                    {registration.formResponses && registration.formResponses.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const newShowFormResponses = new Set(showFormResponses);
                            if (newShowFormResponses.has(registration._id)) {
                              newShowFormResponses.delete(registration._id);
                            } else {
                              newShowFormResponses.add(registration._id);
                            }
                            setShowFormResponses(newShowFormResponses);
                          }}
                          className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          <svg 
                            className={`w-3 h-3 transition-transform ${showFormResponses.has(registration._id) ? 'rotate-90' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {showFormResponses.has(registration._id) ? 'Hide' : 'View'} Registration Details
                        </button>
                        {showFormResponses.has(registration._id) && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs space-y-1">
                            {registration.formResponses.map((response, idx) => (
                              <div key={idx}>
                                <span className="font-medium text-gray-700">{response.fieldName}:</span>
                                <span className="ml-1 text-gray-600">{response.response}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attendee List */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="font-medium text-gray-700">Attendee Details:</span>
                      <div className="mt-2 space-y-1">
                        {registration.attendees.map((attendee, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-2 text-sm">
                            <span className="font-medium">{attendee.name}</span>
                            {attendee.age && <span className="ml-2 text-gray-600">• Age: {attendee.age}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-4">
                    <button
                      onClick={() => handleUnregister(registration.event)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : '🗑️ Unregister'}
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default MyFreeEventRegistrationsPage;