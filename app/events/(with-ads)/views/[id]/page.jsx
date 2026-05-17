'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, clearSelectedEvent, clearError } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import ReportLink from '@/components/support/ReportLink';
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
          className="mt-4 px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (status === 'succeeded' && !selectedEvent) {
    return (
      <div className="text-center text-slate-500 mt-8">
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
          className="mt-4 px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Curated event — posted by a Desify curator on behalf of the organiser
  const isCuratedEvent = selectedEvent.isCuratedEvent || false;

  // Check if this is a promotional event (external registration link)
  const isPromotionalEvent = selectedEvent.eventIntent === 'promote' || selectedEvent.isAdvertiseOnly;

  // Dynamic CTA label based on free/paid for promotional events
  const promoCtaLabel = selectedEvent.isPaid ? 'Get Tickets' : 'Register';

  return (
    <div id="viewsmain" className="flex flex-col gap-2 px-2">
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
        <ReportLink
          type="event"
          id={id}
          title={selectedEvent.title}
          returnUrl={`/events/views/${id}`}
        />
      </div>

      {/* Layout: Card + Chat */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
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
              isCuratedEvent,
              isPromotionalEvent,
              promoCtaLabel,
            }}
          />
        </div>

        

        {/* Secondary Content - Desktop Only */}
        <div className="hidden lg:block flex-[3] sticky top-20 self-start space-y-4">
          {isCuratedEvent ? (
            <div className="border border-slate-200 p-3 rounded shadow-md w-full">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Get in touch</h2>
              <p className="text-sm text-slate-700 mb-4">
                This event has been added on behalf of the organiser. Please use the contact details provided to reach them directly.
              </p>
              <p className="text-xs text-slate-500">
                Are you the organiser?{' '}
                <a
                  href={`/support/removal?type=event&id=${id}&title=${encodeURIComponent(selectedEvent.title)}`}
                  onClick={() => {
                    localStorage.setItem('removalReturnUrl', `/events/views/${id}`);
                  }}
                  className="text-slate-700 hover:text-slate-900 underline"
                >
                  Request removal of this event
                </a>
              </p>
            </div>
          ) : (
            <SendMessage
              resourceId={id}
              resourceType="event"
              participantId={selectedEvent.postedBy?._id}
              owner={selectedEvent.postedBy?.name}
              preserveRedirectUrl={`/events/views/${id}`}
            />
          )}

          {/* Share Icons - Sticky with sidebar */}
          <div className="flex items-center justify-center py-3 px-4 border border-slate-200 rounded shadow-sm">
            <span className="text-sm font-bold text-sky-500 mr-3">Share</span>
            <ShareIcons
              type="event"
              title={selectedEvent.title}
              id={selectedEvent._id}
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default EventDetail;