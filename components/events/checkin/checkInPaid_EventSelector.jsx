// components/events/checkin/checkInPaid_EventSelector.jsx

'use client';

import React, { useEffect, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import {
  fetchManagedPaidEvents,
  setSelectedEvent,
  fetchPaidEventAttendees
} from '@/store/slices/events/checkInPaidSlice';
import { formatInTimeZone } from 'date-fns-tz';

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];

const CheckInPaid_EventSelector = () => {
  const dispatch = useDispatch();
  const { 
    managedEvents, 
    selectedEvent, 
    loading, 
    error 
  } = useSelector((state) => state.checkInPaid);
  
  const [dateFilter, setDateFilter] = React.useState('3months'); // Default to 3 months

  // Load managed events on mount
  useEffect(() => {
    dispatch(fetchManagedPaidEvents());
  }, [dispatch]);

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
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

  // Handle event selection
  const handleEventChange = (eventId) => {
    if (eventId) {
      const event = managedEvents.find(ev => ev._id === eventId);
      dispatch(setSelectedEvent(event));
      // Fetch first page when selecting event
      dispatch(fetchPaidEventAttendees({ eventId, page: 1, limit: 20 }));
    } else {
      dispatch(setSelectedEvent(null));
    }
  };

  // Apply date filtering
  const getFilteredEvents = () => {
    if (!managedEvents || managedEvents.length === 0) return [];
    
    let filtered = [...managedEvents];
    
    switch (dateFilter) {
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = managedEvents.filter(event => new Date(event.dateTime) >= threeMonthsAgo);
        break;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = managedEvents.filter(event => new Date(event.dateTime) >= sixMonthsAgo);
        break;
      case '1year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = managedEvents.filter(event => new Date(event.dateTime) >= oneYearAgo);
        break;
      case 'all':
      default:
        // Show all events
        break;
    }
    
    // Sort by date (most recent first)
    return filtered.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  };

  const filteredEvents = getFilteredEvents();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to load events';
    return (
      <div className="text-red-600 text-sm">
        Error loading events: {errorMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Combined Date Filter and Event Selector on Mobile */}
      <div className="flex flex-col sm:flex-row sm:gap-4">
        {/* Date Filter - Compact on mobile */}
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

        {/* Event Selector - Optimized for mobile */}
        <div className="flex-1 mt-3 sm:mt-0">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Select Paid Event
          </label>
          <Listbox value={selectedEvent?._id || ''} onChange={handleEventChange}>
            <div className="relative">
              <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                <span className={`block truncate ${selectedEvent ? 'text-slate-900' : 'text-slate-500'}`}>
                  {selectedEvent
                    ? `${selectedEvent.title} • ${formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone).date}`
                    : 'Choose a paid event'}
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
                          Choose a paid event
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
                      No paid events found
                    </div>
                  ) : (
                    filteredEvents.map((event) => {
                      const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                      return (
                        <ListboxOption
                          key={event._id}
                          value={event._id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {event.title} • {eventDateTime.date}
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

          {filteredEvents.length === 0 && managedEvents.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              No events in selected range. Try a different date filter.
            </p>
          )}
        </div>
      </div>

      {/* Data Retention note - calm slate, no background */}
      <p className="text-xs text-slate-500">
        <strong className="font-semibold text-slate-600">Note:</strong> Events older than 2 years will be deleted.
      </p>
    </div>
  );
};

export default CheckInPaid_EventSelector;