'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaCalendarAlt } from 'react-icons/fa';
import HomeCard from './HomeCard';
import PromoBanner from '../PromoBanner';
import HeroEventsSection from './HeroEventsSection';

const EventsSection = ({ events }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileScrollIndex, setMobileScrollIndex] = useState(0);
  const [mobileIsPaused, setMobileIsPaused] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileAutoScrollTimer = useRef(null);
  const mobileResumeTimer = useRef(null);

  const handleCreateClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/events/add');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/');
    }
  };

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

  const scrollToDemoSection = () => {
    const demoSection = document.getElementById('demo-events-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!events || events.length === 0) {
    return (
      <section
        className="relative mt-20 pt-0 pb-4 px-0 sm:pb-6 sm:px-4 rounded-none md:rounded-xl overflow-hidden"
        style={{ background: 'rgb(180, 130, 180)' }}
      >
        {/* Mobile: shallower wave */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none md:hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <path
            d="M0,200 C360,160 720,240 1080,180 S1440,220 1440,200 L1440,600 L0,600 Z"
            fill="rgb(230, 210, 230)"
          />
        </svg>
        {/* Desktop: deeper wave */}
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <path
            d="M0,180 C360,80 720,280 1080,130 S1440,230 1440,180 L1440,600 L0,600 Z"
            fill="rgb(230, 210, 230)"
          />
        </svg>
        <div className="relative p-0 sm:pt-0 sm:pb-6 sm:px-6">
          <div className="mb-2 sm:mx-0">
            <HeroEventsSection />
          </div>
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <div className="flex items-center gap-2 text-gray-500">
              <FaCalendarAlt className="text-lg" />
              <span className="text-sm">No events displayed at the moment</span>
            </div>
            <p className="text-sm text-gray-500">
              Explore our{' '}
              <button
                onClick={scrollToDemoSection}
                className="text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Demo Events
              </button>
              {' '}or{' '}
              <Link href="/support/contact" className="text-teal-600 hover:text-teal-700 font-medium hover:underline">
                contact us
              </Link>
            </p>
          </div>
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
    <section
      className="relative mt-20 pt-0 pb-4 px-0 sm:pb-6 sm:px-4 rounded-none md:rounded-xl overflow-hidden"
      style={{ background: 'rgb(180, 130, 180)' }}
    >
      {/* Mobile: shallower wave */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none md:hidden"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,200 C360,160 720,240 1080,180 S1440,220 1440,200 L1440,600 L0,600 Z"
          fill="rgb(230, 210, 230)"
        />
      </svg>
      {/* Desktop: deeper wave */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 600"
      >
        <path
          d="M0,180 C360,80 720,280 1080,130 S1440,230 1440,180 L1440,600 L0,600 Z"
          fill="rgb(230, 210, 230)"
        />
      </svg>
      <div className="relative p-0 sm:pt-0 sm:pb-6 sm:px-6">
        <div className="mb-4 sm:mx-0">
          <HeroEventsSection />
        </div>

        {/* Desktop: 4 rotating cards */}
        <div 
          className="hidden md:grid md:grid-cols-4 gap-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visibleEvents.map((event) => (
            <HomeCard key={`${event._id}-${currentIndex}`} type="event" data={event} borderColor="border-[rgb(180,130,180)]" textBgColor="bg-[rgb(248,238,248)]" textColor="text-purple-700" />
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
              <div 
                key={event._id} 
                className="flex-shrink-0 w-[90vw] snap-center"
              >
                <HomeCard type="event" data={event} borderColor="border-[rgb(180,130,180)]" textBgColor="bg-[rgb(248,238,248)]" textColor="text-purple-700" />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1 mt-2">
            {events.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === mobileScrollIndex
                    ? 'w-6 bg-purple-600'
                    : 'w-1.5 bg-gray-400'
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

export default EventsSection;
