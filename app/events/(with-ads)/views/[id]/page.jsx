'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, clearSelectedEvent, clearError } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import { MdReport } from "react-icons/md";
import Link from 'next/link';
import ShareIcons from '@/components/shared/ShareIcons';


const EventDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedEvent, status, error } = useSelector((state) => state.events);

  // ✅ FIX: Safe destructuring - use optional chaining instead
  const showSeatSelection = selectedEvent?.isPaid && 
                           selectedEvent?.seatingLayout && 
                           selectedEvent?.seatingLayout.length > 0;


  useEffect(() => {
    if (id) {
      dispatch(clearError());
      dispatch(fetchEventById(id));
    }

    // Cleanup when component unmounts
    return () => {
      dispatch(clearSelectedEvent());
      dispatch(clearError());
    };
  }, [dispatch, id]);

  if ((status === 'idle' || status === 'loading') && !selectedEvent) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="text-center text-red-500 mt-8">
        <p>{error}</p>
        <button 
          onClick={() => {
            const returnUrl = localStorage.getItem('eventViewReturnUrl');
            if (returnUrl && returnUrl.includes('/listings/views/')) {
              router.push(returnUrl);
              localStorage.removeItem('eventViewReturnUrl');
            } else {
              router.push('/events');
            }
          }}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (status === 'succeeded' && !selectedEvent) {
    return (
      <div className="text-center text-gray-500 mt-8">
        <p>Event not found.</p>
        <button 
          onClick={() => {
            const returnUrl = localStorage.getItem('eventViewReturnUrl');
            if (returnUrl && returnUrl.includes('/listings/views/')) {
              router.push(returnUrl);
              localStorage.removeItem('eventViewReturnUrl');
            } else {
              router.push('/events');
            }
          }}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Navigation Bar */}
      <div className="mt-4 flex justify-between items-center">
        {/* Back Button - Smart Navigation */}
        <button
          onClick={() => {
            // Check if we came from a listing view
            const returnUrl = localStorage.getItem('eventViewReturnUrl');
            if (returnUrl && returnUrl.includes('/listings/views/')) {
              // Go back to the listing view
              router.push(returnUrl);
              localStorage.removeItem('eventViewReturnUrl');
            } else {
              // Default to events page
              router.push('/events');
            }
          }}
          className="flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
        >
          <span>&lt;</span>
          <span>back</span>
        </button>

        {/* Report this Event */}
        <Link
          href={`/support/report?type=event&id=${id}&title=${encodeURIComponent(selectedEvent.title)}`}
          onClick={() => {
            localStorage.setItem('reportReturnUrl', `/events/views/${id}`);
          }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <MdReport className="text-lg" />
          <span className="hidden sm:inline">Report this event</span>
          <span className="sm:hidden">Report</span>
        </Link>
      </div>

      {/* Share Icons Row */}
      <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600 mr-3">Share this event:</span>
        <ShareIcons 
          type="event"
          title={selectedEvent.title}
          id={selectedEvent._id}
        />
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

        

        {/* Secondary Content - Desktop Only */}
        <div className="hidden lg:block flex-[3] bg-white border rounded shadow-md p-2 self-start">
          <SendMessage
            resourceId={id}
            resourceType="event"
            participantId={selectedEvent.postedBy?._id}
            owner={selectedEvent.postedBy?.name}
            preserveRedirectUrl={`/events/views/${id}`}
          />
        </div>
      </div>
      
    </div>
  );
};

export default EventDetail;