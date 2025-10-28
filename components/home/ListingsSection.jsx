'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import HomeCard from './HomeCard';
import BrowseAllCard from './BrowseAllCard';
import PromoBanner from '../PromoBanner';

const ListingsSection = ({ listings }) => {
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
      localStorage.setItem('redirectAfterLogin', '/listings/add');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/');
    }
  };

  useEffect(() => {
    if (!listings || listings.length <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 4;
        return nextIndex >= listings.length ? 0 : nextIndex;
      });
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
      <section className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Latest Listings</h2>
          <Link href="/listings" className="text-sm sm:text-base text-teal-600 hover:text-teal-700 font-medium">
            View All →
          </Link>
        </div>
        <p className="text-center text-gray-500 py-8">No listings available</p>
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm">
        <div className="mb-3 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-3 mb-2">
            <h2 className="text-lg sm:text-2xl font-bold text-teal-700 flex-shrink-0">Latest Listings</h2>
            <div className="flex gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
              <Link 
                href="/listings/add" 
                onClick={handleCreateClick}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors text-center"
              >
                Create
              </Link>
              <Link 
                href="/listings" 
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-teal-600 text-teal-600 hover:bg-teal-50 text-xs sm:text-sm font-medium rounded-md transition-colors text-center"
              >
                View All →
              </Link>
            </div>
          </div>
          
          <div>
            <PromoBanner page="listings" inline={true} showAll={true} />
          </div>
        </div>

        {/* Desktop: 4 rotating cards */}
        <div 
          className="hidden md:grid md:grid-cols-4 gap-4"
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
