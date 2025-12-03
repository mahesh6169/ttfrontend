'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaFrown, FaPlus, FaArrowRight, FaFire } from 'react-icons/fa';
import HomeCard from './HomeCard';
import BrowseAllCard from './BrowseAllCard';
import PromoBanner from '../PromoBanner';
import HeroListingSection from './HeroListingSection';

const ListingsSection = ({ listings }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileScrollIndex, setMobileScrollIndex] = useState(0);
  const [mobileIsPaused, setMobileIsPaused] = useState(false);
  const mobileScrollRef = useRef(null);
  const mobileAutoScrollTimer = useRef(null);
  const mobileResumeTimer = useRef(null);

  const handleCreateClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/listings/add');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/');
    }
  };

  useEffect(() => {
    if (!listings || listings.length <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 4;
          return nextIndex >= listings.length ? 0 : nextIndex;
        });
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }, 4000);

    return () => clearInterval(timer);
  }, [listings, isPaused]);

  useEffect(() => {
    if (!mobileScrollRef.current || !listings || listings.length === 0) return;

    const container = mobileScrollRef.current;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.9;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setMobileScrollIndex(newIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [listings]);

  useEffect(() => {
    if (!mobileScrollRef.current || !listings || listings.length <= 1 || mobileIsPaused) return;

    mobileAutoScrollTimer.current = setInterval(() => {
      const container = mobileScrollRef.current;
      if (!container) return;

      const currentScroll = container.scrollLeft;
      const cardWidth = container.offsetWidth * 0.9;
      const maxScroll = (listings.length - 1) * cardWidth;

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
  }, [listings, mobileScrollIndex, mobileIsPaused]);

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

  if (!listings || listings.length === 0) {
    return (
      <section className="py-2 px-2 sm:py-3 sm:px-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm">
          <div className="text-center py-8">
            <FaFrown className="text-gray-400 text-4xl sm:text-5xl mx-auto mb-3" />
            <p className="text-gray-600 text-sm sm:text-base mb-2">Something went wrong</p>
            <p className="text-gray-500 text-xs sm:text-sm">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  const getVisibleListings = () => {
    if (listings.length <= 4) {
      return listings;
    }
    const result = [];
    for (let i = 0; i < 4; i++) {
      const index = (currentIndex + i) % listings.length;
      result.push(listings[index]);
    }
    return result;
  };
  
  const visibleListings = getVisibleListings();

  return (
    <section className="py-2 px-2 sm:py-3 sm:px-4">
      <div className="rounded-lg sm:rounded-xl p-3 sm:p-6">
        <div className="mb-2 -mx-3 sm:mx-0">
          <HeroListingSection />
        </div>

        {/* Desktop: 4 rotating cards */}
        <div 
          className={`hidden md:grid md:grid-cols-4 gap-4 transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {visibleListings.map((listing) => (
            <HomeCard key={`${listing._id}-${currentIndex}`} type="listing" data={listing} />
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
            {listings.map((listing) => (
              <div 
                key={listing._id} 
                className="flex-shrink-0 w-[90vw] snap-center"
              >
                <HomeCard type="listing" data={listing} />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1 mt-2">
            {listings.map((_, idx) => (
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
        {listings.length > 4 && (
          <div className="hidden md:flex justify-center gap-1.5 mt-4">
            {Array.from({ length: Math.ceil(listings.length / 4) }).map((_, idx) => (
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
      </div>
    </section>
  );
};

export default ListingsSection;
