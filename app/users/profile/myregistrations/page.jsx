'use client';

import React, { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import LoadingSpinner from '@/components/LoadingSpinner';
import axios from '@/utils/axiosConfig';
import { FaCalendarAlt, FaMapMarkedAlt, FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import { GiTheaterCurtains } from 'react-icons/gi';

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];

const BackButton = () => (
  <Link
    href="/users/profile"
    className="inline-flex items-center gap-1 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-3 py-1 md:px-4 md:py-2 rounded-full font-semibold text-xs md:text-base transition-colors"
  >
    <span>&lt;</span>
    <span>back</span>
  </Link>
);

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
  const [expandedRegistrations, setExpandedRegistrations] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { registrationId: 'attendees' | 'attendeeInfo' }
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

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

  // Auto-select the next upcoming event once after events load.
  // "Next" = events from today onwards, earliest dateTime wins.
  // Runs once per mount; respects manual selection / clearing afterwards.
  useEffect(() => {
    if (hasAutoSelected) return;
    if (!events || events.length === 0) return;
    if (selectedEventId) {
      setHasAutoSelected(true);
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcoming = events
      .filter((ev) => ev.dateTime && new Date(ev.dateTime) >= startOfToday)
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if (upcoming.length > 0) {
      setSelectedEventId(upcoming[0].id);
    }
    setHasAutoSelected(true);
  }, [events, selectedEventId, hasAutoSelected]);

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

  // Handle tab click
  const handleTabClick = (registrationId, tab) => {
    const isCurrentlyExpanded = expandedRegistrations.has(registrationId);
    const currentTab = activeTab[registrationId] || 'attendees';
    
    if (!isCurrentlyExpanded) {
      // If not expanded, expand and set the tab
      const newExpanded = new Set(expandedRegistrations);
      newExpanded.add(registrationId);
      setExpandedRegistrations(newExpanded);
      setActiveTab({ ...activeTab, [registrationId]: tab });
    } else if (currentTab === tab) {
      // If clicking the same tab, collapse
      const newExpanded = new Set(expandedRegistrations);
      newExpanded.delete(registrationId);
      setExpandedRegistrations(newExpanded);
    } else {
      // If clicking different tab, just switch tabs
      setActiveTab({ ...activeTab, [registrationId]: tab });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading your registrations...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No registrations state
  if (registrations.length === 0) {
    return (
      <div className="space-y-4">
        <BackButton />
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Registrations Yet</h2>
          <p className="text-gray-600 mb-4">You haven't registered for any free events yet.</p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Top row: back button on left, title centered */}
      <div className="relative flex items-center">
        <BackButton />
        <h2 className="absolute left-1/2 -translate-x-1/2 text-base sm:text-lg font-bold text-forest-900">
          My RSVPs
        </h2>
      </div>

      {/* Event Selector with Date Filter */}
      <div className="bg-white rounded-lg p-4">
        <div className="space-y-3">
          {/* Combined Date Filter and Event Selector */}
          <div className="flex flex-col sm:flex-row sm:gap-4">
            {/* Date Filter - Compact */}
            <div className="sm:w-1/3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date Range
              </label>
              <Listbox value={dateFilter} onChange={setDateFilter}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                    <span className="block truncate text-slate-900">
                      {DATE_FILTER_OPTIONS.find((o) => o.value === dateFilter)?.label}
                    </span>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </ListboxButton>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions
                      anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                      className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                    >
                      {DATE_FILTER_OPTIONS.map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Event Selector - Compact */}
            <div className="flex-1 mt-3 sm:mt-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Select Event
              </label>
              {(() => {
                const selectedEvent = events.find((e) => e.id === selectedEventId);
                return (
                  <Listbox value={selectedEventId} onChange={setSelectedEventId}>
                    <div className="relative">
                      <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                        <span className={`block truncate ${selectedEvent ? 'text-slate-900' : 'text-slate-500'}`}>
                          {selectedEvent
                            ? `${selectedEvent.eventCode} - ${selectedEvent.title}`
                            : 'Choose an event'}
                        </span>
                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </ListboxButton>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions
                          anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                          className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                        >
                          <ListboxOption
                            value=""
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  Choose an event
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                          {filteredEvents.length === 0 ? (
                            <div className="px-4 py-2.5 text-sm text-slate-400">
                              No events found
                            </div>
                          ) : (
                            filteredEvents.map((event) => {
                              const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                              return (
                                <ListboxOption
                                  key={event.id}
                                  value={event.id}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                        {event.eventCode} - {event.title} - {eventDateTime.date} - {eventDateTime.time}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </span>
                                      )}
                                    </>
                                  )}
                                </ListboxOption>
                              );
                            })
                          )}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
                );
              })()}

              {filteredEvents.length === 0 && events.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No events in selected range. Try a different date filter.
                </p>
              )}
            </div>
          </div>

          {/* Data retention hint */}
          <p className="text-xs text-forest-900">
            Please save your RSVPs. Events older than 2 years will be deleted.
          </p>
        </div>
      </div>

      {/* Selected Event Details & Registrations */}
      {selectedEventId && selectedEventRegistrations.length > 0 && (
        <div>
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            const firstRegistration = selectedEventRegistrations[0];
            const eventInfo = firstRegistration.eventSnapshot || selectedEvent;
            const timeZone = eventInfo.timeZone;
            const eventDateTime = formatEventDateTime(eventInfo.dateTime, timeZone);
            
            return (
              <div className="p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {/* Event Title */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {eventInfo.title}
                  </h3>
                  
                  {/* Event Code */}
                  <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                    {eventInfo.eventCode || selectedEvent?.eventCode}
                  </span>
                  
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <FaCalendarAlt className="text-forest-900 shrink-0" size={13} title="Date & Time" aria-label="Date & Time" />
                    <span>{eventDateTime.combined} ({timeZone})</span>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <GiTheaterCurtains className="text-forest-900 shrink-0" size={15} title="Venue" aria-label="Venue" />
                    <span>{eventInfo.venue}</span>
                  </div>

                  {/* Address - Full width on new line if exists */}
                  {eventInfo.address && (() => {
                    const addressText = typeof eventInfo.address === 'string'
                      ? eventInfo.address
                      : eventInfo.address.formattedAddress ||
                        `${eventInfo.address.street || ''} ${eventInfo.address.suburb || ''} ${eventInfo.address.state || ''} ${eventInfo.address.postalCode || ''}`.trim();
                    return (
                      <div className="w-full flex items-center gap-2 text-slate-700 text-xs sm:text-sm min-w-0">
                        <FaMapMarkedAlt className="text-forest-900 shrink-0" size={13} title="Address" aria-label="Address" />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-slate-900 underline break-words"
                        >
                          {addressText}
                        </a>
                      </div>
                    );
                  })()}

                  {/* Organizer Info - Full width on new line */}
                  <div className="w-full pt-3 mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaUser className="text-forest-900 shrink-0" size={13} title="Organizer" aria-label="Organizer" />
                      <span>{eventInfo.organizer?.name || 'Event Organizer'}</span>
                    </div>
                    {eventInfo.organizer?.phone && (
                      <div className="flex items-center gap-2 min-w-0">
                        <FaPhone className="text-forest-900 shrink-0" size={13} title="Phone" aria-label="Phone" />
                        <a href={`tel:${eventInfo.organizer.phone}`} className="hover:text-slate-900 underline">
                          {eventInfo.organizer.phone}
                        </a>
                      </div>
                    )}
                    {eventInfo.organizer?.email && (
                      <div className="flex items-center gap-2 min-w-0">
                        <FaEnvelope className="text-forest-900 shrink-0" size={13} title="Email" aria-label="Email" />
                        <a href={`mailto:${eventInfo.organizer.email}`} className="hover:text-slate-900 underline break-all">
                          {eventInfo.organizer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Registration Details */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Your Registration Details</h4>
            
            {selectedEventRegistrations.map((registration, index) => {
              const isExpanded = expandedRegistrations.has(registration._id);
              const hasFormResponses = registration.formResponses && registration.formResponses.length > 0;
              
              return (
                <div key={registration._id} className="overflow-hidden">
                  {/* Registration Header */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm sm:text-base">
                          {registration.registrationNumber}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                          {registration.status === 'checkedin' ? '✓ Checked in' : 'Registered'}
                        </span>
                      </div>

                      {registration.status !== 'checkedin' && (
                        <button
                          type="button"
                          onClick={() => handleUnregister(registration.event)}
                          disabled={actionLoading}
                          className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Cancelling...' : 'Cancel registration'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm mt-2">
                      <span className="font-medium text-slate-700">
                        {registration.attendees.length} Attendee{registration.attendees.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">
                        Registered: {new Date(registration.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tab Buttons */}
                  <div className="border-t border-gray-200 bg-gray-50 px-2 sm:px-4 py-2">
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={() => handleTabClick(registration._id, 'attendees')}
                        className={`
                          px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                          ${isExpanded && (activeTab[registration._id] || 'attendees') === 'attendees'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="sm:hidden">Attendees</span>
                        <span className="hidden sm:inline">View Attendees</span>
                      </button>
                      {hasFormResponses && (
                        <button
                          onClick={() => handleTabClick(registration._id, 'attendeeInfo')}
                          className={`
                            px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                            ${isExpanded && activeTab[registration._id] === 'attendeeInfo'
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <span className="sm:hidden">Attendee Info</span>
                          <span className="hidden sm:inline">View Attendee Information</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Tab Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Attendees Tab */}
                      {(activeTab[registration._id] || 'attendees') === 'attendees' && (
                        <div className="p-3 sm:p-4 bg-white">
                          <div className="space-y-2">
                            {registration.attendees.map((attendee, idx) => (
                              <div key={idx} className="border-b last:border-0 pb-2 last:pb-0">
                                <div className="text-sm sm:text-base font-medium text-gray-900">
                                  {attendee.name}
                                </div>
                                {attendee.age && (
                                  <div className="text-xs sm:text-sm text-gray-600">
                                    Age: {attendee.age}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Attendee Information Tab */}
                      {activeTab[registration._id] === 'attendeeInfo' && hasFormResponses && (
                        <div className="p-3 sm:p-4 bg-white">
                          <div className="space-y-3">
                            {registration.formResponses.map((response, idx) => (
                              <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                                <div className="font-medium text-gray-700 text-sm mb-1">
                                  {response.fieldName}:
                                </div>
                                <div className="text-gray-600 text-sm whitespace-pre-line break-words pl-4">
                                  {response.response}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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