'use client';

import { useState } from 'react';

// Locked shopper signboard footer (designguide/06-seo/coupons.md "Landing page (/coupons)").
// The closing store line is deliberately UNLINKED - stores are onboarded via admin (C1).
const BODY_TEXT = `Desify is a coupons platform for the Indian community in Australia. Save on groceries, food and dining, fashion, and health and wellbeing at stores in Sydney, Melbourne, Perth, Brisbane and Adelaide - browse offers near you and redeem in-store with a QR code. Stores can list their offers free on Desify.`;

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
