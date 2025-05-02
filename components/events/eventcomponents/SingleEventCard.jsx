'use client';

import React, { useState } from 'react';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { differenceInDays, format } from 'date-fns';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';

const SingleEventCard = ({ event }) => {
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
    <div className="border p-4 rounded shadow-md bg-white max-w-[800px] mx-auto">
      {/* Image Section */}
      <div className="relative w-full h-[500px] bg-gray-200 flex items-center justify-center overflow-hidden rounded">
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow"
            >
              Prev
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow"
            >
              Next
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={event.images[currentImageIndex].url}
              alt="Event Full"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full"
            >
              <FaTimes size={24} />
            </button>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full"
            >
              Prev
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Event Info */}
      <div className="p-4 space-y-4">
        <h2 className="text-3xl font-bold text-center">{event.title}</h2>
        <div className="text-xs text-left text-gray-500">{event.category}</div>

        <div className="flex justify-between text-base text-gray-700">
          <span>
            <strong>Posted By:</strong> {event.postedBy?.name || 'N/A'}
          </span>
          <span>
            <strong>Posted:</strong> {postedText}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Event Details</h3>
          <p>🗓️ {eventDateStr}</p>
          <p>
            ⏰ {eventTimeStr} {eventZoneCity}
            {showLocalTime && <> || {localTimeStr} {localZoneCity}</>}
          </p>
          <p className="mt-2 flex gap-2 items-start">
            📍{' '}
            <span className="flex flex-col">
              <span>{event.venue}</span>
              <span>{event.address?.formattedAddress}</span>
            </span>
          </p>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Event Organiser</h3>
          <p>
            <strong>Name:</strong> {event.organiser?.name}
          </p>
          <p>
            <strong>Website:</strong> {event.organiser?.website || 'N/A'}
          </p>
          <p>
            <strong>Primary Contact:</strong>{' '}
            {event.organiser?.primaryContact?.name} /{' '}
            {event.organiser?.primaryContact?.phone}
          </p>
          {event.organiser?.secondaryContact?.name && (
            <p>
              <strong>Secondary Contact:</strong>{' '}
              {event.organiser.secondaryContact.name} /{' '}
              {event.organiser.secondaryContact.phone}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Description</h3>
          <p className="text-gray-700">{event.description}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleEventCard;
