'use client';

import { useState } from 'react';
import Link from 'next/link';

// Locked shopper signboard footer (designguide/06-seo/deals.md "Landing page (/deals)").
// The closing business phrase links to /users/profile/deals (the create-deal page).
const FooterParagraph = () => (
  <>
    Discover Indian deals across Australia, from restaurants and catering, sweets and
    groceries to fashion and jewellery, beauty and salons, dance and music classes, and
    party and wedding services. Find offers from businesses in Sydney, Melbourne, Perth,
    Brisbane and Adelaide.{' '}
    <Link href="/users/profile/deals" className="text-teal-700 hover:text-teal-800 underline">
      Businesses can post their deals free
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
