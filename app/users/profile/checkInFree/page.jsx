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
import CheckInFree_VirtualizedAttendeeList from '@/components/events/checkin/checkInFree_VirtualizedAttendeeList';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInFreeSlice';

const CheckInFreePage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees, pagination } = useSelector((state) => state.checkInFree);
  
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
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Free Event Check-In</h2>
          <span className="text-xs sm:text-sm text-gray-500">
            Manage attendee check-ins for your free events
          </span>
        </div>

        {/* Event Selector */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <CheckInFree_EventSelector />
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Event Info Header */}
            <div className="bg-gray-50 border-b">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Event Details Container - 2 columns on desktop */}
                  <div className="md:col-span-2 bg-white rounded-lg p-4">
                    {/* Event Title and ID */}
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                      {selectedEvent.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                      <span className="font-mono">Event ID: {selectedEvent.eventCode || selectedEvent._id}</span>
                      {selectedEvent.capacity > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Capacity: {selectedEvent.capacity}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Event Details */}
                    <div className="space-y-3">
                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <div className="text-gray-500 mt-0.5">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          {(() => {
                            const eventDateTime = formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone);
                            return (
                              <>
                                <span className="text-gray-700">{eventDateTime.date} at {eventDateTime.time}</span>
                                <div className="text-xs text-gray-500">Timezone: {selectedEvent.timeZone || 'Australia/Sydney'}</div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Venue */}
                      <div className="flex items-start gap-3">
                        <div className="text-gray-500 mt-0.5">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-700">{selectedEvent.venue}</span>
                          {selectedEvent.address && (
                            <div className="text-xs text-gray-500 mt-1">
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

                  {/* Organizer Info Container - 1 column on desktop */}
                  <div className="md:col-span-1 bg-white rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs sm:text-sm text-gray-600">Organizer:</span>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedEvent.organizer?.name || 'Event Organizer'}
                        </p>
                      </div>
                      
                      {selectedEvent.organizer?.phone && (
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600">Contact:</span>
                          <p className="text-sm text-gray-900">
                            {selectedEvent.organizer.phone}
                          </p>
                        </div>
                      )}
                      
                      {selectedEvent.organizer?.email && (
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                          <p className="text-sm text-gray-900 break-all">
                            {selectedEvent.organizer.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics - Only show when event is selected */}
        {selectedEvent && (
          <div className="mb-4 sm:mb-6">
            <CheckInFree_CheckInStats />
          </div>
        )}

        {/* Attendee List - Only show when event is selected */}
        {selectedEvent && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Attendees</h2>
            </div>
            
            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b bg-gray-50">
              <CheckInFree_SearchBar />
            </div>
            
            <div className="p-3 sm:p-4">
              {attendees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No registrations found for this event
                  </p>
                </div>
              ) : (
                <>
                  {useVirtualized ? (
                    <CheckInFree_VirtualizedAttendeeList />
                  ) : (
                    <CheckInFree_AttendeeList />
                  )}
                </>
              )}
            </div>
          </div>
        )}

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