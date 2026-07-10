// components/events/seats/SeatLegend.jsx

'use client';

import React from 'react';
import { MdEventSeat } from 'react-icons/md';

const SeatLegend = () => {
  const legendItems = [
    {
      status: 'available',
      color: 'bg-teal-50 text-teal-700 border-teal-400',
      label: 'Available',
      description: 'Tap to select'
    },
    {
      status: 'selected',
      color: 'bg-teal-700 text-white border-teal-800',
      label: 'Selected',
      description: 'Your seats'
    },
    {
      status: 'selected-by-other',
      color: 'bg-amber-400 text-amber-900 border-amber-500',
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
      color: 'bg-slate-400 text-white border-slate-500',
      label: 'Reserved',
      description: 'Organizer use'
    }
  ];

  return (
    <div className="w-full md:w-auto">
      {/* One row (scrolls horizontally on small screens); wraps on desktop */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 sm:gap-3 md:flex-wrap md:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center space-x-1 sm:space-x-1.5 justify-start shrink-0">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded text-[8px] sm:text-[10px] font-medium border flex items-center justify-center ${item.color}`}>
              <MdEventSeat className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-700">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatLegend;