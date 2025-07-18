// components/events/eventcomponents/EventCapacityDisplay.jsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUsers } from 'react-icons/fa';
import {
  fetchEventCapacity,
  selectEventCapacityState,
  selectShouldRefreshCapacity,
   markCapacityStale,
} from '@/store/slices/events/eventCapacitySlice';

const EventCapacityDisplay = ({ eventId, isPaid = false, showInTicketSection = false, maxPerRegistration }) => {
  const dispatch = useDispatch();
  
  // ✅ Get capacity state from Redux
  const { capacity, isLoading, error } = useSelector(state => 
    selectEventCapacityState(state, eventId)
  );
  
  // ✅ Check if data needs refresh
  const shouldRefresh = useSelector(state => 
    selectShouldRefreshCapacity(state, eventId)
  );

  const registrationStatus = useSelector(state => state.freeEvents.registrationStatus);

  // ✅ Fetch capacity data when needed
  useEffect(() => {
    if (!eventId) return;
    
    // Skip fetch for paid events when not in ticket section (maintains original behavior)
    if (isPaid && !showInTicketSection) return;
    
    // Fetch if no data exists or data is stale
    if (shouldRefresh) {
      console.log(`📊 EventCapacityDisplay: Fetching capacity for ${eventId}`);
      dispatch(fetchEventCapacity(eventId));
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
      <div className="bg-gray-50 p-3 rounded-lg mb-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="bg-red-50 p-3 rounded-lg mb-4">
        <p className="text-red-600 text-sm">
          Unable to load capacity: {error}
        </p>
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
    <div className="bg-gray-50 p-3 rounded-lg mb-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <FaUsers className="mr-2 text-blue-600" />
        Event Capacity
      </h3>
      
      <div className="space-y-2">
        {/* Total Capacity */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Total Capacity:</span>
          <span className="font-medium text-gray-900">
            {isUnlimited ? 'Unlimited' : `${totalCapacity} people`}
          </span>
        </div>

        {/* Remaining Capacity */}
<div className="flex justify-between items-center">
  <span className="text-gray-700">Remaining:</span>
  <span className="font-medium text-green-600">
    {isUnlimited ? 'Unlimited' : Math.max(totalCapacity - registeredCount, 0)}
  </span>
</div>

{/* Max Attendees Per Registration */}
{typeof maxPerRegistration === 'number' && (
  <div className="flex justify-between items-center mt-2">
    <span className="text-gray-700">
      Max per Registration <span className="text-red-500">*</span>
    </span>
    <span className="italic text-gray-600">
      {maxPerRegistration}
    </span>
  </div>
)}


        {/* Status: Only show when full */}
        {isFull && (
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Status:</span>
            <span className="font-medium text-red-600">
              {isPaid ? 'Sold Out' : 'Fully Booked'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCapacityDisplay;