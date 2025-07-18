// app/users/profile/checkInFree/page.jsx

'use client';

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import CheckInFree_EventSelector from '@/components/events/checkin/checkInFree_EventSelector';
import CheckInFree_SearchBar from '@/components/events/checkin/checkInFree_SearchBar';
import CheckInFree_CheckInStats from '@/components/events/checkin/checkInFree_CheckInStats';
import CheckInFree_AttendeeList from '@/components/events/checkin/checkInFree_AttendeeList';

// Redux
import { clearCheckInData } from '@/store/slices/events/checkInFreeSlice';

const CheckInFreePage = () => {
  const dispatch = useDispatch();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCheckInData());
    };
  }, [dispatch]);

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Event Check-In</h1>
          <p className="text-gray-600 mt-1">
            Manage attendee check-ins for your free events
          </p>
        </div>

        {/* Event Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <CheckInFree_EventSelector />
        </div>

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