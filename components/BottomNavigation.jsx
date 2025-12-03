'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RiAdvertisementFill } from "react-icons/ri";
import { FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import { MdOutlineGroups2, MdLocalOffer } from "react-icons/md";
import { BsChatDots, BsChatDotsFill } from 'react-icons/bs';

const BottomNavigation = () => {
  const pathname = usePathname();
  
  // Get notification status
  const { unreadExists, inActiveChat } = useSelector((state) => state.messages);
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  const showNotification = unreadExists && !inActiveChat;
  
  // Determine profile path based on user role
  const isAdmin = user?.role === 'admin';
  const profilePath = isAdmin ? '/admin/profile' : '/users/profile';

  const isActive = (path) => {
    // Special handling for profile to not match conversations
    if (path === profilePath) {
      // Only match exact profile path or profile subpages, but NOT conversations or chat
      return pathname === path || 
             (pathname.startsWith(path + '/') && 
              !pathname.includes('/conversations') && 
              !pathname.includes('/chat'));
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-b border-gray-300 md:hidden z-40 safe-area-inset-pb shadow-lg">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            pathname === '/' 
              ? 'text-teal-700 font-semibold' 
              : 'text-teal-700 hover:text-teal-600'
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs mt-0.5 relative">
            Home
            {pathname === '/' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>

        <Link
          href="/listings"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isActive('/listings') 
              ? 'text-teal-700 font-semibold' 
              : 'text-teal-700 hover:text-teal-600'
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <RiAdvertisementFill size={22} />
          </div>
          <span className="text-xs mt-0.5 relative">
            Listings
            {isActive('/listings') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>

        <Link
          href="/events"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isActive('/events') 
              ? 'text-teal-700 font-semibold' 
              : 'text-teal-700 hover:text-teal-600'
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <FaCalendarAlt size={20} />
          </div>
          <span className="text-xs mt-0.5 relative">
            Events
            {isActive('/events') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>

        <Link
          href="/threads"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isActive('/threads') 
              ? 'text-teal-700 font-semibold' 
              : 'text-teal-700 hover:text-teal-600'
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <MdOutlineGroups2 size={24} />
          </div>
          <span className="text-xs mt-0.5 relative">
            Forum
            {isActive('/threads') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>

        <Link
          href="/deals"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isActive('/deals') 
              ? 'text-teal-700 font-semibold' 
              : 'text-teal-700 hover:text-teal-600'
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <FaTag size={20} />
          </div>
          <span className="text-xs mt-0.5 relative">
            Deals
            {isActive('/deals') && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>

        <Link
          href={isAuthenticated ? profilePath : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isAuthenticated 
              ? (isActive(profilePath) ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
              : (isActive('/login') ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
          }`}
        >
          <div className="h-6 flex items-center justify-center">
            <FaUser size={20} />
          </div>
          <span className="text-xs mt-0.5 relative">
            Profile
            {(isAuthenticated && isActive(profilePath)) && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
            {(!isAuthenticated && isActive('/login')) && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;