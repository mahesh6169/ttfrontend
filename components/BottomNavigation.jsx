'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RiAdvertisementFill } from "react-icons/ri";
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";
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
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-teal-700 border-t border-teal-600 md:hidden z-40 safe-area-inset-pb">
      <div className="flex items-center justify-around h-16">
        <Link
          href="/listings"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/listings') 
              ? 'text-amber-400' 
              : 'text-lime-100 hover:text-lime-200'
          }`}
        >
          <RiAdvertisementFill size={20} />
          <span className="text-xs mt-0.5 font-medium">Listings</span>
        </Link>

        <Link
          href="/events"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/events') 
              ? 'text-amber-400' 
              : 'text-lime-100 hover:text-lime-200'
          }`}
        >
          <FaCalendarAlt size={18} />
          <span className="text-xs mt-0.5 font-medium">Events</span>
        </Link>

        <Link
          href="/threads"
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive('/threads') 
              ? 'text-amber-400' 
              : 'text-lime-100 hover:text-lime-200'
          }`}
        >
          <MdOutlineGroups2 size={22} />
          <span className="text-xs mt-0.5 font-medium">Forum</span>
        </Link>

        {isAuthenticated && (
          <Link
            href="/users/profile/conversations"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              isActive('/users/profile/conversations') || isActive('/chat')
                ? 'text-amber-400' 
                : 'text-lime-100 hover:text-lime-200'
            }`}
          >
            <div className="relative">
              {showNotification ? (
                <div className="animate-pulse">
                  <BsChatDotsFill size={20} className="drop-shadow-[0_0_8px_rgba(217,249,157,0.8)]" />
                </div>
              ) : (
                <BsChatDots size={20} />
              )}
            </div>
            <span className="text-xs mt-0.5 font-medium">Chat</span>
          </Link>
        )}

        <Link
          href={isAuthenticated ? profilePath : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive(isAuthenticated ? profilePath : '/login')
              ? 'text-amber-400' 
              : 'text-lime-100 hover:text-lime-200'
          }`}
        >
          <FaUser size={20} />
          <span className="text-xs mt-0.5 font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;