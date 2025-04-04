import React from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';
import { FaHeart, FaFontAwesomeFlag } from 'react-icons/fa';
import { BsChatRightDots } from 'react-icons/bs';

const EventCard = ({ event, isInWishlist, onWishlistToggle }) => {
  const { title, dateTime, venue, address, images } = event;

  const date = new Date(dateTime).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timeZone || 'Australia/Sydney',
  });

  return (
    <div className="relative border rounded-lg shadow-md p-4 bg-white hover:shadow-lg w-full">
      {/* Wishlist Button - Top Right */}
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

      {/* Main Content */}
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

        {/* Date and Time */}
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <BsCalendar2Event className="mr-2" />
          <span>{date}</span>
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <MdLocationOn className="mr-2" />
          <span>{address?.suburb || address?.state || venue}</span>
        </div>

        {/* Chat & Report Icons */}
        <div className="flex justify-between mt-4 text-gray-600">
          {/* Chat */}
          <div className="flex flex-col items-center text-sm sm:text-base md:text-lg">
            <BsChatRightDots className="mb-1" size={20} />
            <span>Chat</span>
          </div>

          {/* Report */}
          <div className="flex flex-col items-center text-sm sm:text-base md:text-lg">
            <FaFontAwesomeFlag className="mb-1" size={20} />
            <span>Report</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
