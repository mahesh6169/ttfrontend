'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HomeCard from './HomeCard';

const DemoEventsSection = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileScrollIndex, setMobileScrollIndex] = useState(0);
  const [mobileIsPaused, setMobileIsPaused] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileAutoScrollTimer = useRef(null);
  const mobileResumeTimer = useRef(null);

  useEffect(() => {
    if (!events || events.length <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 4;
        return nextIndex >= events.length ? 0 : nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [events, isPaused]);

  useEffect(() => {
    if (!mobileScrollRef.current || !events || events.length === 0) return;

    const container = mobileScrollRef.current;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.9;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setMobileScrollIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [events]);

  useEffect(() => {
    if (!mobileScrollRef.current || !events || events.length <= 1 || mobileIsPaused) return;

    mobileAutoScrollTimer.current = setInterval(() => {
      const container = mobileScrollRef.current;
      if (!container) return;

      const currentScroll = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.9;
      const maxScroll = (events.length - 1) * cardWidth;

      if (currentScroll >= maxScroll) {
        container.scrollTo({ left: 0, behavior: 'auto' });
        setTimeout(() => {
          container.scrollTo({ left: cardWidth, behavior: 'smooth' });
        }, 50);
      } else {
        container.scrollTo({ left: currentScroll + cardWidth, behavior: 'smooth' });
      }
    }, 4000);

    return () => {
      if (mobileAutoScrollTimer.current) {
        clearInterval(mobileAutoScrollTimer.current);
      }
    };
  }, [events, mobileScrollIndex, mobileIsPaused]);

  const handleMobileTouchStart = () => {
    setMobileIsPaused(true);
    if (mobileResumeTimer.current) {
      clearTimeout(mobileResumeTimer.current);
    }
  };

  const handleMobileTouchEnd = () => {
    if (mobileResumeTimer.current) {
      clearTimeout(mobileResumeTimer.current);
    }
    mobileResumeTimer.current = setTimeout(() => {
      setMobileIsPaused(false);
    }, 5000);
  };

  // Don't render if no demo events
  if (!events || events.length === 0) {
    return null;
  }

  const getVisibleEvents = () => {
    if (events.length <= 4) {
      return events;
    }
    const result = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentIndex + i) % events.length;
      result.push(events[index]);
    }
    return result;
  };

  const visibleEvents = getVisibleEvents();

  return (
    <section className="py-2 px-2 sm:py-3 sm:px-4">
      <div className="rounded-lg sm:rounded-xl p-3 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        {/* Demo Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded">DEMO</span>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Demo Events</h2>
          </div>
          <Link
            href="/events/demo"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          See it in action - explore events and experience the booking flow as your clients would
        </p>

        {/* Desktop: 4 rotating cards */}
        <div
          className="hidden md:grid md:grid-cols-4 gap-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visibleEvents.map((event) => (
            <HomeCard key={`${event._id}-${currentIndex}`} type="event" data={event} />
          ))}
        </div>

        {/* Mobile: Horizontal scroll carousel */}
        <div className="md:hidden -mx-3">
          <div
            ref={mobileScrollRef}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-3 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleMobileTouchStart}
            onTouchEnd={handleMobileTouchEnd}
          >
            {events.map((event) => (
              <div key={event._id} className="flex-shrink-0 w-[90vw] snap-center">
                <HomeCard type="event" data={event} />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1 mt-2">
            {events.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === mobileScrollIndex ? 'w-6 bg-amber-500' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop rotation indicator dots */}
        {events.length > 4 && (
          <div className="hidden md:flex justify-center gap-1.5 mt-4">
            {Array.from({ length: Math.ceil(events.length / 4) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * 4)}
                className={`rounded-full transition-all ${
                  Math.floor(currentIndex / 4) === idx
                    ? 'w-7 h-2 bg-amber-500'
                    : 'w-2 h-2 bg-gray-300'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DemoEventsSection;
