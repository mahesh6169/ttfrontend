'use client';
import React from 'react';
import AdvertFavourites from '@/components/users/AdvertFavourites';
import EventFavourites from '@/components/users/EventFavourites';

const FavouritesPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold text-center mb-6">Your Favourites</h1>
      <AdvertFavourites />
      <EventFavourites />
    </div>
  );
};

export default FavouritesPage;
