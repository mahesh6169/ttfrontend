// components/events/checkin/checkInPaid_CheckInStats.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const CheckInPaid_CheckInStats = () => {
  const { stats, selectedEvent, attendeesLoading } = useSelector((state) => state.checkInPaid);

  if (!selectedEvent) {
    return null;
  }

  if (attendeesLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 sm:p-4 animate-pulse">
        <div className="flex items-center justify-around sm:justify-start sm:space-x-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-4 h-4 sm:w-6 sm:h-6 bg-slate-200 rounded-full"></div>
              <div className="space-x-1">
                <span className="inline-block h-4 w-8 bg-slate-200 rounded"></span>
                <span className="inline-block h-4 w-16 bg-slate-200 rounded"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 sm:p-4">
      <div className="flex items-center justify-around sm:justify-start sm:space-x-8">
        {/* Total Tickets */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <div className="text-xs sm:text-base">
            <span className="font-bold text-teal-700">{stats.totalTickets}</span>
            <span className="hidden sm:inline text-slate-500 ml-1">Total Tickets</span>
            <span className="sm:hidden text-slate-500 block text-xs">Tickets</span>
          </div>
        </div>

        {/* Checked In */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs sm:text-base">
            <span className="font-bold text-teal-700">{stats.checkedInAttendees}</span>
            <span className="hidden sm:inline text-slate-500 ml-1">Checked In</span>
            <span className="sm:hidden text-slate-500 block text-xs">Checked In</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPaid_CheckInStats;