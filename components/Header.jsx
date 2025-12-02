'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/store/slices/users/userSlice';
import {
  FaChevronRight,
} from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";
import { RiAdvertisementFill } from "react-icons/ri";
import { CgProfile } from 'react-icons/cg';
import { TbLogout, TbLogin } from 'react-icons/tb';
import { BsChatDots, BsChatDotsFill } from 'react-icons/bs';
import { FaCalendarAlt } from 'react-icons/fa';
import { MdLocalOffer } from 'react-icons/md';
import { toast } from 'react-toastify';
import { 
  setInActiveChat, 
  recalculateUnreadStatus 
} from '@/store/slices/shared/messageSlice';

const Header = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState(null);

  const { tokenValidated, user, status } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  // Show loading during initial state or when actively validating
  const isInitialLoad = status === 'idle' && !tokenValidated && !user;
  // Smart profile path based on user role
  const isAdmin = user?.role === 'admin';
  const baseProfilePath = isAdmin ? '/admin/profile' : '/users/profile';
  const profileLink = baseProfilePath;
  
  // Get both unreadExists and inActiveChat from state
  const { unreadExists, inActiveChat } = useSelector((state) => state.messages);

  // Only show notification if there are unread messages AND user is not in an active chat
  const showNotification = unreadExists && !inActiveChat;

  useEffect(() => {
    if (!isAuthenticated || !user || !user._id) return;
    
    const isOnChatPage = 
      pathname.includes('/chat/') || 
      pathname.includes('/users/profile/conversations');
    
    dispatch(setInActiveChat(isOnChatPage));
    dispatch(recalculateUnreadStatus({ currentUserId: user._id }));
  }, [pathname, isAuthenticated, user, dispatch]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/login');
      toast.success('Logout successful');
    } catch (error) {
      toast.error(error || 'Logout failed. Please try again.');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="container mx-auto py-2 md:py-2.5 text-teal-700 relative">

        {/* Top Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl md:text-2xl font-extrabold text-teal-700 hover:text-teal-600 transition-colors"
          >
            Desify
          </Link>

          {/* Mobile Auth Button - Show login or logout based on auth state */}
          <div className="md:hidden flex items-center gap-2">
            {(isInitialLoad || (status === 'loading' && !tokenValidated)) ? (
              // Show loading placeholder during initial load
              <div className="p-2">
                <div className="w-6 h-6 bg-teal-200/30 rounded animate-pulse"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/users/profile/conversations"
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors relative"
                  title="Messages"
                >
                  <div className="relative">
                    {showNotification ? (
                      <div className="animate-pulse">
                        <BsChatDotsFill size={22} className="text-teal-600 drop-shadow-[0_0_8px_rgba(13,148,136,0.6)]" />
                      </div>
                    ) : (
                      <BsChatDots size={22} className="text-teal-700" />
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Logout"
                >
                  <TbLogout size={24} className="text-teal-700" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="Login"
              >
                <TbLogin size={24} className="text-teal-700" />
              </Link>
            )}
          </div>

          {/* Desktop Nav Container - Hidden on mobile */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-8">
            {/* Center Nav */}
            <div className="flex gap-6 mx-auto">
              <NavLink
                href="/"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                text="Home"
                pathname={pathname}
              />
              <NavLink
                href="/listings"
                icon={<RiAdvertisementFill size={20} />}
                text="Listings"
                pathname={pathname}
              />
              <NavLink
                href="/events"
                icon={<FaCalendarAlt size={20} />}
                text="Events"
                pathname={pathname}
              />
              {/* <DropdownNavLink
                href="/deals"
                icon={<MdLocalOffer size={20} />}
                text="Deals"
                pathname={pathname}
                items={[
                  { href: '/discountcode', text: 'Discount Codes' },
                  { href: '/deals', text: 'Discounts', disabled: true }
                ]}
              /> */}
              <NavLink
                href="/threads"
                icon={<MdOutlineGroups2 size={30} />}
                text="Forum"
                pathname={pathname}
              />
            </div>

            {/* Right Nav - Auth Links */}
            <div className="flex items-center gap-2 lg:gap-4">
              {(isInitialLoad || (status === 'loading' && !tokenValidated)) ? (
                // Show loading placeholder during initial load or token validation
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-200/30 rounded animate-pulse">
                    <CgProfile size={20} className="text-teal-400/50" />
                    <div className="w-16 h-4 bg-teal-200/30 rounded"></div>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <>
                  <NavLink
                    href={profileLink}
                    icon={<CgProfile size={20} />}
                    text={<span className="max-w-[150px] truncate">{user.name}</span>}
                    pathname={pathname}
                  />
                  {/* Desktop Message Icon */}
                  <NavLink
                    href="/users/profile/conversations"
                    icon={
                      <div className="relative">
                        {showNotification ? (
                          <div className="animate-pulse">
                            <BsChatDotsFill size={22} className="drop-shadow-[0_0_8px_rgba(13,148,136,0.6)]" />
                          </div>
                        ) : (
                          <BsChatDots size={22} />
                        )}
                      </div>
                    }
                    text={<span className="hidden lg:inline">Messages</span>}
                    pathname={pathname}
                    showIconOnly="md"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-teal-700 hover:text-teal-600 transition-colors"
                    title="Logout"
                  >
                    <TbLogout size={20} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    href="/login"
                    icon={<TbLogin size={20} />}
                    text="Login"
                    pathname={pathname}
                  />
                  <NavLink
                    href="/register"
                    text="Register"
                    pathname={pathname}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

const DropdownNavLink = ({ href, icon, text, pathname, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link
        href={href}
        className={`flex items-center gap-2 px-2 md:px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 
          ${
            isActive
              ? 'text-teal-700 font-semibold'
              : 'text-teal-700 hover:bg-gray-50 hover:text-teal-600'
          }`}
      >
        {icon && <span>{icon}</span>}
        <span>{text}</span>
        <FaChevronRight 
          size={12} 
          className={`transform transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        />
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl min-w-[200px] py-2 z-50">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              className={`block px-4 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (item.disabled) e.preventDefault();
                setIsOpen(false);
              }}
            >
              {item.text}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const NavLink = ({ href, icon, text, pathname, mobile = false, onClick, showIconOnly }) => {
  // Check if the current path includes the href (for nested routes)
  // or if it's an exact match (for top-level routes)
  const isActive = pathname === href || 
                   (pathname?.includes('/users/profile/') && href.includes('/users/profile/') && 
                    pathname?.includes(href.split('/').pop())) ||
                   (pathname?.includes('/admin/profile/') && href.includes('/admin/profile/') && 
                    pathname?.includes(href.split('/').pop()));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-2 md:px-3 lg:px-4 py-2 rounded-lg transition-all duration-300 relative
        ${
          isActive
            ? 'text-teal-700 font-semibold'
            : 'text-teal-700 hover:bg-gray-50 hover:text-teal-600'
        } 
        ${mobile ? 'text-sm' : ''}`}
      title={typeof text === 'string' ? text : undefined}
    >
      {icon && <span>{icon}</span>}
      {showIconOnly === 'md' ? (
        <span className="hidden lg:block">{text}</span>
      ) : (
        <span>{text}</span>
      )}
      {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-lime-500 hidden md:block"></span>}
    </Link>
  );
};