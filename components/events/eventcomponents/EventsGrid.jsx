'use client';

import React from 'react';
import EventCard from '@/components/events/eventcomponents/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonLoader from '../../SkeletonLoader'; 
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';

const EventGrid = ({ events, eventStatus }) => {
  const {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
  } = useEventWishlist();

 // 👉 Loading State (use Skeleton if still initializing or actively loading)
 if (
  (eventStatus === 'idle' || eventStatus === 'loading' || eventWishlistStatus === 'loading') &&
  (!events || events.length === 0)
) {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <SkeletonLoader />
    </div>
  );
}

// 👉 Empty State
if (eventStatus === 'success' && (!events || events.length === 0)) {
  return (
    <div className="flex justify-center items-center text-center p-8">
      <p className="text-xs sm:text-sm text-gray-800">No Events Listed</p>
    </div>
  );
}

  return (
    <div id="EventGrid">
      <div id="EventGrids" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            isInWishlist={isInEventWishlist(event._id)}
            onWishlistToggle={() => toggleEventWishlist(event._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default EventGrid;
