// app/users/profile/checkInFree/page.jsx

'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatInTimeZone } from 'date-fns-tz';

// Components
import CheckInFree_EventSelector from '@/components/events/checkin/checkInFree_EventSelector';
import CheckInFree_SearchBar from '@/components/events/checkin/checkInFree_SearchBar';
import CheckInFree_CheckInStats from '@/components/events/checkin/checkInFree_CheckInStats';
import CheckInFree_AttendeeList from '@/components/events/checkin/checkInFree_AttendeeList';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInFreeSlice';

const CheckInFreePage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees } = useSelector((state) => state.checkInFree);

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      console.error('Error formatting date:', error);
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCheckInData());
    };
  }, [dispatch]);

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Event Check-In</h2>
          <span className="text-sm text-gray-500">
            Manage attendee check-ins for your free events
          </span>
        </div>

        {/* Event Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <CheckInFree_EventSelector />
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Event Info Header */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{selectedEvent.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="font-mono">Event ID: {selectedEvent.eventCode || selectedEvent._id}</span>
                {selectedEvent.capacity > 0 && (
                  <>
                    <span>•</span>
                    <span>Capacity: {selectedEvent.capacity} attendees</span>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">📅 Date & Time:</span><br />
                  {(() => {
                    const eventDateTime = formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone);
                    return (
                      <>
                        {eventDateTime.date} at {eventDateTime.time}
                        <div className="text-xs text-gray-500 mt-1">Timezone: {selectedEvent.timeZone || 'Australia/Sydney'}</div>
                      </>
                    );
                  })()}
                </div>
                <div>
                  <span className="font-medium">📍 Venue:</span><br />
                  {selectedEvent.venue}
                  {selectedEvent.address && (
                    <div className="text-xs mt-1">
                      {typeof selectedEvent.address === 'string' 
                        ? selectedEvent.address 
                        : selectedEvent.address.formattedAddress || 
                          `${selectedEvent.address.street || ''} ${selectedEvent.address.suburb || ''} ${selectedEvent.address.state || ''} ${selectedEvent.address.postalCode || ''}`.trim()
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar - Sticky on mobile */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-0 z-10 md:static">
          <CheckInFree_SearchBar />
        </div>

        {/* Statistics */}
        <div className="mb-6">
          <CheckInFree_CheckInStats />
        </div>

        {/* Attendee List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Attendees</h2>
          </div>
          <div className="p-4">
            <CheckInFree_AttendeeList />
          </div>
        </div>

        {/* Mobile-friendly spacing at bottom */}
        <div className="h-20 md:hidden"></div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default CheckInFreePage;