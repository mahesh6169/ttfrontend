'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getEventWishlist,
  addToEventWishlist,
  removeFromEventWishlist,
} from '@/store/slices/userSlice';
import EventCard from './EventCard';
import LoadingSpinner from '../LoadingSpinner';

const EventGrid = ({ events, eventStatus }) => {
  const dispatch = useDispatch();
  const {
    tokenValidated,
    user,
    eventWishlist,
    eventWishlistStatus,
  } = useSelector((state) => state.user);

  const isAuthenticated = tokenValidated && !!user?._id;

  // ✅ Fetch wishlist if authenticated and idle
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getEventWishlist())
        .unwrap()
        .catch((err) => console.error('Failed to fetch event wishlist:', err));
    }
  }, [dispatch, isAuthenticated]);

  // ✅ Handle toggle
  const handleWishlistToggle = async (eventId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }

    try {
      const isInWishlist = user?.eventWishlist?.includes(eventId.toString());
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
      // ✅ Refresh wishlist to reflect updates (optional if using optimistic update)
      await dispatch(getEventWishlist()).unwrap();
    } catch (error) {
      console.error('Error updating event wishlist:', error);
    }
  };

  // ⏳ Loading
  if (eventStatus === 'loading' || eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  // 😐 No events
  if (!events || events.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No events found.</p>
      </div>
    );
  }

  // ✅ Render events
  return (
    <div className="w-full">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          isInWishlist={eventWishlist?.some((e) => e._id === event._id)}
          onWishlistToggle={() => handleWishlistToggle(event._id)}
        />
      ))}
    </div>
    </div>
  );
};

export default EventGrid;
