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
    <section
      id="demo-events-section"
      className="relative mt-20 pt-0 pb-4 px-0 sm:pb-6 sm:px-4 rounded-none md:rounded-xl overflow-hidden"
      style={{ background: 'rgb(215, 190, 215)' }}
    >
      {/* Mobile: wave just under description */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none md:hidden"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,130 C360,80 720,180 1080,100 S1440,160 1440,130 L1440,600 L0,600 Z"
          fill="rgb(230, 210, 230)"
        />
      </svg>
      {/* Desktop: wave just under description */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,120 C360,50 720,180 1080,80 S1440,150 1440,120 L1440,600 L0,600 Z"
          fill="rgb(230, 210, 230)"
        />
      </svg>

      <div className="relative p-4 sm:pt-6 sm:pb-6 sm:px-6">
        {/* Demo Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl md:text-4xl font-black tracking-wide text-purple-700 drop-shadow-sm">Demo Events</h2>
          <Link
            href="/events/demo"
            className="bg-[#f5eef5] hover:bg-[#efe5ef] text-purple-700 text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg shadow-sm transition-colors"
          >
            View All
          </Link>
        </div>

        <p className="text-sm text-purple-700 mb-4">
          See it in action - explore events and experience the booking flow as your clients would
        </p>

        {/* Desktop: 4 rotating cards */}
        <div
          className="hidden md:grid md:grid-cols-4 gap-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visibleEvents.map((event) => (
            <HomeCard key={`${event._id}-${currentIndex}`} type="event" data={event} isDemo={true} borderColor="border-[rgb(180,130,180)]" textBgColor="bg-[rgb(248,238,248)]" textColor="text-purple-700" />
          ))}
        </div>

        {/* Mobile: Horizontal scroll carousel */}
        <div className="md:hidden">
          <div
            ref={mobileScrollRef}
            className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-3 pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={handleMobileTouchStart}
            onTouchEnd={handleMobileTouchEnd}
          >
            {events.map((event) => (
              <div key={event._id} className="flex-shrink-0 w-[90vw] snap-center">
                <HomeCard type="event" data={event} isDemo={true} borderColor="border-[rgb(180,130,180)]" textBgColor="bg-[rgb(248,238,248)]" textColor="text-purple-700" />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1 mt-2">
            {events.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === mobileScrollIndex ? 'w-6 bg-purple-600' : 'w-1.5 bg-gray-400'
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
                    ? 'w-7 h-2 bg-purple-600'
                    : 'w-2 h-2 bg-gray-400'
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
