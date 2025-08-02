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
    <div className="grid grid-cols-2 gap-4">
      {/* Total Tickets */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.totalTickets}</div>
        <div className="text-sm text-gray-500">Total Tickets</div>
      </div>

      {/* Checked In */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <div className="text-2xl font-bold text-green-600">{stats.checkedInAttendees}</div>
        <div className="text-sm text-gray-500">Checked In</div>
      </div>
    </div>
  );
};

export default CheckInPaid_CheckInStats;