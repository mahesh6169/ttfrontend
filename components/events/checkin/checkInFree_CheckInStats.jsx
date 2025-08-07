// components/events/checkin/checkInFree_CheckInStats.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const CheckInFree_CheckInStats = () => {
  const { stats, attendeesLoading } = useSelector((state) => state.checkInFree);
  
  const {
    totalRegistrations,
    totalAttendees,
    checkedInAttendees,
    percentageCheckedIn
  } = stats;

  if (attendeesLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-2 sm:p-4 rounded-lg shadow animate-pulse">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-20 mb-1 sm:mb-2"></div>
            <div className="h-5 sm:h-8 bg-gray-200 rounded w-10 sm:w-16"></div>
          </div>
        ))}
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
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {statItems.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.bgColor} p-2 sm:p-4 rounded-lg border border-gray-100`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-center sm:justify-start mb-1 sm:mb-2">
              <span className={`${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className={`text-base sm:text-2xl font-bold ${stat.color} block`}>
                {stat.value}
              </span>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                <span className="block sm:hidden">{stat.label}</span>
                <span className="hidden sm:block">{stat.labelDesktop}</span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckInFree_CheckInStats;