'use client';

import React from 'react';
import EventCard from '@/components/events/eventcomponents/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';

const EventFavourites = () => {
  const {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
  } = useEventWishlist();

  // ⏳ Loading
  if (eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // 😐 Empty state
  if (!eventWishlist || eventWishlist.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg md:text-2xl font-bold mb-2 text-left">
          No Favorites In Events
        </p>
      </div>
    );
  }

  // ✅ Render event cards
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Your Favourite Events
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {eventWishlist.map((event) => (
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

export default EventFavourites;
