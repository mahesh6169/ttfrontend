'use client';

import { useState } from 'react';
import Link from 'next/link';

// Locked buyer signboard footer (designguide/06-seo/listings.md "Landing page (/listings)").
// The poster phrase links to /listings/add (the one line for the second audience).
const FooterParagraph = () => (
  <>
    Desify is a classifieds platform for the Indian community in Australia. Find real estate
    and rooms, vehicles, Indian groceries, matrimony, priest and pooja services, home
    maintenance and professional services, and jobs in Sydney, Melbourne, Perth, Brisbane
    and Adelaide. Have something to sell or offer?{' '}
    <Link href="/listings/add" className="text-teal-700 hover:text-teal-800 underline">
      Post a listing free
    </Link>{' '}
    on Desify.
  </>
);

export default function SeoFooterBlock() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-6 sm:mt-8 py-2 sm:py-3 border-t border-slate-200 bg-white">
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
