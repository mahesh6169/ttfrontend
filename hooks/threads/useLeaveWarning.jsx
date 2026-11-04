'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';

// Feature 1012: warn before a half-written thread is lost, with the site's own confirm box.
// - Cancel buttons and links to other pages inside the site ask with ConfirmModal.
// - Closing or reloading the tab can only use the browser's own "Leave site?" box (a browser rule).
// onLeave runs once the writer chooses to leave (e.g. to throw away unsaved pictures).
// Returns { confirmLeave(go), leaveModal }: render leaveModal; confirmLeave asks, then runs go().
export default function useLeaveWarning(active, onLeave) {
  const router = useRouter();
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  const [pending, setPending] = useState(null); // what to do after "Leave"

  useEffect(() => {
    if (!active) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    // The tab is really going away (closed, reloaded, or "Leave" chosen in the browser's box).
    const onPageHide = () => onLeaveRef.current?.();
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target?.closest?.('a[href]');
      if (!a || a.target === '_blank' || a.closest('.thread-editor-content')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(() => () => router.push(`${url.pathname}${url.search}${url.hash}`));
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('click', onClick, true);
    };
  }, [active, router]);

  const confirmLeave = (go) => {
    if (!active) { go(); return; }
    setPending(() => go);
  };

  const leaveModal = (
    <ConfirmModal
      isOpen={!!pending}
      title="Leave this page?"
      message="Your post won't be saved."
      confirmText="Leave"
      cancelText="Stay"
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const go = pending;
        setPending(null);
        onLeaveRef.current?.();
        go?.();
      }}
    />
  );

  return { confirmLeave, leaveModal };
}
