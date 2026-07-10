'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import AdvertFavourites from '@/components/users/AdvertFavourites';
import EventFavourites from '@/components/users/EventFavourites';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';

const FavouritesPage = () => {
  // Shared wishlist state (same sources the two sections read from)
  const { advertWishlistStatus } = useSelector((state) => state.user);
  const { advertWishlist } = useAdvertWishlist();
  const { eventWishlist, eventWishlistStatus } = useEventWishlist();

  // A status is "settled" once it's no longer idle/loading (success or failed).
  const settled = (s) => Boolean(s) && s !== 'idle' && s !== 'loading';
  const bothSettled = settled(advertWishlistStatus) && settled(eventWishlistStatus);
  const bothEmpty =
    (advertWishlist?.length ?? 0) === 0 && (eventWishlist?.length ?? 0) === 0;

  return (
    <div>
      <ProfilePageHeading title="Your Favourites" />
      {bothSettled && bothEmpty ? (
        // One page-level empty when nothing is favourited (listings or events).
        <EmptyState
          title="No favourites yet"
          description="Listings and events you save will show up here."
        />
      ) : (
        // Otherwise keep the two sections (each shows its own list / per-section state).
        <>
          <AdvertFavourites />
          <EventFavourites />
        </>
      )}
    </div>
  );
};

export default FavouritesPage;
