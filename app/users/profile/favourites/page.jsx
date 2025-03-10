'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/store/slices/userSlice';
import AdvertCard from '@/components/advertcomponents/AdvertCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';

const FavouritesPage = () => {
  const dispatch = useDispatch();
  const { user, status, error } = useSelector((state) => state.user);
  const [favourites, setFavourites] = useState([]);

  // Fetch wishlist on mount
  useEffect(() => {
    dispatch(getWishlist())
      .unwrap()
      .then(setFavourites)
      .catch((err) => toast.error(err || 'Failed to load wishlist.'));
  }, [dispatch]);

  const handleWishlistToggle = async (advertId) => {
    try {
      const isInWishlist = user?.wishlist?.includes(advertId);
      if (isInWishlist) {
        await dispatch(removeFromWishlist({ advertId })).unwrap();
        setFavourites((prev) => prev.filter((fav) => fav._id !== advertId));
      } else {
        await dispatch(addToWishlist({ advertId })).unwrap();
        setFavourites((prev) => [...prev, { _id: advertId }]); // Assume only _id if details are unavailable
      }
    } catch (error) {
      toast.error(error || 'Error updating wishlist.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (favourites.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg md:text-2xl font-bold mb-2 text-center">Your favourites list is empty.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-centerr">Your Favourites</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {favourites.map((advert) => (
          <AdvertCard
            key={advert._id}
            advert={advert}
            isInWishlist={user?.wishlist?.includes(advert._id)}
            status={status}
            onWishlistToggle={() => handleWishlistToggle(advert._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;
