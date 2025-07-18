// components/events/checkin/checkInFree_EventSelector.jsx

'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchManagedFreeEvents, 
  setSelectedEvent,
  fetchEventAttendees 
} from '@/store/slices/events/checkInFreeSlice';
import { format } from 'date-fns';

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

  // Format event date for display
  const formatEventDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Event for Check-In
      </label>
      
      <select
        value={selectedEvent?._id || ''}
        onChange={handleEventChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      >
        <option value="">-- Select an Event --</option>
        
        {relevantEvents.length === 0 ? (
          <option disabled>No upcoming events found</option>
        ) : (
          relevantEvents.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title} - {formatEventDate(event.dateTime)}
              {event.venue && ` @ ${event.venue}`}
            </option>
          ))
        )}
      </select>

      {selectedEvent && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Venue:</span> {selectedEvent.venue}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date:</span> {formatEventDate(selectedEvent.dateTime)}
          </p>
          {selectedEvent.capacity > 0 && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Capacity:</span> {selectedEvent.capacity} attendees
            </p>
          )}
        </div>
      )}

      {managedEvents.length > 0 && relevantEvents.length === 0 && (
        <p className="text-sm text-amber-600 mt-2">
          Note: Only showing events from today onwards. You have {managedEvents.length} total events.
        </p>
      )}
    </div>
  );
};

export default CheckInFree_EventSelector;