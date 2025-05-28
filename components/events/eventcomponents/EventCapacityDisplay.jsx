// components/events/EventCapacityDisplay.jsx

import React from 'react';
import { FaUsers, FaTicketAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useEventCapacity } from '@/utils/helpers/events/useEventCapacity';

const EventCapacityDisplay = ({ eventId, isPaid = false }) => {
  const { capacityData, loading, error } = useEventCapacity(eventId);

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600 text-sm">Unable to load capacity info</p>
      </div>
    );
  }

  if (!capacityData || isPaid) {
    return null; // Don't show for paid events yet
  }

  const {
    totalCapacity,
    registeredCount,
    slotsLeft,
    isUnlimited,
    isFull,
    registrationCount
  } = capacityData;

  return (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <FaUsers className="mr-2 text-blue-600" />
        Event Capacity
      </h3>
      
      <div className="space-y-3">
        {/* Total Capacity */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Total Capacity:</span>
          <span className="font-medium text-gray-900">
            {isUnlimited ? 'Unlimited' : `${totalCapacity} people`}
          </span>
        </div>

        {/* Registered Count */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Currently Registered:</span>
          <span className="font-medium text-blue-600">
            {registeredCount} {registeredCount === 1 ? 'person' : 'people'}
          </span>
        </div>

        {/* Slots Left */}
        {!isUnlimited && (
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Slots Available:</span>
            <span className={`font-medium ${
              isFull ? 'text-red-600' : 
              slotsLeft <= 10 ? 'text-orange-600' : 
              'text-green-600'
            }`}>
              {isFull ? 'Event Full' : `${slotsLeft} slots left`}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {!isUnlimited && totalCapacity > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0</span>
              <span>{totalCapacity}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFull ? 'bg-red-500' :
                  (registeredCount / totalCapacity) > 0.8 ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}
                style={{ 
                  width: `${Math.min((registeredCount / totalCapacity) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Registration count info */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          {registrationCount} {registrationCount === 1 ? 'registration' : 'registrations'} received
        </div>

        {/* Warning for low capacity */}
        {!isUnlimited && slotsLeft <= 10 && slotsLeft > 0 && (
          <div className="flex items-center text-orange-600 text-sm mt-2">
            <FaExclamationTriangle className="mr-2" />
            <span>Only {slotsLeft} slots remaining!</span>
          </div>
        )}

        {/* Full event warning */}
        {isFull && (
          <div className="flex items-center text-red-600 text-sm mt-2">
            <FaExclamationTriangle className="mr-2" />
            <span>This event is fully booked</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCapacityDisplay;