'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getEventWishlist,
  addToEventWishlist,
  removeFromEventWishlist,
} from '@/store/slices/userSlice';
import EventCard from '@/components/events/EventCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

const EventFavourites = () => {
  const dispatch = useDispatch();
  const { eventWishlistStatus, eventWishlist } = useSelector(
    (state) => state.user
  );

  // Load full event wishlist on mount
  useEffect(() => {
    dispatch(getEventWishlist())
      .unwrap()
      .catch((err) => {
        toast.error(err || 'Failed to load favourite events');
      });
  }, [dispatch]);

  // Toggle handler
  const handleToggle = async (eventId) => {
    try {
      const isInWishlist = eventWishlist.includes(eventId.toString());
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
    } catch (err) {
      toast.error(err || 'Error updating event wishlist.');
    }
  };

  if (eventWishlistStatus === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Your Favourite Events</h2>

      {eventWishlist.length === 0 ? (
        <p className="text-gray-500">No favourite events yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {eventWishlist.map((event) => {
            const eventId = event?._id || event; // handles both full object or just ID
            return (
              <EventCard
                key={eventId}
                event={event}
                isInWishlist={true}
                onWishlistToggle={() => handleToggle(eventId)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventFavourites;
