// components/events/eventcomponents/EventCapacityDisplay.jsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUsers } from 'react-icons/fa';
import {
  fetchEventCapacity,
  selectEventCapacityStateMemoized,
  selectShouldRefreshCapacity,
  markCapacityStale,
} from '@/store/slices/events/eventCapacitySlice';

const EventCapacityDisplay = ({ eventId, isPaid = false, showInTicketSection = false, maxPerRegistration }) => {
  const dispatch = useDispatch();
  
  // ✅ Get capacity state from Redux
  const { capacity, isLoading, error } = useSelector(state => 
    selectEventCapacityStateMemoized(state, eventId)
  );
  
  // ✅ Check if data needs refresh
  const shouldRefresh = useSelector(state => 
    selectShouldRefreshCapacity(state, eventId)
  );

  const registrationStatus = useSelector(state => state.freeEvents.registrationStatus);

  // ✅ Fetch capacity data when needed
  useEffect(() => {
    console.log(`📊 EventCapacityDisplay: Component mounted/updated with eventId=${eventId}, isPaid=${isPaid}, showInTicketSection=${showInTicketSection}, shouldRefresh=${shouldRefresh}`);
    
    if (!eventId) {
      console.log(`❌ EventCapacityDisplay: No eventId provided, skipping fetch`);
      return;
    }
    
    // Remove the skip logic - we should always fetch capacity when needed
    // The display logic can handle how to show it differently for paid vs free events
    
    // Fetch if no data exists or data is stale
    if (shouldRefresh) {
      console.log(`📊 EventCapacityDisplay: Fetching capacity for ${eventId} (shouldRefresh=${shouldRefresh})`);
      dispatch(fetchEventCapacity(eventId));
    } else {
      console.log(`✅ EventCapacityDisplay: Using cached capacity for ${eventId}`);
    }
  }, [eventId, isPaid, showInTicketSection, shouldRefresh, dispatch]);

  // ✅ Refresh capacity when registration/unregistration succeeds
useEffect(() => {
  if (registrationStatus === 'succeeded' && eventId) {
    console.log(`🔄 Registration succeeded, refreshing capacity for ${eventId}`);
    dispatch(markCapacityStale(eventId));
  }
}, [registrationStatus, eventId, dispatch]);

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

  // ✅ For paid events in ticket section, show simplified capacity info
  if (isPaid && showInTicketSection) {
    const { total, remaining, isUnlimited, status } = capacity;
    
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

  // ✅ Full display for free events (and paid events in main view)
  const {
    total: totalCapacity,
    sold: registeredCount,
    isUnlimited,
    status
  } = capacity;

  const isFull = status === 'sold-out' || (totalCapacity > 0 && registeredCount >= totalCapacity);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Total Capacity */}
      <div className="text-sm sm:text-base">
        <span className="font-semibold text-gray-700">Total Capacity:</span>{' '}
        <span className="text-gray-600">
          {isUnlimited ? 'Unlimited' : `${totalCapacity} people`}
        </span>
      </div>

      {/* Remaining Capacity */}
      <div className="text-sm sm:text-base">
        <span className="font-semibold text-gray-700">Remaining:</span>{' '}
        <span className="text-gray-600">
          {isUnlimited ? 'Unlimited' : Math.max(totalCapacity - registeredCount, 0)}
        </span>
      </div>

      {/* Max Attendees Per Registration */}
      {typeof maxPerRegistration === 'number' && (
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-gray-700">
            Max per Registration:
          </span>{' '}
          <span className="text-gray-600">
            {maxPerRegistration}
          </span>
        </div>
      )}

      {/* Status: Only show when full */}
      {isFull && (
        <div className="text-sm sm:text-base">
          <span className="font-semibold text-gray-700">Status:</span>{' '}
          <span className="text-red-600 font-semibold">
            {isPaid ? 'Sold Out' : 'Fully Booked'}
          </span>
        </div>
      )}
    </div>
  );
};

export default EventCapacityDisplay;