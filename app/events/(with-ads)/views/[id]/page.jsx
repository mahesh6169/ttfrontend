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
              router.back();
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
              router.back();
            }
          }}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Check if posted by support account (events added on behalf of users)
  const isPostedBySupport = selectedEvent.postedBy?.email?.toLowerCase() === 'support@desify.com.au';

  // Check if this is an admin-created event (chat should be disabled)
  const isAdminEvent = selectedEvent.isAdminEvent || false;

  // Check if this is a promotional event (no registration/chat needed)
  const isPromotionalEvent = selectedEvent.eventIntent === 'promote' || selectedEvent.isAdvertiseOnly;

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
              router.back();
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
      <div className="flex items-center justify-center py-3 px-4">
        <span className="text-sm sm:text-base font-bold text-sky-500 mr-3">Share</span>
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
              isPostedBySupport,
              isAdminEvent,
              isPromotionalEvent,
            }}
          />
        </div>

        

        {/* Secondary Content - Desktop Only */}
        <div className="hidden lg:block flex-[3] bg-white border rounded shadow-md p-2 self-start">
          {isAdminEvent ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                This event was added by admin on behalf of the organizer.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Please contact the organizer directly for any inquiries.
              </p>
            </div>
          ) : isPromotionalEvent ? (
            <div className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Promotional Event
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Registration is handled externally by the organizer.
              </p>
              {selectedEvent.externalTicketUrl && (
                <a
                  href={selectedEvent.externalTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Register / Get Tickets
                </a>
              )}
            </div>
          ) : (
            <SendMessage
              resourceId={id}
              resourceType="event"
              participantId={selectedEvent.postedBy?._id}
              owner={selectedEvent.postedBy?.name}
              preserveRedirectUrl={`/events/views/${id}`}
              isPostedBySupport={isPostedBySupport}
            />
          )}
        </div>
      </div>
      
    </div>
  );
};

export default EventDetail;