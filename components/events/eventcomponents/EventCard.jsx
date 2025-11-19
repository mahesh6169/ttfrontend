import React from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';
import { FaHeart } from 'react-icons/fa';
import { format, differenceInDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { MdRepeat } from 'react-icons/md';
import { FaMoneyBillWave } from 'react-icons/fa';
import { FaClipboardList } from 'react-icons/fa';

const EventCard = ({ event, isInWishlist, onWishlistToggle }) => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;
  const { title, dateTime, venue, address, images, createdAt, timeZone, isPaid, isAdvertiseOnly } = event;

  const getStateFromTimezone = (timezone) => {
  const timezoneMap = {
    'Australia/Sydney': 'NSW',
    'Australia/Melbourne': 'VIC', 
    'Australia/Brisbane': 'QLD',
    'Australia/Perth': 'WA',
    'Australia/Adelaide': 'SA',
    'Australia/Hobart': 'TAS',
    'Australia/Darwin': 'NT'
  };
  return timezoneMap[timezone] || timezone.split('/')[1];
};

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
      className="relative rounded-lg shadow-md"
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
      <Link 
        href={`/events/views/${event._id}`} 
        className="block"
        onClick={() => {
          // Save the current URL if we're coming from a listing view
          if (typeof window !== 'undefined' && window.location.pathname.includes('/listings/views/')) {
            localStorage.setItem('eventViewReturnUrl', window.location.pathname);
          }
        }}
      >
        {/* Image */}
        <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-md">
          <img
            src={images?.[0]?.url || FALLBACK_IMAGE}
            alt={title}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Title */}
        <div className="px-2">
          <h2 className="text-xs sm:text-sm text-center font-medium my-1 px-2 truncate text-gray-800">
            {title}
          </h2>
        </div>

{/* Date & Time + Location */}
        <div className="px-2 mb-1">
{/* Date Row */}
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <BsCalendar2Event className="mr-1 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-600">
              {timeZone ? 
                formatInTimeZone(dateTime, timeZone, 'EEE dd MMM yyyy') :
                format(new Date(dateTime), 'EEE dd MMM yyyy')
              }
            </span>
            {(event.recurrence?.isRecurring || event.isRecurringInstance) && (
              <MdRepeat 
                className="ml-1 text-gray-600 flex-shrink-0" 
                title="Recurring Event"
                size={14}
              />
            )}
          </div>
          
{/* Time Row */}
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <div className="w-4 h-4 mr-1 flex items-center justify-center">
              <span className="text-xs">🕙</span>
            </div>
<span className="text-xs font-medium text-gray-600">
  {formatInTimeZone(dateTime, timeZone, 'h:mm a')}, {getStateFromTimezone(timeZone)}
</span>
          </div>
          
          {/* Location Row */}
          <div className="flex items-center gap-1">
            <MdLocationOn className="text-xs font-medium text-gray-600 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-600 truncate">
              {address?.suburb || address?.state
                ? [address?.suburb, address?.state].filter(Boolean).join(', ')
                : venue}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 mb-1">
          <div className="flex items-center gap-1">
            {isPaid ? (
              <>
                <FaMoneyBillWave 
                  className="text-gray-600" 
                  size={12}
                  title="Paid Event"
                />
                <span className="text-[10px] text-gray-600 font-medium">
                  Paid
                </span>
              </>
            ) : !isAdvertiseOnly ? (
              <>
                <FaClipboardList 
                  className="text-gray-600" 
                  size={12}
                  title="Free Event - RSVP"
                />
                <span className="text-[10px] text-gray-600 font-medium">
                  RSVP
                </span>
              </>
            ) : null}
          </div>
          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
            {postedText}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
