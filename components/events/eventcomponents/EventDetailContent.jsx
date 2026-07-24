'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShareAlt } from 'react-icons/fa';
import SingleEventCard from '@/components/events/eventcomponents/SingleEventCard';
import SendMessage from '@/components/chat/SendMessage';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import BackButton from '@/components/BackButton';
import { buildSlugUrl } from '@/utils/slugUtils';

// Client detail view for a single event. The event is fetched server-side in
// app/events/(with-ads)/[slug]/page.jsx and passed in as a prop (no client
// fetch), so the content is in the server HTML for SEO. Interactive parts
// (tickets, RSVP, chat, share) hydrate in the browser.
const EventDetailContent = ({ event }) => {
  const router = useRouter();
  const id = event._id;
  const eventUrl = buildSlugUrl('event', event.title, event._id);

  const isCuratedEvent = event?.isCuratedEvent || false;
  const isPromotionalEvent = event?.eventIntent === 'promote' || event?.isAdvertiseOnly;
  const promoCtaLabel = event?.isPaid ? 'Get Tickets' : 'Register';

  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setShareOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [shareOpen]);

  // Back: return to the previous page if it was on our site (e.g. the events grid);
  // otherwise (landed straight from Google/WhatsApp) go to the events page.
  const handleBack = () => {
    const cameFromSite =
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (cameFromSite) router.back();
    else router.push('/events');
  };

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center">
        <BackButton onClick={handleBack} />
        <ReportLink
          type="event"
          id={id}
          title={event.title}
          returnUrl={eventUrl}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Event Details */}
        <div className="flex-[7] bg-white w-full">
          <SingleEventCard
            event={event}
            chatProps={{
              resourceId: id,
              resourceType: 'event',
              participantId: event.postedBy?._id,
              owner: event.postedBy?.name,
              preserveRedirectUrl: eventUrl,
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
                  href={`/support/removal?type=event&id=${id}&title=${encodeURIComponent(event.title)}`}
                  onClick={() => {
                    localStorage.setItem('removalReturnUrl', eventUrl);
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
              participantId={event.postedBy?._id}
              owner={event.postedBy?.name}
              preserveRedirectUrl={eventUrl}
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
                  <ShareIcons type="event" title={event.title} id={event._id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailContent;
