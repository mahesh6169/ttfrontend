'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getEventWishlist,
  addToEventWishlist,
  removeFromEventWishlist,
} from '@/store/slices/users/userSlice';
import EventCard from '@/components/events/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

const EventFavourites = () => {
  const dispatch = useDispatch();

  const {
    eventWishlist, // ✅ full event objects
    eventWishlistStatus,
    eventWishlistError,
    user,
  } = useSelector((state) => state.user);

  const isAuthenticated = user && user._id;

  // ✅ Load event wishlist on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getEventWishlist())
        .unwrap()
        .catch((err) => toast.error(err || 'Failed to load event wishlist'));
    }
  }, [dispatch, isAuthenticated]);

  // ✅ Toggle handler for wishlist
  const handleToggle = async (eventId) => {
    try {
      const isInWishlist = user?.eventWishlist?.includes(eventId.toString());
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
    } catch (err) {
      toast.error(err || 'Error updating event wishlist');
    }
  };

  // ⏳ Loading state
  if (eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // ❌ Error state
  if (eventWishlistError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-lg">{eventWishlistError}</p>
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
            isInWishlist={user?.eventWishlist?.includes(event._id.toString())}
            onWishlistToggle={() => handleToggle(event._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default EventFavourites;
