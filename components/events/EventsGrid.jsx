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
  const { tokenValidated, user, eventWishlistStatus } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;

  // ✅ Fetch event wishlist only once when authenticated
  useEffect(() => {
    if (isAuthenticated && eventWishlistStatus === 'idle') {
      dispatch(getEventWishlist())
        .unwrap()
        .catch((err) => console.error('Failed to fetch event wishlist:', err));
    }
  }, [dispatch, isAuthenticated, eventWishlistStatus]);

  // 🧠 Shortcut access to eventWishlist from Redux state
  const eventWishlist = useSelector((state) => state.user.eventWishlist);

  // ✅ Toggle event wishlist handler
  const handleWishlistToggle = async (eventId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
  
    try {
      const isInWishlist = eventWishlist?.includes(eventId.toString());
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
    } catch (error) {
      console.error('Error updating event wishlist:', error);
    }
  };

  // 🔁 Loading spinner if still loading
  if (eventStatus === 'loading' || eventWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  // 🚫 No events
  if (!events || events.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No events found.</p>
      </div>
    );
  }

  // ✅ Render event cards
console.log('✔ Wishlist from Redux:', eventWishlist);
events.forEach((event) => {
  console.log('🎫 Event ID:', event._id?.toString());
  console.log('💖 isInWishlist:', eventWishlist?.includes(event._id?.toString()));
});


  // ✅ Render event cards
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          isInWishlist={eventWishlist?.includes(event._id.toString())}
          onWishlistToggle={() => handleWishlistToggle(event._id?.toString())}
        />
      ))}
    </div>
  );
};

export default EventGrid;
