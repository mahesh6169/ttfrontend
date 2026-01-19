'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import HomeCard from './HomeCard';

const EventsSection = ({ events }) => {
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
        container.scrollTo({
          left: 0,
          behavior: 'auto'
        });
        setTimeout(() => {
          container.scrollTo({
            left: cardWidth,
            behavior: 'smooth'
          });
        }, 50);
      } else {
        container.scrollTo({
          left: currentScroll + cardWidth,
          behavior: 'smooth'
        });
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

  if (!events || events.length === 0) {
    return (
      <section className="py-4 px-3 sm:py-6 sm:px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Upcoming Events</h2>
          <Link
            href="/events"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
          >
            View All <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <FaCalendarAlt className="text-3xl text-gray-400" />
          <span className="text-sm text-gray-500">No events at the moment</span>
        </div>
      </section>
    );
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
    <section className="py-4 px-3 sm:py-6 sm:px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Upcoming Events</h2>
        <Link
          href="/events"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          View All <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Desktop: 4 rotating cards */}
      <div
        className="hidden md:grid md:grid-cols-4 gap-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {visibleEvents.map((event) => (
          <HomeCard key={`${event._id}-${currentIndex}`} type="event" data={event} borderColor="border-gray-200" textBgColor="bg-gray-50" textColor="text-teal-900" />
        ))}
      </div>

      {/* Mobile: Horizontal scroll carousel */}
      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onTouchStart={handleMobileTouchStart}
          onTouchEnd={handleMobileTouchEnd}
        >
          {events.map((event) => (
            <div
              key={event._id}
              className="flex-shrink-0 w-[90vw] snap-center"
            >
              <HomeCard type="event" data={event} borderColor="border-gray-200" textBgColor="bg-gray-50" textColor="text-teal-900" />
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1 mt-2">
          {events.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === mobileScrollIndex
                  ? 'w-6 bg-teal-600'
                  : 'w-1.5 bg-gray-300'
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
                  ? 'w-7 h-2 bg-teal-600'
                  : 'w-2 h-2 bg-gray-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default EventsSection;
