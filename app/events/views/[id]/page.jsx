'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import { RiArrowGoBackFill } from "react-icons/ri";
import { MdReport } from "react-icons/md";
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
    <div className="flex flex-col gap-2 px-2">
      {/* Row 1: Back & Report */}
      <div className=" mt-4 flex justify-between">
  {/* Back to Adverts */}
  <span
    onClick={() => router.back()}
    className="flex items-center gap-2 bg-yellow-400  text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-medium"
  >
    <RiArrowGoBackFill className="text-xs sm:text-base " />
    <span>Back to Events</span>
  </span>

  {/* Report this Advert */}
  <Link
    href={`/support/report?type=advert&id=${id}&title=${encodeURIComponent(selectedEvent.title)}`}
    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
  >
    <MdReport className="text-lg" />
    <span>Report this Event</span>
  </Link>
</div>

      {/* Layout: Card + Chat */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Event Details */}
        <div className="flex-[7] bg-white w-full">
          <SingleEventCard 
          event={selectedEvent}
          chatProps={{
            resourceId: id,
            resourceType: 'event',
            participantId: selectedEvent.postedBy?._id,
            owner: selectedEvent.postedBy?.name,
            preserveRedirectUrl: `/events/views/${id}`,
          }} 
          />
        </div>

        {/* Chat Container: desktop only */}
        <div className="hidden lg:block flex-[3] shadow p-2 self-start">
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
