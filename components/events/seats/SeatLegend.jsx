// components/events/seats/SeatLegend.jsx

'use client';

import React from 'react';
import { MdEventSeat, MdClose } from 'react-icons/md';

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
      color: 'bg-purple-600 text-white border-purple-700',
      label: 'Reserved',
      description: 'Organizer use'
    },
    {
      // Organiser not-for-sale (events-blocked-seats.md): grey with an X.
      status: 'blocked',
      color: 'bg-slate-200 text-slate-500 border-slate-400',
      label: 'Not for sale',
      description: 'Not available',
      icon: 'close'
    }
  ];

  return (
    <div className="w-full md:w-auto">
      {/* One row that scrolls horizontally on small screens (shares its row with the zoom controls);
          wraps on desktop. Flat sizes, labels at the 12px guide floor. */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 md:flex-wrap md:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center space-x-1 justify-start shrink-0">
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${item.color}`}>
              {item.icon === 'close' ? <MdClose className="w-3 h-3" /> : <MdEventSeat className="w-3 h-3" />}
            </div>
            <div className="text-xs font-medium text-slate-700">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeatLegend;