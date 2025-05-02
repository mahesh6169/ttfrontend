// utils/hooks/useAdvertWishlist.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '@/store/slices/users/userSlice';

export function useAdvertWishlist() {
  const dispatch = useDispatch();
  const {
    tokenValidated,
    user,
    advertWishlist,
  } = useSelector((state) => state.user);

  const isAuthenticated = tokenValidated && !!user._id;

  // Fetch on mount if logged in
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist()).catch(console.error);
    }
  }, [dispatch, isAuthenticated]);

  // Check if advert is in wishlist
  const isInWishlist = (advertId) =>
    advertWishlist?.some((adv) => adv._id === advertId);

  // Toggle logic
  const toggleWishlist = async (advertId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }

    try {
      if (isInWishlist(advertId)) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
      }
      await dispatch(getWishlist()).unwrap(); // Refresh
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  return {
    advertWishlist,
    isInWishlist,
    toggleWishlist,
    isAuthenticated,
  };
}
