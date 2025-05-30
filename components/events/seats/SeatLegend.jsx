// components/events/seats/SeatLegend.jsx

'use client';

import React from 'react';

const SeatLegend = () => {
  const legendItems = [
    {
      status: 'available',
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Available',
      icon: '○',
      description: 'Click to select'
    },
    {
      status: 'selected',
      color: 'bg-teal-600 text-white border-teal-700',
      label: 'Selected',
      icon: '✓',
      description: 'Your selection'
    },
    {
      status: 'occupied',
      color: 'bg-red-100 text-red-800 border-red-300',
      label: 'Occupied',
      icon: '✗',
      description: 'Already sold'
    },
    {
      status: 'reserved',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Reserved',
      icon: '⏱',
      description: 'Held by other user'
    },
    {
      status: 'disabled',
      color: 'bg-gray-100 text-gray-500 border-gray-300',
      label: 'Unavailable',
      icon: '⊘',
      description: 'Not for sale'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Seat Legend
      </h3>
      
      <div className="space-y-3">
        {legendItems.map((item) => (
          <div key={item.status} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Seat demo */}
              <div className={`w-6 h-6 rounded text-xs font-medium border-2 flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              
              {/* Label and description */}
              <div>
                <div className="text-sm font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex items-start">
            <svg className="w-3 h-3 mt-0.5 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Seats are held for 10 minutes once selected</span>
          </div>
          <div className="flex items-start">
            <svg className="w-3 h-3 mt-0.5 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Complete purchase before time expires</span>
          </div>
          <div className="flex items-start">
            <svg className="w-3 h-3 mt-0.5 mr-2 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Hover over seats to see row and seat number</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLegend;