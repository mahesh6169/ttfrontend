import React from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';
import { FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';

const EventCard = ({ event, isInWishlist, onWishlistToggle }) => {
  const { title, dateTime, venue, address, images, createdAt, timeZone } = event;

  // 🕒 Format event date
  const formattedDate = new Date(dateTime).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timeZone || 'Australia/Sydney',
  });

  // 🗓️ Calculate how long ago the event was posted
  const postedDaysAgo = differenceInDays(new Date(), new Date(createdAt));
  const postedText =
    postedDaysAgo <= 15
      ? `${postedDaysAgo === 0 ? 'Today' : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`}`
      : format(new Date(createdAt), 'dd MMM yyyy');

  return (
    <div className="relative border rounded-lg shadow-md p-4 bg-gray-100 hover:bg-gray-200 w-full">
      {/* Wishlist Button */}
      <button
        onClick={onWishlistToggle}
        className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
          isInWishlist ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 hover:bg-gray-400'
        }`}
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart
          className={`text-sm sm:text-base md:text-lg ${
            isInWishlist ? 'text-white' : 'text-gray-700'
          }`}
        />
      </button>

      {/* Main Card */}
      <Link href={`/events/views/${event._id}`} className="block">
        {/* Image */}
        <div className="w-full h-40 md:h-52 relative">
          {images?.length > 0 ? (
            <img
              src={images[0].url}
              alt={title}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 rounded-md">
              No Image Available
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="mt-3 font-semibold text-base md:text-lg truncate">{title}</h2>

        {/* Date & Time */}
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <BsCalendar2Event className="mr-2" />
          <span>{formattedDate}</span>
        </div>

        {/* Location & Posted Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
          <div className="flex items-center gap-1 truncate">
            <MdLocationOn />
            <span>{address?.suburb || address?.state || venue}</span>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">{postedText}</div>
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
