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

  // 😐 Empty state
  if (!eventWishlist || eventWishlist.length === 0) {
    return (
      <div className="text-center py-10 border border-gray-300 rounded-lg shadow-md">
        <p className="text-base text-teal-700 font-bold mb-2 text-centre">
        You have no favorites in Events
        </p>
      </div>
    );
  }

  // ✅ Render event cards
  return (
    <div className="container mx-auto py-8 ">
      <h1 className="text-base text-teal-700 font-bold mb-2 text-centre">
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
