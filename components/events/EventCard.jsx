import React from 'react';
import Link from 'next/link';
import { MdLocationOn } from 'react-icons/md';
import { BsCalendar2Event } from 'react-icons/bs';

const EventCard = ({ event }) => {
  const { title, dateTime, venue, description, address, images, organiser } = event;
  const date = new Date(dateTime).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timeZone || 'Australia/Sydney',
  });

  return (
    <Link href={`/events/views/${event._id}`}>
      <div className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition w-full">
        {/* Event Image */}
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

        {/* Organiser */}
        <div className="text-xs text-gray-500 mt-2 italic truncate">
          {organiser?.name ? `By ${organiser.name}` : 'Unknown organiser'}
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
