// components/events/checkin/checkInPaid_CheckInStats.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const CheckInPaid_CheckInStats = () => {
  const { stats, selectedEvent } = useSelector((state) => state.checkInPaid);

  if (!selectedEvent) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount / 100); // Convert cents to dollars
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Total Tickets */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
        <div className="text-sm text-gray-500">Total Tickets</div>
      </div>

      {/* Total Attendees */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</div>
        <div className="text-sm text-gray-500">Total Attendees</div>
      </div>

      {/* Checked In */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.checkedInAttendees}</div>
        <div className="text-sm text-gray-500">Checked In</div>
      </div>

      {/* Check-in Percentage */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.percentageCheckedIn}%</div>
        <div className="text-sm text-gray-500">Check-in Rate</div>
      </div>

      {/* Total Revenue */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-teal-600">{formatCurrency(stats.revenue)}</div>
        <div className="text-sm text-gray-500">Total Revenue</div>
      </div>
    </div>
  );
};

export default CheckInPaid_CheckInStats;