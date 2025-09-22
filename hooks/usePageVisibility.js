import { useEffect, useState, useRef } from 'react';

export const usePageVisibility = () => {
  // Initialize with true for SSR, will be corrected on client
  const [isVisible, setIsVisible] = useState(true);
  const [lastHiddenTime, setLastHiddenTime] = useState(null);
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is now hidden (locked, tab switched, etc.)
        setLastHiddenTime(Date.now());
        wasHiddenRef.current = true;
        setIsVisible(false);
        console.log('[Visibility] Page hidden at:', new Date().toISOString());
      } else {
        // Page is now visible
        const hiddenDuration = lastHiddenTime ? Date.now() - lastHiddenTime : 0;
        console.log(`[Visibility] Page visible after ${hiddenDuration}ms`);
        setIsVisible(true);
      }
    };

    // Also handle focus events for better mobile support
    const handleFocus = () => {
      if (wasHiddenRef.current) {
        console.log('[Visibility] Page focused, was previously hidden');
        setIsVisible(true);
        wasHiddenRef.current = false;
      }
    };

    const handleBlur = () => {
      console.log('[Visibility] Page blurred');
    };

    // Check if we're in the browser
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);

      // Check initial state
      setIsVisible(!document.hidden);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    }
  }, [lastHiddenTime]);

  return { isVisible, lastHiddenTime, wasHidden: wasHiddenRef.current };
};