// app/users/profile/checkInPaid/page.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatInTimeZone } from 'date-fns-tz';
import { BsQrCodeScan } from 'react-icons/bs';

// Components
import CheckInPaid_EventSelector from '@/components/events/checkin/checkInPaid_EventSelector';
import CheckInPaid_SearchBar from '@/components/events/checkin/checkInPaid_SearchBar';
import CheckInPaid_CheckInStats from '@/components/events/checkin/checkInPaid_CheckInStats';
import CheckInPaid_GroupedAttendeeList from '@/components/events/checkin/checkInPaid_GroupedAttendeeList';
import CheckInPaid_VirtualizedAttendeeList from '@/components/events/checkin/checkInPaid_VirtualizedAttendeeList';
import CheckInPaid_QRScanner from '@/components/events/checkin/CheckInPaid_QRScanner';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaidPage = () => {
  const dispatch = useDispatch();
  const { selectedEvent, attendees, pagination } = useSelector((state) => state.checkInPaid);
  const [showScanner, setShowScanner] = useState(false);
  
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
      <div className="space-y-2 sm:space-y-3">
        {/* Page Header - Compact */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Paid Event Check-In</h2>
        </div>

        {/* Event Selector - Reduced padding */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
          <CheckInPaid_EventSelector />
        </div>

        {/* Selected Event Details - Compact */}
        {selectedEvent && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Event Title */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {selectedEvent.title}
              </h3>
              
              {/* Event Code */}
              <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                {selectedEvent.eventCode || selectedEvent._id}
              </span>
              
             
              
              {/* Date & Time */}
              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone).combined}</span>
              </div>
              
              {/* Venue */}
              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{selectedEvent.venue}</span>
              </div>
              
              {/* Capacity if available */}
              {selectedEvent.capacity > 0 && (
                <div className="text-gray-600">
                  <span>Capacity: {selectedEvent.capacity}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics - Compact spacing */}
        {selectedEvent && (
          <CheckInPaid_CheckInStats />
        )}

        {/* Attendee List - Only show when event is selected */}
        {selectedEvent && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Search Bar - No header needed */}
            <div className="p-3 border-b bg-gray-50">
              <CheckInPaid_SearchBar />
            </div>
            
            <div className="p-0 sm:p-2">
              {attendees.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No tickets found for this event
                  </p>
                </div>
              ) : (
                <>
                  {useVirtualized ? (
                    <CheckInPaid_VirtualizedAttendeeList />
                  ) : (
                    <CheckInPaid_GroupedAttendeeList />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAB Button for QR Scanner */}
      {selectedEvent && !showScanner && (
        <button
          onClick={() => setShowScanner(true)}
          className="fixed bottom-20 right-6 w-16 h-16 bg-teal-600 rounded-full shadow-lg flex flex-col items-center justify-center text-white z-30 hover:bg-teal-700 transition-colors"
          aria-label="Scan QR Code"
        >
          <BsQrCodeScan className="text-2xl" />
          <span className="text-xs mt-0.5">Scan QR</span>
        </button>
      )}

      {/* QR Scanner Modal */}
      {showScanner && selectedEvent && (
        <CheckInPaid_QRScanner onClose={() => setShowScanner(false)} />
      )}

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