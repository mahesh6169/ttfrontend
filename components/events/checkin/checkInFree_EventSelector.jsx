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
      dispatch(fetchEventAttendees(eventId));
    } else {
      dispatch(setSelectedEvent(null));
    }
  };

  // Filter to show only upcoming or today's events
  const getRelevantEvents = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    return managedEvents.filter(event => {
      const eventDate = new Date(event.dateTime);
      // Show events from today onwards
      return eventDate >= today;
    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  };

  const relevantEvents = getRelevantEvents();

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
    <>
      <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
        Select Event to View Registration Details
      </label>
      <select
        id="eventSelect"
        value={selectedEvent?._id || ''}
        onChange={handleEventChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">-- Choose an event --</option>
        
        {relevantEvents.length === 0 ? (
          <option disabled>No registrations found for any upcoming events.</option>
        ) : (
          relevantEvents.map((event) => {
            const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
            return (
              <option key={event._id} value={event._id}>
                {event.title} - {eventDateTime.combined} at {event.venue}
              </option>
            );
          })
        )}
      </select>

      {managedEvents.length > 0 && relevantEvents.length === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          Note: Only showing events from today onwards. You have {managedEvents.length} total events.
        </p>
      )}
    </>
  );
};

export default CheckInFree_EventSelector;