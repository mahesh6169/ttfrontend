'use client';

import React from 'react';
import EventCard from '@/components/events/eventcomponents/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';

const EventGrid = ({ events, eventStatus }) => {
  const {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
  } = useEventWishlist();

  if (eventStatus === 'loading' || eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No events found.</p>
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
