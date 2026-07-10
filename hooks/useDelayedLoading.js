import { useEffect, useRef, useState } from 'react';

// Anti-flash loading gate — see designGuides/02-Frontend-GUI/ProfileUnification.md (T3).
//
// Given the real `loading` flag, returns whether the skeleton should be SHOWN:
//   - waits `delay` ms before showing, so fast loads never flash a skeleton
//   - once shown, keeps it for at least `minDuration` ms, so it never flickers out
//
//   const showSkeleton = useDelayedLoading(loading);
//   return showSkeleton ? <PageSkeleton variant="list" /> : <RealContent />;
export default function useDelayedLoading(
  loading,
  { delay = 200, minDuration = 500 } = {}
) {
  const [show, setShow] = useState(false);
  const shownAtRef = useRef(0);
  const showRef = useRef(false);

  // Mirror `show` into a ref so the timing effect doesn't depend on it (no resets).
  useEffect(() => {
    showRef.current = show;
  }, [show]);

  useEffect(() => {
    let timer;

    if (loading) {
      // Schedule the skeleton only if it isn't already up.
      if (!showRef.current) {
        timer = setTimeout(() => {
          shownAtRef.current = Date.now();
          setShow(true);
        }, delay);
      }
    } else if (showRef.current) {
      // Loading finished while shown — honour the minimum display time.
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = Math.max(0, minDuration - elapsed);
      timer = setTimeout(() => setShow(false), remaining);
    } else {
      // Loading finished before the skeleton ever appeared — show nothing.
      setShow(false);
    }

    return () => clearTimeout(timer);
  }, [loading, delay, minDuration]);

  return show;
}
