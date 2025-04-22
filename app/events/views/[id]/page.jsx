'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import Link from 'next/link';

const EventDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedEvent, status, error } = useSelector((state) => state.events);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'failed') {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  if (!selectedEvent) {
    return (
      <div className="text-center text-gray-500 mt-8">Event not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Go Back Button */}
      <div className="text-left">
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>

      {/* Layout: Card + Chat */}
      <div className="flex flex-col lg:flex-row gap-2">
        {/* Event Details */}
        <div className="flex-[7] border-r bg-white">
          <SingleEventCard event={selectedEvent} />
        </div>

        {/* Chat Container */}
        <div className="flex-[3] bg-white shadow rounded-none p-4">
          <SendMessage
            resourceId={id}
            resourceType="event"
            participantId={selectedEvent.postedBy?._id}
            owner={selectedEvent.postedBy?.name}
            preserveRedirectUrl={`/events/views/${id}`}
          />
          <Link
            href={`/support/report?type=event&id=${id}&title=${encodeURIComponent(
              selectedEvent.title
            )}`}
            className="text-sm text-red-600 underline mt-2 inline-block"
          >
            Report this event
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
