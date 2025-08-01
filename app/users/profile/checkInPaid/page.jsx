// app/users/profile/checkInPaid/page.jsx

'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatInTimeZone } from 'date-fns-tz';

// Components
import CheckInPaid_EventSelector from '@/components/events/checkin/checkInPaid_EventSelector';
import CheckInPaid_SearchBar from '@/components/events/checkin/checkInPaid_SearchBar';
import CheckInPaid_CheckInStats from '@/components/events/checkin/checkInPaid_CheckInStats';
import CheckInPaid_AttendeeList from '@/components/events/checkin/checkInPaid_AttendeeList';
import CheckInPaid_VirtualizedAttendeeList from '@/components/events/checkin/checkInPaid_VirtualizedAttendeeList';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaidPage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees, pagination } = useSelector((state) => state.checkInPaid);
  
  // Use virtualized list for large datasets
  const useVirtualized = pagination.totalCount > 50;

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
          <h2 className="text-2xl font-bold text-gray-900">Paid Event Check-In</h2>
          <span className="text-sm text-gray-500">
            Manage attendee check-ins for your paid events
          </span>
        </div>

        {/* Event Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <CheckInPaid_EventSelector />
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
                    <span>"</span>
                    <span>Capacity: {selectedEvent.capacity} attendees</span>
                  </>
                )}
                <span>"</span>
                <span className="text-teal-700 font-semibold">Paid Event</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Date & Time:</span><br />
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
                  <span className="font-medium">Venue:</span><br />
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

        {/* Statistics */}
        <div className="mb-6">
          <CheckInPaid_CheckInStats />
        </div>

        {/* Attendee List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ticket Holders</h2>
          </div>
          
          {/* Search Bar - Moved just above attendees */}
          <div className="p-4 border-b bg-gray-50">
            <CheckInPaid_SearchBar />
          </div>
          
          <div className="p-4">
            {useVirtualized ? (
              <CheckInPaid_VirtualizedAttendeeList />
            ) : (
              <CheckInPaid_AttendeeList />
            )}
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

export default CheckInPaidPage;