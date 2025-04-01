'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllEvents } from '@/store/slices/eventSlice';
import EventsGrid from '@/components/events/EventsGrid';
import LoadingSpinner from '@/components/LoadingSpinner';

const EventsPage = () => {
  const dispatch = useDispatch();
  const { allEvents, loading, error } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchAllEvents());
  }, [dispatch]);

  return (
    <div className="px-4 py-6 md:px-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Browse All Events</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 py-6">{error}</div>
      )}

      {!loading && !error && <EventsGrid events={allEvents} status={loading ? 'loading' : 'idle'} />}
    </div>
  );
};

export default EventsPage;
