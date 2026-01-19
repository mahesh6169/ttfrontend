'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RiAdvertisementFill } from "react-icons/ri";
import { FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";

const BottomNavigation = () => {
  const pathname = usePathname();

  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;

  // Determine profile path based on user role
  const isAdmin = user?.role === 'admin';
  const profilePath = isAdmin ? '/admin/profile' : '/users/profile';

  const isActive = (path) => {
    if (path === profilePath) {
      return pathname === path ||
             (pathname.startsWith(path + '/') &&
              !pathname.includes('/conversations') &&
              !pathname.includes('/chat'));
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navItems = [
    { href: '/', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, label: 'Home', isHome: true },
    { href: '/listings', icon: <RiAdvertisementFill size={18} />, label: 'Listings' },
    { href: '/events', icon: <FaCalendarAlt size={16} />, label: 'Events' },
    { href: '/dailydeals', icon: <FaTag size={16} />, label: 'Deals' },
    { href: '/threads', icon: <MdOutlineGroups2 size={20} />, label: 'Forum' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-b border-gray-300 md:hidden z-40 safe-area-inset-pb shadow-lg">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              item.isHome
                ? (pathname === '/' ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
                : (isActive(item.href) ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
            }`}
          >
            <div className="h-5 flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-[10px] mt-0.5 relative">
              {item.label}
              {(item.isHome ? pathname === '/' : isActive(item.href)) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-lime-500"></span>
              )}
            </span>
          </Link>
        ))}

        {/* Profile - always last */}
        <Link
          href={isAuthenticated ? profilePath : '/login'}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            isAuthenticated
              ? (isActive(profilePath) ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
              : (isActive('/login') ? 'text-teal-700 font-semibold' : 'text-teal-700 hover:text-teal-600')
          }`}
        >
          <div className="h-5 flex items-center justify-center">
            <FaUser size={16} />
          </div>
          <span className="text-[10px] mt-0.5 relative">
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
