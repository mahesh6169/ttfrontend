// components/events/seats/SeatLegend.jsx

'use client';

import React from 'react';

const SeatLegend = () => {
  const legendItems = [
    {
      status: 'available',
      color: 'bg-gray-50 text-gray-700 border-gray-300',
      label: 'Available',
      icon: '',
      description: 'Tap to select'
    },
    {
      status: 'selected',
      color: 'bg-blue-600 text-white border-blue-700',
      label: 'Selected',
      icon: '✓',
      description: 'Your seats'
    },
    {
      status: 'selected-by-other',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Hold',
      icon: '⏳',
      description: 'Being selected'
    },
    {
      status: 'booked',
      color: 'bg-gray-200 text-gray-500 border-gray-300',
      label: 'Sold',
      icon: '✗',
      description: 'Not available'
    },
    {
      status: 'reserved',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      label: 'Reserved',
      icon: '★',
      description: 'Organizer use'
    },
    {
      status: 'disabled',
      color: 'bg-gray-100 text-gray-400 border-gray-200',
      label: 'Blocked',
      icon: '⊘',
      description: 'Not available'
    }
  ];

  return (
    <div className="w-full">
      {/* Mobile: Grid layout, Desktop: Flex wrap */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 sm:justify-center">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center space-x-1 sm:space-x-1.5 justify-center sm:justify-start">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded text-[8px] sm:text-[10px] font-medium border flex items-center justify-center ${item.color}`}>
              {item.icon}
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