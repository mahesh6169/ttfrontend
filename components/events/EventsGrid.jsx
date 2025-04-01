'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import EventCard from './EventCard';
import LoadingSpinner from '../LoadingSpinner';

const EventGrid = ({ events, status }) => {
  const { user, tokenValidated, status: userStatus } = useSelector(state => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;

  if (status === 'loading' || userStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex justify-center items-center text-center p-8">
        <p className="text-lg text-gray-500">No events found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full max-w-full overflow-hidden">
      {events.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
};

export default EventGrid;
