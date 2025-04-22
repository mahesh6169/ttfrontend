'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '@/store/slices/users/userSlice';
import AdvertCard from '@/components/adverts/advertcomponents/AdvertCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdvertFavourites = () => {
  const dispatch = useDispatch();

  const {
    advertWishlist, // ✅ full advert objects
    advertWishlistStatus,
    advertWishlistError,
    user,
  } = useSelector((state) => state.user);

  const isAuthenticated = user && user._id;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist())
        .unwrap()
        .catch((err) => toast.error(err || 'Failed to load wishlist.'));
    }
  }, [dispatch, isAuthenticated]);

  const handleToggle = async (advertId) => {
    try {
      const isInWishlist = user?.advertWishlist?.includes(advertId.toString());
      if (isInWishlist) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
      }
    } catch (error) {
      toast.error(error || 'Error updating wishlist.');
    }
  };

  if (advertWishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (advertWishlistError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-lg">{advertWishlistError}</p>
      </div>
    );
  }

  if (!advertWishlist || advertWishlist.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg md:text-2xl font-bold mb-2 text-left">
          No Favorites In adverts
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Your Favourites Adverts
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {advertWishlist.map((advert) => (
          <AdvertCard
            key={advert._id}
            advert={advert}
            isInWishlist={user?.advertWishlist?.includes(advert._id.toString())}
            onWishlistToggle={() => handleToggle(advert._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvertFavourites;
