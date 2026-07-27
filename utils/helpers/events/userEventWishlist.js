import { useDispatch, useSelector } from 'react-redux';
import {
  getEventWishlist,
  addToEventWishlist,
  removeFromEventWishlist,
} from '@/store/slices/users/userSlice';
import { useEffect } from 'react';

export const useEventWishlist = () => {
  const dispatch = useDispatch();
  const { tokenValidated, user, eventWishlist, eventWishlistStatus } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  // Guests attend only - the wishlist is a member feature, so a guest is treated as
  // logged out for the heart (same login prompt). isAuthenticated stays session-only
  // so the RSVP/checkout entry still works for guests. See featureplans/events-guest-attendee.md.
  const canWishlist = isAuthenticated && user?.role !== 'guest';

  useEffect(() => {
    if (canWishlist && eventWishlistStatus === 'idle') {
      dispatch(getEventWishlist()).catch((err) =>
        console.error('Failed to fetch event wishlist:', err)
      );
    }
  }, [dispatch, canWishlist, eventWishlistStatus]);

  const isInEventWishlist = (eventId) => {
    return eventWishlist?.some((e) => e._id === eventId);
  };

  const toggleEventWishlist = async (eventId) => {
    if (!canWishlist) {
      alert('Please log in to use the wishlist feature.');
      return;
    }

    const isInWishlist = isInEventWishlist(eventId);

    try {
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
      await dispatch(getEventWishlist()).unwrap();
    } catch (error) {
      console.error('Error updating event wishlist:', error);
    }
  };

  return {
    eventWishlist,
    eventWishlistStatus,
    isInEventWishlist,
    toggleEventWishlist,
    isAuthenticated,
    canWishlist,
  };
};
