'use client';
import React from 'react';
import Link from 'next/link';
import AdvertFavourites from '@/components/users/AdvertFavourites';
import EventFavourites from '@/components/users/EventFavourites';

const FavouritesPage = () => {
  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/users/profile"
          className="inline-flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
        >
          <span>&lt;</span>
          <span>back</span>
        </Link>
      </div>

      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">Your Favourites</h1>
      <AdvertFavourites />
      <EventFavourites />
    </div>
  );
};

export default FavouritesPage;
