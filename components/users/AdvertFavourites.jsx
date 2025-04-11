'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '@/store/slices/userSlice';
import AdvertCard from '@/components/advertcomponents/AdvertCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

const AdvertFavourites = () => {
  const dispatch = useDispatch();

  // ✅ Use the full populated wishlist from Redux, not user.wishlist
  const { wishlist, wishlistStatus, wishlistError } = useSelector((state) => state.user);

  // ✅ Fetch wishlist on first load.
  useEffect(() => {
    dispatch(getWishlist())
      .unwrap()
      .catch((err) => toast.error(err || 'Failed to load wishlist.'));
  }, [dispatch]);
  
  

  // ✅ Toggle advert in wishlist
  const handleToggle = async (advertId) => {
    try {
      const isInWishlist = wishlist?.some((adv) => adv._id === advertId);
      if (isInWishlist) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
      }
    } catch (error) {
      toast.error(error || 'Error updating wishlist.');
    }
  };

  // ⏳ Loading
  if (wishlistStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // ❌ Error
  if (wishlistError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-lg">{wishlistError}</p>
      </div>
    );
  }

  // 😐 No favourites
  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg md:text-2xl font-bold mb-2 text-left">
          No Favorites In adverts
        </p>
      </div>
    );
  }

  // ✅ Render cards
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Your Favourites Adverts
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {wishlist.map((advert) => (
          <AdvertCard
            key={advert._id}
            advert={advert}
            isInWishlist={true} // ✅ Always true because it's coming from your wishlist
            onWishlistToggle={() => handleToggle(advert._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default AdvertFavourites;
