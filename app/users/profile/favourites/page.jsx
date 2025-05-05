'use client';
import React from 'react';
import AdvertFavourites from '@/components/users/AdvertFavourites';
import EventFavourites from '@/components/users/EventFavourites';

const FavouritesPage = () => {
  return (
    <div className="m-2">
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">Your Favourites</h1>
      <AdvertFavourites />
      <EventFavourites />
    </div>
  );
};

export default FavouritesPage;
