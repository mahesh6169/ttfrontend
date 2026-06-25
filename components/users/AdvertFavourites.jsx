'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist } from '@/store/slices/users/userSlice';
import AdvertCard from '@/components/adverts/advertcomponents/AdvertCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';

const AdvertFavourites = () => {
  const dispatch = useDispatch();

  const {
    advertWishlistStatus,
    advertWishlistError,
  } = useSelector((state) => state.user);

  const {
    advertWishlist,
    isInWishlist,
    toggleWishlist,
  } = useAdvertWishlist();

  useEffect(() => {
    dispatch(getWishlist())
      .unwrap()
      .catch((err) => toast.error(err || 'Failed to load Advert wishlist.'));
  }, [dispatch]);

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

  // Empty: render nothing — the page shows one combined empty when BOTH sections are empty.
  if (!advertWishlist || advertWishlist.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      <h1 className="text-base text-teal-700 font-bold mb-2 text-centre">
        Your Favourite Listings.
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {advertWishlist.map((advert) => (
          <AdvertCard
            key={advert._id}
            advert={advert}
            isInWishlist={isInWishlist(advert._id)}
            onWishlistToggle={() => toggleWishlist(advert._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvertFavourites;
