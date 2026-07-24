'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, clearSelectedEvent, clearError } from '@/store/slices/events/eventSlice';
import { FaShareAlt } from 'react-icons/fa';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';


const EventDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedEvent, status, error } = useSelector((state) => state.events);

  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClickOutside = (event) => {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShareOpen(false);
      }
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') setShareOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [shareOpen]);

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

  const isLoading = (status === 'idle' || status === 'loading') && !selectedEvent;
  const isFailed = status === 'failed';
  const isNotFound = status === 'succeeded' && !selectedEvent;

  // Curated event — posted by a Desify curator on behalf of the organiser
  const isCuratedEvent = selectedEvent?.isCuratedEvent || false;

  // Check if this is a promotional event (external registration link)
  const isPromotionalEvent = selectedEvent?.eventIntent === 'promote' || selectedEvent?.isAdvertiseOnly;

  // Dynamic CTA label based on free/paid for promotional events
  const promoCtaLabel = selectedEvent?.isPaid ? 'Get Tickets' : 'Register';

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar — always visible through every state */}
      <div className="flex justify-between items-center">
        {/* Back — smart: return to the originating listing view if we came from one */}
        <BackButton
          onClick={() => {
            const returnUrl = localStorage.getItem('eventViewReturnUrl');
            if (returnUrl && returnUrl.includes('/listings/')) {
              router.push(returnUrl);
              localStorage.removeItem('eventViewReturnUrl');
            } else {
              router.back();
            }
          }}
        />

        {/* Report this Event — only once the event has loaded */}
        {selectedEvent && (
          <ReportLink
            type="event"
            id={id}
            title={selectedEvent.title}
            returnUrl={`/events/views/${id}`}
          />
        )}
      </div>

      {/* Content slot — swaps by state; the frame above stays put */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-16rem)]">
          <LoadingSpinner />
        </div>
      ) : isFailed ? (
        <ErrorState
          onRetry={() => {
            dispatch(clearError());
            dispatch(fetchEventById(id));
          }}
        />
      ) : isNotFound ? (
        <EmptyState
          title="Event not found"
          description="This event may have been removed, or the link is incorrect."
          actionLabel="Browse events"
          actionHref="/events"
        />
      ) : (
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

          {/* Share - popover trigger */}
          <div className="flex justify-center py-3 px-4">
            <div className="relative" ref={shareRef}>
              <button
                onClick={() => setShareOpen((open) => !open)}
                aria-expanded={shareOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-4 py-1.5 rounded-full font-semibold text-sm md:text-base transition-colors"
              >
                <FaShareAlt size={13} />
                <span>Share</span>
              </button>
              {shareOpen && (
                <div className="absolute right-0 mt-2 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                  <ShareIcons
                    type="event"
                    title={selectedEvent.title}
                    id={selectedEvent._id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      )}
    </div>
  );
};

export default EventDetail;