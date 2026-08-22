// components/shared/ResponsiveSheet.jsx
//
// PURPOSE: a cross-vertical UI primitive - a focused panel that rises as a bottom sheet on
// mobile and centres as a dialog on desktop. Three slots: a pinned header (with the shared
// neutral close control), a scrolling body, and an optional pinned footer that always stays
// reachable. Contract: designguide/00-shared/shared-components.md.
//
// DO NOT put page-specific logic or copy inside this file - it is a shell only; the page
// supplies header / body / footer content. It holds no colours or copy of its own beyond the
// neutral close icon and the panel chrome (radius, shadow, scrim) from the shared design system.
// Pattern origin: components/events/addevents/SeatBuilderOverlay.jsx.

'use client';

import React, { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

export default function ResponsiveSheet({ onClose, header, footer, children, testId, ariaLabel }) {
  // Dismiss on Escape; lock the page behind the sheet so only the body scrolls.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {/* Scrim - covers the whole viewport (including the mobile bottom nav) while open. */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel: bottom sheet on mobile, centred dialog on md+. Flex column so the body scrolls
          between a pinned header and a pinned footer. A hairline border + lift shadow give the
          panel a crisp edge against the dimmed page (a full-width white sheet reads as a flat slab
          without it). */}
      <div className="relative z-10 flex w-full max-h-[85vh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl md:w-full md:max-w-md md:rounded-xl">
        {/* Mobile drag handle */}
        <div className="shrink-0 pt-2 md:hidden">
          <div className="mx-auto h-1 w-10 rounded-full bg-slate-300" />
        </div>

        {/* Pinned header: page content on the left, the shared neutral close control on the right. */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1 text-slate-500 hover:text-slate-700"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Body: the only scrolling region. */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Optional pinned footer - clears the phone's home-indicator safe area so it is never hidden. */}
        {footer && (
          <div className="shrink-0 border-t border-slate-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
