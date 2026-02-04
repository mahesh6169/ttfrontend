'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaFrown, FaPlus, FaArrowRight, FaFire } from 'react-icons/fa';
import HomeCard from './HomeCard';
import BrowseAllCard from './BrowseAllCard';
import PromoBanner from '../PromoBanner';

const ListingsSection = ({ listings }) => {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  // Desktop: 4 cards per page
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalPages = listings ? Math.ceil(listings.length / 4) : 0;

  // Mobile: 2 cards per page
  const [mobilePage, setMobilePage] = useState(0);
  const [mobileIsPaused, setMobileIsPaused] = useState(false);
  const mobileResumeTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const totalMobilePages = listings ? Math.ceil(listings.length / 2) : 0;

  const handleCreateClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      localStorage.setItem('redirectAfterLogin', '/listings/add');
      router.push('/login?preserveRedirect=true');
    } else {
      localStorage.setItem('cancelRedirectUrl', '/');
    }
  };

  // Desktop auto-slide
  useEffect(() => {
    if (!listings || listings.length <= 4 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 4000);

    return () => clearInterval(timer);
  }, [listings, isPaused, totalPages]);

  // Mobile auto-slide
  useEffect(() => {
    if (!listings || listings.length <= 2 || mobileIsPaused) return;

    const timer = setInterval(() => {
      setMobilePage((prev) => (prev + 1) % totalMobilePages);
    }, 4000);

    return () => clearInterval(timer);
  }, [listings, mobileIsPaused, totalMobilePages]);

  const handleMobileTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setMobileIsPaused(true);
    if (mobileResumeTimer.current) {
      clearTimeout(mobileResumeTimer.current);
    }
  };

  const handleMobileTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleMobileTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipe = 50; // minimum px to count as a swipe

    if (swipeDistance > minSwipe) {
      // Swiped left → next page
      setMobilePage((prev) => Math.min(prev + 1, totalMobilePages - 1));
    } else if (swipeDistance < -minSwipe) {
      // Swiped right → previous page
      setMobilePage((prev) => Math.max(prev - 1, 0));
    }

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
        <div className="bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm">
          <div className="text-center py-8">
            <FaFrown className="text-slate-400 text-4xl sm:text-5xl mx-auto mb-3" />
            <p className="text-slate-600 text-sm sm:text-base mb-2">Something went wrong</p>
            <p className="text-slate-500 text-xs sm:text-sm">Please try again later</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-3 sm:py-6 sm:px-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-teal-800">Current Listings</h2>
        <Link
          href="/listings"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
        >
          View All <FaArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Desktop: Smooth sliding carousel - 4 per page */}
      <div
        className="hidden md:block overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
            <div key={pageIdx} className="min-w-full grid grid-cols-4 gap-4">
              {listings.slice(pageIdx * 4, pageIdx * 4 + 4).map((listing) => (
                <HomeCard key={listing._id} type="listing" data={listing} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Smooth sliding carousel - 2 per page */}
      <div
        className="md:hidden overflow-hidden"
        onTouchStart={handleMobileTouchStart}
        onTouchMove={handleMobileTouchMove}
        onTouchEnd={handleMobileTouchEnd}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${mobilePage * 100}%)` }}
        >
          {Array.from({ length: totalMobilePages }).map((_, pageIdx) => (
            <div key={pageIdx} className="min-w-full grid grid-cols-2 gap-2 px-1">
              {listings.slice(pageIdx * 2, pageIdx * 2 + 2).map((listing) => (
                <HomeCard key={listing._id} type="listing" data={listing} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile slide indicator dots */}
      {listings.length > 2 && (
        <div className="md:hidden flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalMobilePages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setMobilePage(idx)}
              className={`rounded-full transition-all ${
                mobilePage === idx
                  ? 'w-6 h-1.5 bg-teal-600'
                  : 'w-1.5 h-1.5 bg-gray-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Desktop slide indicator dots */}
      {listings.length > 4 && (
        <div className="hidden md:flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`rounded-full transition-all ${
                currentPage === idx
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

export default ListingsSection;
