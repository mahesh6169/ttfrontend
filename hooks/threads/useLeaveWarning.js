'use client';

import { useEffect, useRef } from 'react';

export const LEAVE_MESSAGE = "Leave the page? Your post won't be saved.";

// Feature 1012: warn before a half-written thread is lost. Covers closing/reloading the tab (the
// browser's own "Leave site?" box) and clicking a link to another page inside the site.
// onLeave runs when the writer confirms leaving through a link (e.g. to throw away unsaved pictures).
export default function useLeaveWarning(active, onLeave) {
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  useEffect(() => {
    if (!active) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target?.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.closest('.thread-editor-content')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        onLeaveRef.current?.();
      }
    };
    // The tab is really going away (closed, reloaded, or "Leave" chosen in the browser's box).
    const onPageHide = () => onLeaveRef.current?.();
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('click', onClick, true);
    };
  }, [active]);
}
