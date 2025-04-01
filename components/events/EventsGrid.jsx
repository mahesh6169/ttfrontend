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

const EventGrid = ({ events, status }) => {
  const dispatch = useDispatch();
  const {
    user,
    tokenValidated,
    status: userStatus,
    eventWishlist,
  } = useSelector((state) => state.user);

  const isAuthenticated = tokenValidated && !!user?._id;

  // 🟢 Fetch event wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getEventWishlist())
        .unwrap()
        .catch((err) => console.error('Failed to fetch event wishlist:', err));
    }
  }, [dispatch, isAuthenticated]);

  // 🔁 Toggle event in wishlist
  const handleEventWishlistToggle = async (eventId) => {
    try {
      if (!isAuthenticated) {
        alert('Please log in to use the wishlist feature.');
        return;
      }
  
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
  

  // ⏳ Show loading
  if (status === 'loading' || userStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  // 📭 Empty state
  if (!events || events.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No events found.</p>
      </div>
    );
  }

  // ✅ Render events
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
      {events.map((event) => (
        <EventCard
          key={event._id}
          event={event}
          isInWishlist={eventWishlist?.includes(event._id.toString())}
          onWishlistToggle={() => handleEventWishlistToggle(event._id)}
        />
      ))}
    </div>
  );
};

export default EventGrid;
