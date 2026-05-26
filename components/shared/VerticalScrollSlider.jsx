'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * VerticalScrollSlider — wraps content in a fixed-height scrollable area
 * with a thin progress bar on the right showing scroll position.
 *
 * - Bar appears only when content overflows (no overflow = no bar shown).
 * - Hidden native scrollbar; the custom bar is the only visible affordance.
 * - `overscroll-contain` prevents inner scroll from leaking to page scroll at edges.
 *
 * Pattern from `designGuides/uplifteventform/viewstemplatenew.md` §12.
 */
const VerticalScrollSlider = ({ children, maxHeightClass = 'max-h-44 md:max-h-60' }) => {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScroll: false,
    thumbTopPct: 0,
    thumbHeightPct: 100,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (clientHeight === 0) return;
      const canScroll = scrollHeight > clientHeight + 1;
      if (!canScroll) {
        setScrollState({ canScroll: false, thumbTopPct: 0, thumbHeightPct: 100 });
        return;
      }
      const thumbHeightPct = (clientHeight / scrollHeight) * 100;
      const thumbTopPct = (scrollTop / scrollHeight) * 100;
      setScrollState({ canScroll: true, thumbTopPct, thumbHeightPct });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="flex gap-2 items-stretch">
      <div
        ref={scrollRef}
        className={`flex-1 min-w-0 ${maxHeightClass} overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`}
      >
        {children}
      </div>
      {scrollState.canScroll && (
        <div className="relative w-1.5 bg-slate-100 rounded-full shrink-0">
          <div
            className="absolute left-0 right-0 bg-teal-700 rounded-full transition-all"
            style={{
              top: `${scrollState.thumbTopPct}%`,
              height: `${scrollState.thumbHeightPct}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VerticalScrollSlider;
