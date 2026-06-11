'use client';

import { useState } from 'react';

const BODY_TEXT = `Desify is a community-driven classifieds platform where you can discover rentals, cars, products, services and businesses across Australia. Browse local listings or post your own for free and connect with buyers, sellers and service providers in your area.`;

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
          {BODY_TEXT}
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
        {BODY_TEXT}
      </p>
    </section>
  );
}
