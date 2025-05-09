'use client';

import React, { useState } from 'react';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { differenceInDays, format } from 'date-fns';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import SendMessage from '@/components/chat/SendMessage';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';


const SingleEventCard = ({ event, chatProps }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { isInEventWishlist, toggleEventWishlist, isAuthenticated } = useEventWishlist();
  const isInWishlist = isInEventWishlist(event._id);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? event.images.length - 1 : prev - 1
    );
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
    toggleEventWishlist(event._id);
  };

  const eventTime = new Date(event.dateTime);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const eventZone = event.timeZone || localTimeZone;

  const getCityFromZone = (zone) =>
    zone?.split('/')?.[1]?.replace('_', ' ') || zone;

  const eventZoneCity = getCityFromZone(eventZone);
  const localZoneCity = getCityFromZone(localTimeZone);

  const eventTimeStr = eventTime.toLocaleTimeString('en-AU', {
    timeZone: eventZone,
    hour: 'numeric',
    minute: '2-digit',
  });

  const localTimeStr = eventTime.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const eventDateStr = eventTime.toLocaleDateString('en-AU', {
    timeZone: eventZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const showLocalTime = eventZone !== localTimeZone;

  const postedDaysAgo = differenceInDays(new Date(), new Date(event.createdAt));
  const postedText =
    postedDaysAgo <= 15
      ? postedDaysAgo === 0
        ? 'Today'
        : `${postedDaysAgo} day${postedDaysAgo > 1 ? 's' : ''} ago`
      : format(new Date(event.createdAt), 'dd MMM yyyy');

  return (
    <div className="border rounded shadow-md mx-auto">
      {/* Image Section */}
      <div className="relative w-full mx-auto bg-gray-200 flex  overflow-hidden rounded">
        {event.images?.length > 0 ? (
          <img
            src={event.images[currentImageIndex].url}
            alt="Event"
            className="object-cover h-full w-full cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
        ) : (
          <span className="text-gray-500">No Image Available</span>
        )}

        {event.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full z-10 ${
            isInWishlist ? 'bg-red-500' : 'bg-gray-300'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-lg ${isInWishlist ? 'text-white' : 'text-gray-700'}`}
          />
        </button>
      </div>

      {isFullscreen && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
    <img
      src={event.images[currentImageIndex].url}
      alt="Event Full"
      className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
    />

    {/* Close Button */}
    <button
      onClick={() => setIsFullscreen(false)}
      className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaTimes size={30} />
    </button>

    {/* Prev/Next Buttons */}
    <button
      onClick={handlePrevImage}
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaChevronLeft />
    </button>
    <button
      onClick={handleNextImage}
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaChevronRight />
    </button>
  </div>
)}


      {/* Event Info */}
      <div className="p-4 space-y-4">
  {/* Title */}
  {event.title && (
    <div className="my-2 px-2">
      <h2 className="text-base sm:text-lg text-center font-medium my-1 px-2 text-gray-800 break-words ">{event.title}</h2>
    </div>
  )}

  {/* Category */}
  {event.category && (
    <div className="flex justify-start sm:gap-4 text-xs sm:text-sm text-gray-800 mb-2 px-2 text-left">
      <strong>Category:</strong> {event.category}
    </div>
  )}

  {/* Posted By */}
  {(event.postedBy?.name || postedText) && (
    <div className="flex justify-start gap-4 text-xs sm:text-sm text-gray-800 text-left mb-2 px-2">
      {event.postedBy?.name && (
        <span>
          <strong>Posted By:</strong> {event.postedBy.name}
        </span>
      )}
      {postedText && (
        <span>
          <strong>Posted:</strong> {postedText}
        </span>
      )}
    </div>
  )}

  {/* Event Details */}
  <div className="border border-gray-300 p-4 rounded text-left">
    <h3 className="text-sm sm:text-base text-start font-medium mb-2">Event Details</h3>
    {eventDateStr && <p className="text-xs sm:text-sm text-gray-800">🗓️ {eventDateStr}</p>}
    {eventTimeStr && (
      <p className="text-xs sm:text-sm text-gray-800">
        ⏰ {eventTimeStr} {eventZoneCity}
        {showLocalTime && <> || {localTimeStr} {localZoneCity}</>}
      </p>
    )}
    {(event.venue || event.address?.formattedAddress) && (
      <p className="mt-2 flex gap-2 items-start text-gray-700">
        <MdLocationOn className="text-xs sm:text-sm text-gray-800" />
        <span className="flex flex-col text-xs sm:text-sm text-gray-800">
          {event.venue && <span>{event.venue}</span>}
          {event.address?.formattedAddress && (
            <span>{event.address.formattedAddress}</span>
          )}
        </span>
      </p>
    )}
  </div>

  {/* Event Organiser */}
  {/* Event Organiser */}
{event.organiser?.name && (
  <div className="border border-gray-300 p-4 rounded text-left">
    <h3 className="text-sm sm:text-base text-start font-medium mb-2">Organiser Details</h3>

    {event.organiser.name && (
      <p className="text-xs sm:text-sm text-gray-800 px-2">
        <strong>Name/Organisation:</strong> {event.organiser.name}
      </p>
    )}
    {event.organiser.email && (
      <p className="text-xs sm:text-sm text-gray-800 px-2">
        <strong>Email:</strong> {event.organiser.email}
      </p>
    )}
    {event.organiser.website && (
      <p className="text-xs sm:text-sm text-gray-800 px-2">
        <strong>Website:</strong>{' '}
        <a
          href={event.organiser.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {event.organiser.website}
        </a>
      </p>
    )}

    {Array.isArray(event.organiser.contacts) && event.organiser.contacts.length > 0 && (
      <div className="mt-3">
      <strong className="text-sm sm:text-base text-start font-medium mb-2">Coordinator Contacts</strong>
      <ul className="list-disc list-inside ">
        {event.organiser.contacts.map((c, idx) => (
          <li key={idx}>
            <span className="text-xs sm:text-sm text-gray-800 ">
              {c.name && <span>{c.name}</span>}
              {c.designation && <span> ({c.designation})</span>}
              {c.phone && <span> — {c.phone}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
    
    )}
  </div>
)}

    {/* Chat on mobile (optional) */}
    {chatProps && (
    <div className="block md:hidden border border-gray-200 rounded p-1">
      <SendMessage {...chatProps} />
    </div>
  )}

  {/* Description */}
  {event.description && (
    <div className="border px-2 rounded shadow-md text-left my-8 mx-2">
    <h3 className="text-sm sm:text-base text-start font-medium mb-2">Description</h3>
    <div className="text-xs sm:text-sm text-gray-800 text-justify space-y-2">
      {event.description.split('\n').map((para, idx) => (
        <p key={idx} className="whitespace-pre-wrap">{para}</p>
      ))}
    </div>
  </div>
  )}


</div>

    </div>
  );
};

export default SingleEventCard;
