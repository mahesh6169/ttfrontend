// components/events/checkin/checkInFree_CheckInStats.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const CheckInFree_CheckInStats = ({ rightSlot }) => {
  const { stats, attendeesLoading } = useSelector((state) => state.checkInFree);
  
  const {
    totalRegistrations,
    totalAttendees,
    checkedInAttendees,
    percentageCheckedIn
  } = stats;

  if (attendeesLoading) {
    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 animate-pulse">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full"></div>
              <div className="space-x-1">
                <span className="inline-block h-4 w-8 bg-gray-200 rounded"></span>
                <span className="inline-block h-4 w-16 bg-gray-200 rounded"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Registrations',
      labelDesktop: 'Total Registrations',
      value: totalRegistrations,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      label: 'Attendees',
      labelDesktop: 'Total Attendees',
      value: totalAttendees,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      label: 'Checked In',
      labelDesktop: 'Checked In',
      value: checkedInAttendees,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-8 flex-1">
          {/* Registrations */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-xs sm:text-base">
              <span className="font-bold text-blue-600">{totalRegistrations}</span>
              <span className="hidden sm:inline text-gray-600 ml-1">Registrations</span>
              <span className="sm:hidden text-gray-600 block text-xs">Registrations</span>
            </div>
          </div>

          {/* Attendees */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div className="text-xs sm:text-base">
              <span className="font-bold text-purple-600">{totalAttendees}</span>
              <span className="hidden sm:inline text-gray-600 ml-1">Attendees</span>
              <span className="sm:hidden text-gray-600 block text-xs">Attendees</span>
            </div>
          </div>

          {/* Checked In */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-base">
              <span className="font-bold text-green-600">{checkedInAttendees}</span>
              <span className="hidden sm:inline text-gray-600 ml-1">Checked In</span>
              <span className="sm:hidden text-gray-600 block text-xs">Checked</span>
            </div>
          </div>
        </div>

        {rightSlot && (
          <div className="flex justify-center sm:justify-end">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInFree_CheckInStats;