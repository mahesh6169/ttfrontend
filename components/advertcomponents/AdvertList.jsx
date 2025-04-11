'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/store/slices/userSlice';
import AdvertCard from './AdvertCard';
import LoadingSpinner from '../LoadingSpinner';

const AdvertList = ({ adverts, advertStatus }) => {
  const dispatch = useDispatch();
  const { tokenValidated, user, status: userStatus, advertWishlist, advertWishlistStatus } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user._id;

  // Fetch wishlist if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist()).unwrap().catch((err) => console.error('Failed to fetch wishlist:', err));
    }
  }, [dispatch, isAuthenticated]);

  // Handle wishlist toggle
  const handleWishlistToggle = async (advertId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
  
    try {
      const isInWishlist = advertWishlist?.some((adv) => adv._id === advertId);
      if (isInWishlist) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
      }
        // ✅ Refresh the list immediately
    await dispatch(getWishlist()).unwrap();
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };
  

  // Show loading spinner while fetching data
  if (advertStatus === 'loading' || userStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Display message if no adverts found
  if (!adverts || adverts.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No adverts found.</p>
      </div>
    );
  }

  // Render adverts
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
      {adverts.map((advert) => (
        <AdvertCard
          key={advert._id}
          advert={advert}
          isInWishlist={advertWishlist?.some((adv) => adv._id === advert._id)}
          onWishlistToggle={() => handleWishlistToggle(advert._id)}
        />
      ))}
    </div>
  );
};

export default AdvertList;
