// components/events/eventcomponents/EventCapacityDisplay.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaUsers } from 'react-icons/fa';
import axios from '@/utils/axiosConfig';

const EventCapacityDisplay = ({ 
  eventId, 
  isPaid = false, 
  showInTicketSection = false, 
  maxPerRegistration,
  context = 'viewing', // 'viewing' | 'purchasing'
  onCapacityUpdate, // Callback when capacity changes
  refreshInterval // Custom refresh interval (ms)
}) => {
  // Local state for capacity data
  const [capacity, setCapacity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Still listen to registration status for refresh trigger
  const registrationStatus = useSelector(state => state.freeEvents.registrationStatus);

  // Fetch capacity function
  const fetchCapacity = useCallback(async () => {
    if (!eventId) {
      console.log(`❌ EventCapacityDisplay: No eventId provided, skipping fetch`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Always use v2 endpoint with context
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/capacity/v2?context=${context}`;
      
      console.log(`📊 EventCapacityDisplay: Fetching capacity from ${endpoint}`);
      
      const response = await axios.get(endpoint, { withCredentials: true });
      
      if (response.data.success) {
        const newCapacity = response.data.capacity;
        setCapacity(newCapacity);
        console.log(`✅ EventCapacityDisplay: Capacity fetched for ${eventId}:`, newCapacity);
        
        // Notify parent component if callback provided
        if (onCapacityUpdate) {
          onCapacityUpdate(newCapacity);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch capacity');
      }
    } catch (err) {
      console.error(`❌ EventCapacityDisplay: Error fetching capacity:`, err);
      setError(err.response?.data?.message || err.message || 'Unable to load capacity information');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, context, onCapacityUpdate]);

  // Initial fetch
  useEffect(() => {
    fetchCapacity();
  }, [fetchCapacity]);

  // Set up polling based on context and event type
  useEffect(() => {
    if (!eventId) return;
    
    // Determine polling interval
    let interval;
    if (refreshInterval) {
      // Use custom interval if provided
      interval = refreshInterval;
    } else if (context === 'purchasing') {
      // More frequent updates when purchasing
      interval = 10000; // 10 seconds
    } else if (!isPaid) {
      // Free events in viewing mode
      interval = 30000; // 30 seconds
    } else {
      // Paid events in viewing mode
      interval = 60000; // 60 seconds
    }
    
    const timer = setInterval(() => {
      console.log(`🔄 EventCapacityDisplay: Polling capacity for ${eventId} (${context} mode)`);
      fetchCapacity();
    }, interval);

    return () => clearInterval(timer);
  }, [eventId, context, isPaid, refreshInterval, fetchCapacity]);

  // Refresh capacity when registration/unregistration succeeds
  useEffect(() => {
    if (registrationStatus === 'succeeded' && eventId) {
      console.log(`🔄 Registration succeeded, refreshing capacity for ${eventId}`);
      fetchCapacity();
    }
  }, [registrationStatus, eventId, fetchCapacity]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="text-sm text-red-600">
        Unable to load capacity information
      </div>
    );
  }

  // ✅ No data state
  if (!capacity) {
    return null;
  }

  // ✅ Context-specific rendering for purchasing mode
  if (context === 'purchasing' && capacity) {
    const { 
      available, 
      userReservation, 
      canBook, 
      isUnlimited, 
      status,
      activeReservations 
    } = capacity;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <FaUsers className="mr-2" />
          <span>
            {isUnlimited ? (
              'Unlimited capacity'
            ) : status === 'sold-out' ? (
              <span className="text-red-600 font-semibold">Event sold out</span>
            ) : available === 0 ? (
              <span className="text-orange-600">No spots currently available</span>
            ) : available < 5 ? (
              <span className="text-orange-600">Only {available} spots remaining!</span>
            ) : (
              `${available} spots available`
            )}
          </span>
        </div>
        
        {userReservation > 0 && (
          <div className="text-xs text-blue-600">
            You have {userReservation} tickets reserved
          </div>
        )}
        
        {activeReservations > 0 && status === 'limited' && (
          <div className="text-xs text-gray-500">
            {activeReservations} other users are currently booking
          </div>
        )}
      </div>
    );
  }
  
  // ✅ For paid events in ticket section (legacy support)
  if (isPaid && showInTicketSection) {
    const { displayText } = capacity;
    return (
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <FaUsers className="mr-2" />
        <span>{displayText || 'Loading capacity...'}</span>
      </div>
    );
  }

  // ✅ Full display for viewing context (free and paid events)
  const {
    total: totalCapacity,
    sold: registeredCount,
    remaining: remainingCapacity,
    isUnlimited,
    status,
    confirmedAllocations,
    displayText,
    lastUpdated
  } = capacity;

  // Use confirmedAllocations for accurate sold out display
  const isFull = totalCapacity > 0 && (confirmedAllocations || registeredCount) >= totalCapacity;

  // Create consistent display text for free events if not provided
  const consistentDisplayText = displayText || (!isPaid && !isUnlimited 
    ? `${remainingCapacity} of ${totalCapacity} available`
    : isUnlimited ? 'Unlimited capacity' : displayText);

  return (
    <div>
      {/* Summary display for both paid and free events - consistent format */}
      {consistentDisplayText && (
        <div className="text-sm sm:text-base font-semibold text-forest-900 mb-3">
          <FaUsers className="inline-block mr-2" />
          {consistentDisplayText}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Booking Limit */}
        {typeof maxPerRegistration === 'number' && (
          <div className="text-sm sm:text-base">
            <span className="font-semibold text-forest-900">
              Max:
            </span>{' '}
            <span className="text-slate-600">
              {maxPerRegistration} per registration
            </span>
          </div>
        )}

        {/* Status: Only show when full */}
        {isFull && (
          <div className="text-sm sm:text-base">
            <span className="font-semibold text-forest-900">Status:</span>{' '}
            <span className="text-red-600 font-semibold">
              {isPaid ? 'Sold Out' : 'Fully Booked'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCapacityDisplay;