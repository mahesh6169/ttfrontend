'use client';

import React from 'react';
import AdvertCard from './AdvertCard';
import LoadingSpinner from '../../LoadingSpinner';
import { useSelector } from 'react-redux';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';

const AdvertList = ({ adverts, advertStatus }) => {
  const {
    user,
    status: userStatus,
  } = useSelector((state) => state.user);

  const {
    advertWishlist,
    isInWishlist,
    toggleWishlist,
  } = useAdvertWishlist();

  // Show loading
  if (advertStatus === 'loading' || userStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  // No adverts
  if (!adverts || adverts.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No adverts found.</p>
      </div>
    );
  }

  return (
    <div id="AdvertGrid">
      <div
        id="AdvertGrids"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4"
      >
        {adverts.map((advert) => (
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

export default AdvertList;
