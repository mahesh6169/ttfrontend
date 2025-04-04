'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import {
  getEventWishlist,
  addToEventWishlist,
  removeFromEventWishlist,
} from '@/store/slices/userSlice';

const SingleEventCard = ({ event }) => {
  const dispatch = useDispatch();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { tokenValidated, user, eventWishlist } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  const isInWishlist = eventWishlist?.includes(event._id.toString());

  const handleWishlistToggle = async (eventId) => {
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
    try {
      if (isInWishlist) {
        await dispatch(removeFromEventWishlist({ eventId })).unwrap();
      } else {
        await dispatch(addToEventWishlist({ eventId })).unwrap();
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % event.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? event.images.length - 1 : prevIndex - 1
    );
  };

  // 🕒 Timezone Display Logic
  const eventTime = new Date(event.dateTime);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const getCityFromZone = (zone) =>
    zone?.split('/')?.[1]?.replace('_', ' ') || zone;

  const eventZone = event.timeZone || localTimeZone;
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const showLocalTime = eventZone !== localTimeZone;

  return (
    <div className="border p-4 rounded shadow-md bg-white max-w-[800px] mx-auto">
      {/* Images Section */}
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
            <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow">Prev</button>
            <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow">Next</button>
          </>
        )}

        <button
          onClick={() => handleWishlistToggle(event._id.toString())}
          className={`absolute top-2 right-2 p-2 rounded-full z-10 ${
            isInWishlist ? 'bg-red-500' : 'bg-gray-300'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart className={`text-lg ${isInWishlist ? 'text-white' : 'text-gray-700'}`} />
        </button>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={event.images[currentImageIndex].url}
              alt="Event Full"
              className="max-w-full max-h-full object-contain"
            />
            <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 bg-white p-2 rounded-full">
              <FaTimes size={24} />
            </button>
            <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full">Prev</button>
            <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full">Next</button>
          </div>
        </div>
      )}

      {/* Event Details */}
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
        <p className="text-gray-500 mb-1 font-semibold">
          Category: {event.category}
        </p>

        <div className="mb-4">
          <p className="text-md mb-1">🗓️ {eventDateStr}</p>
          <p className="text-md">
            ⏰ {eventTimeStr} {eventZoneCity}
            {showLocalTime && (
              <>
                {' '}|| {localTimeStr} {localZoneCity}
              </>
            )}
          </p>
          <p className="mt-1">📍 {event.venue}</p>
        </div>

        <div className="mb-4">
          <strong>Location:</strong>{' '}
          <span className="flex items-center mt-1">
            <MdLocationOn className="text-lg mr-1" />
            {event.address?.formattedAddress || 'N/A'}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="font-bold">Event Organisers</h3>
          <p><strong>Name:</strong> {event.organiser?.name}</p>
          <p><strong>Website:</strong> {event.organiser?.website || 'N/A'}</p>
          <p><strong>Primary Contact:</strong> {event.organiser?.primaryContact?.name} ({event.organiser?.primaryContact?.phone})</p>
          {event.organiser?.secondaryContact?.name && (
            <p><strong>Secondary Contact:</strong> {event.organiser.secondaryContact.name} ({event.organiser.secondaryContact.phone})</p>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-2">Event Description</h3>
          <p className="text-gray-700">{event.description}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleEventCard;
