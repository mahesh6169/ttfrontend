// components/events/EventCapacityDisplay.jsx

import React, { useState, useEffect } from 'react';
import { FaUsers, FaTicketAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useEventCapacity } from '@/utils/helpers/events/useEventCapacity';

const EventCapacityDisplay = ({ eventId, isPaid = false, showInTicketSection = false }) => {
  const [paidEventCapacity, setPaidEventCapacity] = useState(null);
  const [paidEventLoading, setPaidEventLoading] = useState(false);
  const [paidEventError, setPaidEventError] = useState(null);

  // Use the existing hook for free events
  const { capacityData: freeEventData, loading: freeLoading, error: freeError } = useEventCapacity(eventId);

  // Fetch capacity for paid events using the same API as ticket page
  useEffect(() => {
    const fetchPaidEventCapacity = async () => {
      if (!isPaid || !eventId) return;
      
      setPaidEventLoading(true);
      setPaidEventError(null);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/capacity`);
        const data = await response.json();
        
        if (data.success) {
          setPaidEventCapacity(data.capacity);
        } else {
          setPaidEventError('Failed to load capacity data');
        }
      } catch (error) {
        console.error('Error fetching paid event capacity:', error);
        setPaidEventError('Unable to load capacity info');
      } finally {
        setPaidEventLoading(false);
      }
    };

    if (isPaid && showInTicketSection) {
      fetchPaidEventCapacity();
    }
  }, [eventId, isPaid, showInTicketSection]);

  // Choose the right data source based on event type
  const capacityData = isPaid ? paidEventCapacity : freeEventData;
  const loading = isPaid ? paidEventLoading : freeLoading;
  const error = isPaid ? paidEventError : freeError;

  if (loading) {
    return (
      <div className={`${showInTicketSection ? '' : 'bg-gray-50 p-4 rounded-lg'} animate-pulse`}>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={showInTicketSection ? 'text-red-600 text-sm' : 'bg-red-50 p-4 rounded-lg'}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!capacityData) {
    return null;
  }

  // For paid events in ticket section, show simplified capacity info
  if (isPaid && showInTicketSection) {
    const { total, remaining, isUnlimited, status } = capacityData;
    
    return (
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <FaUsers className="mr-2" />
        <span>
          {isUnlimited ? (
            'Unlimited capacity'
          ) : status === 'sold-out' ? (
            'Event sold out'
          ) : (
            `${remaining || 0} of ${total || 0} remaining`
          )}
        </span>
      </div>
    );
  }

  // For free events, show detailed capacity info (existing logic)
  if (!isPaid) {
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
  }

  return null;
};

export default EventCapacityDisplay;