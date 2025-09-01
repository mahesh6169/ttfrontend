// components/events/seats/SeatLegend.jsx

'use client';

import React from 'react';
import { MdEventSeat } from 'react-icons/md';

const SeatLegend = () => {
  const legendItems = [
    {
      status: 'available',
      color: 'bg-green-500 text-white border-green-600',
      label: 'Available',
      description: 'Tap to select'
    },
    {
      status: 'selected',
      color: 'bg-amber-600 text-white border-amber-700',
      label: 'Selected',
      description: 'Your seats'
    },
    {
      status: 'selected-by-other',
      color: 'bg-yellow-400 text-yellow-900 border-yellow-500',
      label: 'Hold',
      description: 'Being selected'
    },
    {
      status: 'booked',
      color: 'bg-red-500 text-white border-red-600',
      label: 'Sold',
      description: 'Not available'
    },
    {
      status: 'reserved',
      color: 'bg-purple-500 text-white border-purple-600',
      label: 'Reserved',
      description: 'Organizer use'
    }
  ];

  return (
    <div className="w-full">
      {/* Mobile: Grid layout, Desktop: Flex wrap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3 md:justify-center">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center space-x-1 sm:space-x-1.5 justify-start">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded text-[8px] sm:text-[10px] font-medium border flex items-center justify-center ${item.color}`}>
              <MdEventSeat className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-gray-700">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatLegend;