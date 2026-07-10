'use client';

import React, { useEffect }  from 'react';
import { useDispatch } from 'react-redux';
import EventCard from '@/components/events/eventcomponents/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import {  getEventWishlist } from '@/store/slices/users/userSlice';

const EventFavourites = () => {
  const dispatch = useDispatch();

  const {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
  } = useEventWishlist();

  useEffect(() => {
    dispatch(getEventWishlist());
  }, [dispatch]);

  // ⏳ Loading
  if (eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Empty: render nothing — the page shows one combined empty when BOTH sections are empty.
  if (!eventWishlist || eventWishlist.length === 0) {
    return null;
  }

  // ✅ Render event cards
  return (
    <div className="py-4">
      <h1 className="text-base text-teal-700 font-bold mb-2 text-centre">
        Your Favourite Events
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
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
