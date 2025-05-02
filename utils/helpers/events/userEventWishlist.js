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

  useEffect(() => {
    if (isAuthenticated && eventWishlistStatus === 'idle') {
      dispatch(getEventWishlist()).catch((err) =>
        console.error('Failed to fetch event wishlist:', err)
      );
    }
  }, [dispatch, isAuthenticated, eventWishlistStatus]);

  const isInEventWishlist = (eventId) => {
    return eventWishlist?.some((e) => e._id === eventId);
  };

  const toggleEventWishlist = async (eventId) => {
    if (!isAuthenticated) {
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
  };
};
