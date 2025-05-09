'use client';

import React from 'react';
import AdvertCard from './AdvertCard';
import LoadingSpinner from '../../LoadingSpinner';
import SkeletonLoader from '../../SkeletonLoader'; 
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

 // No adverts
if ((advertStatus === 'idle' || advertStatus === 'loading') && (!adverts || adverts.length === 0)) {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <SkeletonLoader />
    </div>
  );
}

if (advertStatus === 'success' && (!adverts || adverts.length === 0)) {
  return (
    <div className="flex justify-center items-center text-center p-8">
      <p className="text-xs sm:text-sm text-gray-800">No Adverts Listed</p>
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
