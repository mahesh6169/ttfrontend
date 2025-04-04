'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllEvents } from '@/store/slices/eventSlice';
import EventsGrid from '@/components/events/EventsGrid';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

const EventsPage = () => {
  const dispatch = useDispatch();
  const { allEvents, status: eventStatus, error } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchAllEvents());
  }, [dispatch]);
  

  return (
    <div className="flex flex-col">
      <Link
        href="/events/add"
        className="block my-2 p-2 bg-green-600 text-white lg:w-1/4 text-center rounded"
      >
        + Post New Event
      </Link>

      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Browse All Events
      </h1>
        <EventsGrid events={allEvents} eventStatus={eventStatus} />
    
    </div>
  );
};

export default EventsPage;
