'use client';

import { useState } from 'react';
import Link from 'next/link';

// Locked forum signboard footer (designguide/06-seo/threads.md "Landing page (/threads)").
// The discussion phrase links to /threads/new. No city names - forum searches are national.
const FooterParagraph = () => (
  <>
    Desify is a community forum for Indians in Australia. Ask questions and read answers on
    migration and visas, careers and education, personal finance and legal matters, health,
    and real estate and rentals. Talk about family and kids, food, and cultural and
    devotional life - or{' '}
    <Link href="/threads/new" className="text-teal-700 hover:text-teal-800 underline">
      start your own discussion free
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
