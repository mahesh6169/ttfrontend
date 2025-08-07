// components/events/checkin/checkInFree_EventSelector.jsx

'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchManagedFreeEvents, 
  setSelectedEvent,
  fetchEventAttendees 
} from '@/store/slices/events/checkInFreeSlice';
import { formatInTimeZone } from 'date-fns-tz';

const CheckInFree_EventSelector = () => {
  const dispatch = useDispatch();
  const { 
    managedEvents, 
    selectedEvent, 
    loading, 
    error 
  } = useSelector((state) => state.checkInFree);
  
  const [dateFilter, setDateFilter] = React.useState('3months'); // Default to 3 months

  // Load managed events on mount
  useEffect(() => {
    dispatch(fetchManagedFreeEvents());
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
  const handleEventChange = (e) => {
    const eventId = e.target.value;
    if (eventId) {
      const event = managedEvents.find(ev => ev._id === eventId);
      dispatch(setSelectedEvent(event));
      // Fetch first page when selecting event
      dispatch(fetchEventAttendees({ eventId, page: 1, limit: 20 }));
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
    return (
      <div className="text-red-600 text-sm">
        Error loading events: {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Combined Date Filter and Event Selector on Mobile */}
      <div className="flex flex-col sm:flex-row sm:gap-4">
        {/* Date Filter - Compact on mobile */}
        <div className="sm:w-1/3">
          <label htmlFor="dateFilter" className="block text-xs font-medium text-gray-600 mb-1">
            Date Range
          </label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
          >
            <option value="3months">Last 3 months</option>
            <option value="6months">Last 6 months</option>
            <option value="1year">Last year</option>
            <option value="all">Show all</option>
          </select>
        </div>

        {/* Event Selector - Optimized for mobile */}
        <div className="flex-1 mt-3 sm:mt-0">
          <label htmlFor="eventSelect" className="block text-xs font-medium text-gray-600 mb-1">
            Select Event
          </label>
          <select
            id="eventSelect"
            value={selectedEvent?._id || ''}
            onChange={handleEventChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white truncate"
          >
            <option value="">Choose an event</option>
            
            {filteredEvents.length === 0 ? (
              <option disabled>No events found</option>
            ) : (
              filteredEvents.map((event) => {
                const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                // Always use concise format that works on all screens
                return (
                  <option key={event._id} value={event._id}>
                    {event.title} • {eventDateTime.date}
                  </option>
                );
              })
            )}
          </select>

          {filteredEvents.length === 0 && managedEvents.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              No events in selected range. Try a different date filter.
            </p>
          )}
        </div>
      </div>

      {/* Data Retention Warning - More compact */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> Events older than 2 years will be deleted.
        </p>
      </div>
    </div>
  );
};

export default CheckInFree_EventSelector;