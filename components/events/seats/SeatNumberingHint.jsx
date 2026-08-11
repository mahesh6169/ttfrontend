// components/events/seats/SeatNumberingHint.jsx
// A small always-on cue under the STAGE showing which side seat 1 is on (events-layout-tools.md). It
// makes a horizontal flip visible at the fitted view - the in-seat numbers are hidden until zoomed, so
// this pill (drawn in the row gutter width, not a seat) is the always-visible signal. Shared by the
// seat builder and the attendee map so both read identically.

'use client';

import React from 'react';

const SeatNumberingHint = ({ flipH = false }) => (
  <div
    className={`mb-2 flex w-full ${flipH ? 'justify-end' : 'justify-start'}`}
    data-testid="seat-numbering-hint"
    data-flipped={flipH ? 'true' : 'false'}
  >
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
      {flipH ? <>&larr; Row start here</> : <>Row start here &rarr;</>}
    </span>
  </div>
);

export default SeatNumberingHint;
