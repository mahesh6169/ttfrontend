import React from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';
import { FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { MdRepeat } from 'react-icons/md';

const EventCard = ({ event, isInWishlist, onWishlistToggle }) => {
  const { title, dateTime, venue, address, images, createdAt, timeZone } = event;

  // 🕒 Format event date in event timezone (or fallback to Sydney)
  const formattedDate = formatInTimeZone(
    dateTime,
    timeZone || 'Australia/Sydney',
    'EEE dd MMM yyyy, h:mm a'
  );

  // 🗓️ Calculate how long ago the event was posted
  const postedDaysAgo = differenceInDays(new Date(), new Date(createdAt));
  const postedText =
    postedDaysAgo <= 15
      ? (
        postedDaysAgo === 0
          ? 'Today'
          : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`
        )
      : format(new Date(createdAt), 'dd MMM yyyy');

  return (
    <div
      id="EventCard"
      className="relative border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200"
    >
      {/* Wishlist Button */}
      <button
        onClick={onWishlistToggle}
        className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
          isInWishlist
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-300 hover:bg-gray-400'
        }`}
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart
          className={`text-sm sm:text-base ${
            isInWishlist ? 'text-white' : 'text-gray-700'
          }`}
        />
      </button>

      {/* Main Card */}
      <Link href={`/events/views/${event._id}`} className="block">
        {/* Image */}
        <div className="relative w-full h-40 sm:h-48 md:h-56">
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
        <div className="flex items-center px-2">
          <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
            {title}
          </h2>
          {(event.recurrence?.isRecurring || event.isRecurringInstance) && (
            <MdRepeat 
              className="ml-1 text-gray-800 flex-shrink-0" 
              title="Recurring Event"
            />
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center text-sm text-gray-600 px-1 mb-1">
          <BsCalendar2Event className="mr-1" />
          <span className="text-xs font-medium text-gray-600">
            {formattedDate}
          </span>
        </div>

        {/* Location & Posted Info */}
        <div className="flex items-center gap-1 px-2 truncate">
          <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
          <span className="text-xs font-medium text-gray-600">
            {address?.suburb || address?.state
              ? [address?.suburb, address?.state].filter(Boolean).join(', ')
              : venue}
          </span>
        </div>
        <div className="text-xs font-medium text-gray-600 text-right whitespace-nowrap px-2 mb-1">
          {postedText}
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
