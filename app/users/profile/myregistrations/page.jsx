'use client';

import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import EventSelector from '@/components/shared/EventSelector';
import DateRangeSelector from '@/components/shared/DateRangeSelector';
import LoadingSpinner from '@/components/LoadingSpinner';

const MyFreeEventRegistrationsPage = () => {
  // Local state (like paid tickets page)
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFormResponses, setShowFormResponses] = useState(new Set());
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months

  // Fetch all user registrations on mount
  useEffect(() => {
    const fetchAllMyRegistrations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/free/my-free-registrations`,
          {
            withCredentials: true,
          }
        );

        const data = response.data;

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

  // Handler for register - simplified version
  const handleRegister = async (eventId) => {
    try {
      setActionLoading(true);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/free/register`,
        {
          attendees: [{ name: 'Default Attendee' }] // You can enhance this later
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

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
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/free/unregister`,
        {
          withCredentials: true,
        }
      );

      const data = response.data;

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Free Event Registrations</h2>
        <span className="text-xs sm:text-sm text-gray-500">
          {registrations.length} registration{registrations.length !== 1 ? 's' : ''} across {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event Selector with Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="space-y-4">
          {/* Date Filter */}
          <div>
            <label htmlFor="dateFilter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter by Date Range
            </label>
            <DateRangeSelector
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>

          {/* Event Selector */}
          <div>
            <label htmlFor="eventSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Select Event to View Registration Details
            </label>
            <EventSelector
              value={selectedEventId}
              onChange={setSelectedEventId}
              events={filteredEvents}
              placeholder="-- Choose an event --"
            />
            {filteredEvents.length === 0 && events.length > 0 && (
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                No events found in the selected date range. Try selecting a different range.
              </p>
            )}
          </div>

          {/* Data Retention Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-amber-800">
              <strong>Note:</strong> Please save your RSVPs. Events older than 2 years will be deleted by admin.
            </p>
          </div>
        </div>
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
                              {typeof eventInfo.address === 'string' 
                                ? eventInfo.address 
                                : eventInfo.address.formattedAddress || 
                                  `${eventInfo.address.street || ''} ${eventInfo.address.suburb || ''} ${eventInfo.address.state || ''} ${eventInfo.address.postalCode || ''}`.trim()
                              }
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
                        
                        {eventInfo.organizer?.phone && (
                          <div>
                            <span className="text-sm text-gray-600">Mobile:</span>
                            <p className="text-sm text-gray-900">
                              {eventInfo.organizer.phone}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Registration Details */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Your Registration Details</h4>
            
            {selectedEventRegistrations.map((registration, index) => {
              return (
                <div key={registration._id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1">
                      {/* Registration Header */}
                      <div className="mb-2 sm:mb-3">
                        <h5 className="text-sm sm:text-base font-semibold text-gray-900">
                          {registration.registrationNumber}
                        </h5>
                      </div>

                    {/* Registration Details Grid */}
                    <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 text-xs sm:text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Attendees:</span>
                        <span className="ml-1 text-gray-900">
                          {registration.attendees.length} attendee{registration.attendees.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Registered:</span>
                        <span className="ml-1 text-gray-900">{new Date(registration.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Attendee Details Section - Two Column Layout */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Attendees Column */}
                        <div>
                          <h6 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Attendee Details</h6>
                          <div className="space-y-2">
                            {registration.attendees.map((attendee, idx) => (
                              <div key={idx} className="text-xs sm:text-sm">
                                <span className="font-medium text-gray-900">{attendee.name}</span>
                                {attendee.age && <span className="ml-2 text-gray-600">• Age: {attendee.age}</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Form Responses Column */}
                        <div>
                          <h6 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Attendee Registration Information</h6>
                          <div className="space-y-2 text-xs sm:text-sm">
                            {registration.formResponses && registration.formResponses.length > 0 ? (
                              registration.formResponses.map((response, idx) => (
                                <div key={idx} className="mb-2">
                                  <div className="font-medium text-gray-700">{response.fieldName}:</div>
                                  <div className="text-gray-900 pl-4 mt-1 whitespace-pre-line break-words">{response.response}</div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 italic">No additional information provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="sm:ml-4">
                    <button
                      onClick={() => handleUnregister(registration.event)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50"
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