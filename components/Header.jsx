'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/store/slices/users/userSlice';
import {
  FaChevronRight,
  FaBars,
} from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";
import { RiAdvertisementFill } from "react-icons/ri";
import { CgProfile } from 'react-icons/cg';
import { LiaSignInAltSolid, LiaSignOutAltSolid } from 'react-icons/lia';
import { BsChatDots, BsChatDotsFill } from 'react-icons/bs';
import { FaCalendarAlt } from 'react-icons/fa';
import { MdLocalOffer } from 'react-icons/md';
import { HiReceiptPercent } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import {
  setInActiveChat,
  recalculateUnreadStatus
} from '@/store/slices/shared/messageSlice';
import ProfileSidebar from '@/components/layout/ProfileSidebar';

const Header = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState(null);
  // Mobile/tablet profile drawer (below lg). The burger replaces Signout there; the
  // overlay is the ProfileSidebar with Signout pinned at the bottom. See ProfilePageUX.md.
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { tokenValidated, user, status } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  // Show loading during initial state or when actively validating
  const isInitialLoad = status === 'idle' && !tokenValidated && !user;
  // Profile button always goes to the user profile — admins reach the console via /admin/login.
  const profileLink = '/users/profile';
  
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

  // Close the drawer whenever the route changes (backstop to per-link close).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // While the drawer is open: close on Esc and lock body scroll.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/login');
    } catch (error) {
      toast.error(error || 'Logout failed. Please try again.');
    }
  };

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-all duration-300 h-[68px]">
      <div className="container mx-auto py-2 md:py-2.5 text-slate-700 relative">

        {/* Top Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[40px] md:text-[44px] leading-none font-black tracking-tight md:font-extrabold md:tracking-normal text-teal-700 hover:text-teal-600 transition-colors"
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
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-gray-50 transition-colors relative"
                  title="Messages"
                >
                  <div className="relative">
                    {showNotification ? (
                      <div className="animate-pulse">
                        <BsChatDotsFill size={22} className="text-teal-600 drop-shadow-[0_0_8px_rgba(13,148,136,0.6)]" />
                      </div>
                    ) : (
                      <BsChatDots size={22} className="text-slate-700" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-700">Chat</span>
                </Link>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex flex-col items-center p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Menu"
                  aria-label="Open menu"
                  aria-expanded={drawerOpen}
                >
                  <FaBars size={22} className="text-slate-700" />
                  <span className="text-[10px] text-slate-700">Menu</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                title="Signin"
              >
                <LiaSignInAltSolid size={22} className="text-slate-700 scale-x-[-1]" />
                <span className="text-[10px] text-slate-700">Signin</span>
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
              <NavLink
                href="/deals"
                icon={<MdLocalOffer size={20} />}
                text="Deals"
                pathname={pathname}
              />
              <NavLink
                href="/coupons"
                icon={<HiReceiptPercent size={20} />}
                text="Coupons"
                pathname={pathname}
              />
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
                  {/* Below lg the sidebar is hidden → burger opens the profile drawer.
                      At lg+ the static sidebar is present, so Signout stays in the header. */}
                  <button
                    onClick={() => setDrawerOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300"
                    title="Menu"
                    aria-label="Open menu"
                    aria-expanded={drawerOpen}
                  >
                    <FaBars size={22} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="hidden lg:flex items-center gap-2 px-2 md:px-3 lg:px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300"
                    title="Signout"
                  >
                    <LiaSignOutAltSolid size={22} />
                    <span className="hidden lg:inline">Signout</span>
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    href="/login"
                    icon={<LiaSignInAltSolid size={22} className="scale-x-[-1]" />}
                    text="Signin"
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

    {/* Mobile/tablet profile drawer (below lg) — left slide-in overlay. See ProfilePageUX.md. */}
    {isAuthenticated && (
      <div
        className={`lg:hidden fixed inset-0 z-[60] ${drawerOpen ? '' : 'pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!drawerOpen}
      >
        {/* Dim backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Sliding panel */}
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[70%] bg-white/85 backdrop-blur-md shadow-xl flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-end px-2 pt-2 shrink-0">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="p-2 text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <ProfileSidebar
              onNavigate={() => setDrawerOpen(false)}
              onSignout={() => { setDrawerOpen(false); handleLogout(); }}
            />
          </div>
        </div>
      </div>
    )}
    </>
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
              ? 'text-teal-900 bg-slate-100 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
              className={`block px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors
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
            ? 'text-teal-900 bg-slate-100 font-semibold'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
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
    </Link>
  );
};