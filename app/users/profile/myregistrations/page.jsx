'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import axios from '@/utils/axiosConfig';
import { FaRegCalendarAlt, FaMapMarkerAlt, FaBriefcase, FaRegEnvelope, FaPhoneAlt, FaUsers } from 'react-icons/fa';
import VerticalScrollSlider from '@/components/shared/VerticalScrollSlider';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import { formatAnswer } from '@/utils/events/questionTypes';

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];

const MyFreeEventRegistrationsPage = () => {
  // Local state (like paid tickets page)
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedRegistrations, setExpandedRegistrations] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { registrationId: 'attendees' | 'attendeeInfo' }
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  const [cancelEventId, setCancelEventId] = useState(null); // Event pending cancellation (drives confirm modal)

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

  // After loading completes, scroll to top so the back button is visible
  // (covers the empty/error states where scroll position from navigation could hide it)
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [loading]);

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
      setCancelEventId(null);
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
  if (loading || showSkeleton) {
    return (
      <div className="space-y-4">
        <ProfilePageHeading title="My RSVPs" />
        {showSkeleton && <PageSkeleton variant="list" rows={6} />}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <ProfilePageHeading title="My RSVPs" />
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // No registrations state
  if (registrations.length === 0) {
    return (
      <div className="space-y-4">
        <ProfilePageHeading title="My RSVPs" />
        <EmptyState
          title="No registrations yet"
          description="You haven't registered for any free events."
          actionLabel="Browse Events"
          actionHref="/events"
        />
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6">
      <ProfilePageHeading title="My RSVPs" />

      {/* Event Selector with Date Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="space-y-3">
          {/* Combined Date Filter and Event Selector */}
          <div className="flex flex-col sm:flex-row sm:gap-4">
            {/* Date Filter - Compact */}
            <div className="sm:w-1/3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Date Range
              </label>
              <Listbox value={dateFilter} onChange={setDateFilter}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
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
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Select Event
              </label>
              {(() => {
                const selectedEvent = events.find((e) => e.id === selectedEventId);
                return (
                  <Listbox value={selectedEventId} onChange={setSelectedEventId}>
                    <div className="relative">
                      <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
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
                <p className="text-xs text-slate-500 mt-1">
                  No events in selected range. Try a different date filter.
                </p>
              )}
            </div>
          </div>

          {/* Data retention hint */}
          <p className="text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-600">Note:</span> Please save your RSVPs — events older than 2 years are removed.
          </p>
        </div>
      </div>

      {/* Selected Event Details & Registrations */}
      {selectedEventId && selectedEventRegistrations.length > 0 && (
        <div className="space-y-4">
          {/* Event Info Header — two-card panel */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            const firstRegistration = selectedEventRegistrations[0];
            const eventInfo = firstRegistration.eventSnapshot || selectedEvent;
            const timeZone = eventInfo.timeZone;
            const eventDateTime = formatEventDateTime(eventInfo.dateTime, timeZone);

            const addressText = eventInfo.address
              ? (typeof eventInfo.address === 'string'
                  ? eventInfo.address
                  : eventInfo.address.formattedAddress ||
                    `${eventInfo.address.street || ''} ${eventInfo.address.suburb || ''} ${eventInfo.address.state || ''} ${eventInfo.address.postalCode || ''}`.trim())
              : null;

            const organizerPhone = eventInfo.organizer?.contact || eventInfo.organizer?.phone;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Event details */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                      {eventInfo.eventCode || selectedEvent?.eventCode}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-teal-700">
                      {eventInfo.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
                    <div className="flex items-start gap-2">
                      <FaRegCalendarAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{eventDateTime.date}</p>
                        <p className="text-xs text-slate-500">Starts at {eventDateTime.time} ({timeZone})</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{eventInfo.venue}</p>
                        {addressText && (
                          <p className="text-xs text-slate-500">{addressText}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer contact */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Organizer Contact
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FaBriefcase />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{eventInfo.organizer?.name || 'Event Organizer'}</p>
                      <p className="text-xs text-slate-500">Host Organization</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {eventInfo.organizer?.email && (
                      <a
                        href={`mailto:${eventInfo.organizer.email}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors break-all"
                      >
                        <FaRegEnvelope className="text-teal-600 shrink-0" />
                        <span className="truncate">{eventInfo.organizer.email}</span>
                      </a>
                    )}
                    {organizerPhone && (
                      <a
                        href={`tel:${organizerPhone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors"
                      >
                        <FaPhoneAlt className="text-teal-600 shrink-0" />
                        <span>{organizerPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Registration record cards */}
          <div className="space-y-3 sm:space-y-4">
            {selectedEventRegistrations.map((registration, index) => {
              const isExpanded = expandedRegistrations.has(registration._id);
              const hasFormResponses = registration.formResponses && registration.formResponses.length > 0;
              const registeredOn = registration.createdAt
                ? new Date(registration.createdAt).toLocaleDateString()
                : null;

              return (
                <div key={registration._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Slim row: actions (left) + registered date (right) */}
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTabClick(registration._id, 'attendees')}
                        className="inline-flex items-center gap-1.5 bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-teal-800 transition-colors"
                      >
                        <FaUsers />
                        <span>Attendees ({registration.attendees.length})</span>
                      </button>
                      {registration.status !== 'checkedin' && (
                        <button
                          type="button"
                          onClick={() => setCancelEventId(registration.event)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-700 hover:underline px-2 py-1.5 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-1 text-xs sm:text-sm text-slate-600 text-right leading-tight shrink-0">
                      <span>Registered on</span>
                      <span>{registeredOn || registration.registrationNumber}</span>
                    </div>
                  </div>

                  {/* Expanded attendee list — compact one-line rows */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 px-3 sm:px-4">
                      <VerticalScrollSlider maxHeightClass="max-h-44 md:max-h-60">
                        <div className="divide-y divide-slate-100">
                          {registration.attendees.map((attendee, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 py-2 text-xs sm:text-sm">
                              <span className="font-medium text-slate-800 truncate">{attendee.name}</span>
                              {attendee.age && (
                                <span className="text-slate-500 shrink-0 whitespace-nowrap">Age {attendee.age}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </VerticalScrollSlider>

                      {/* Attendee information (form responses) — compact */}
                      {hasFormResponses && (
                        <div className="border-t border-slate-100 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                            Information
                          </p>
                          <VerticalScrollSlider maxHeightClass="max-h-48 md:max-h-64">
                            <div className="divide-y divide-slate-100">
                              {registration.formResponses.map((response, idx) => (
                                <div key={idx} className="py-2 text-xs sm:text-sm">
                                  <span className="font-semibold text-slate-700">{response.fieldName}: </span>
                                  <span className="text-slate-600 whitespace-pre-line break-words">{formatAnswer(response.response)}</span>
                                </div>
                              ))}
                            </div>
                          </VerticalScrollSlider>
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

      {/* Cancel confirmation modal */}
      {cancelEventId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !actionLoading && setCancelEventId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xs rounded-xl bg-white p-5 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => !actionLoading && setCancelEventId(null)}
              aria-label="Close"
              className="absolute top-2.5 right-3 text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
            >
              ✕
            </button>
            <h2 className="text-base font-semibold text-slate-900">
              Cancel registration?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to cancel this registration? This action cannot be undone.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setCancelEventId(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep registration
              </button>
              <button
                type="button"
                onClick={() => handleUnregister(cancelEventId)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-full bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyFreeEventRegistrationsPage;