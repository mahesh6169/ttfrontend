'use client';

import { useState } from 'react';
import Link from 'next/link';

// Locked attendee signboard footer (designguide/06-seo/events.md "Landing page (/events)").
// The organiser phrase links to /tickets (the organiser signboard is a later job).
const FooterParagraph = () => (
  <>
    Desify is a community events platform for Indians in Australia. Discover concerts,
    devotional programs, cultural nights, festivals like Diwali, Navratri Garba, Holi,
    Ganesh Chaturthi and Onam, and community gatherings in Sydney, Melbourne, Perth,
    Brisbane and Adelaide. Organising an event?{' '}
    <Link href="/tickets" className="text-teal-700 hover:text-teal-800 underline">
      Host free RSVP events or sell tickets
    </Link>{' '}
    on Desify.
  </>
);

export default function SeoFooterBlock() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-6 sm:mt-8 px-3 sm:px-4 py-2 sm:py-3 border-t border-slate-200 bg-white">
      {/* Mobile: collapsible (one line + Show more) */}
      <div className="md:hidden">
        <p
          className="text-xs text-slate-600 leading-snug overflow-hidden"
          style={
            expanded
              ? undefined
              : {
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }
          }
        >
          <FooterParagraph />
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-teal-700 font-medium mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>

      {/* Desktop: always visible full paragraph */}
      <p className="hidden md:block text-sm text-slate-600 leading-snug md:text-center md:max-w-5xl md:mx-auto">
        <FooterParagraph />
      </p>
    </section>
  );
}
