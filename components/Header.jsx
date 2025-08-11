'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/store/slices/users/userSlice';
import {
  FaHome,
  FaHashtag,
  FaCalendarAlt,
  FaBars,
  FaUser,
  FaAd,
  FaEnvelope,
  FaMoneyCheckAlt,
  FaChevronRight,
  FaFileInvoice,
} from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";
import { RiAdvertisementFill } from "react-icons/ri";
import { IoClose } from 'react-icons/io5';
import { CgProfile } from 'react-icons/cg';
import { TbLogout, TbLogin } from 'react-icons/tb';
import { MdFavorite } from 'react-icons/md';
import { BsChatText, BsChatDots } from 'react-icons/bs';
import { HiSpeakerphone } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { 
  setInActiveChat, 
  recalculateUnreadStatus 
} from '@/store/slices/shared/messageSlice';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { tokenValidated, user, status } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  // Show loading during initial state or when actively validating
  const isInitialLoad = status === 'idle' && !tokenValidated && !user;
  // Always use regular profile path to allow admins to use regular UI
  const baseProfilePath = '/users/profile';
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-teal-700 shadow">
      <div className="container mx-auto py-2 space-y-2 text-lime-100 relative">

        {/* Top Row */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-3xl font-extrabold"
          >
            Desify
          </Link>

          {/* Desktop Nav Container - Hidden on mobile */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-8">
            {/* Center Nav */}
            <div className="flex gap-6 mx-auto">
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
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-lime-200/30 rounded animate-pulse">
                    <CgProfile size={20} className="text-lime-200/50" />
                    <div className="w-16 h-4 bg-lime-200/30 rounded"></div>
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
                      <div className={`relative ${showNotification ? 'text-red-700 animate-pulse' : ''}`}>
                        <BsChatDots size={22} />
                      </div>
                    }
                    text={<span className="hidden lg:inline">Messages</span>}
                    pathname={pathname}
                    showIconOnly="md"
                  />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 hover:underline"
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

          {/* Mobile Header Right Section */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Message Icon */}
            {!isInitialLoad && status !== 'loading' && isAuthenticated && (
              <Link
                href="/users/profile/conversations"
                className="text-lime-100 hover:text-lime-200"
              >
                <div className={`${showNotification ? 'text-red-700 animate-pulse' : ''}`}>
                  <BsChatDots size={22} />
                </div>
              </Link>
            )}
            
            {/* Hamburger Menu */}
            <button onClick={toggleMobileMenu}>
              <FaBars className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex md:hidden items-center justify-around  pt-2 text-lime-200">
          <NavLink
            href="/listings"
            icon={<RiAdvertisementFill size={20} />}
            text="Listings"
            pathname={pathname}
            mobile
          />
          <NavLink
            href="/events"
            icon={<FaCalendarAlt size={20} />}
            text="Events"
            pathname={pathname}
            mobile
          />
          <NavLink
            href="/threads"
            icon={<MdOutlineGroups2 size={28} />}
            text="Forum"
            pathname={pathname}
            mobile
          />
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="fixed top-0 left-0 h-full w-50 z-50 shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0 bg-teal-700 flex flex-col">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between p-4 border-b shadow-sm text-lime-100 flex-shrink-0">
                  <NavLink
                    href={profileLink}
                    icon={<CgProfile size={18} />}
                    text={user.name}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 bg-teal-700 rounded-md shadow"
                  >
                    <IoClose size={20} />
                  </button>
                </div>

                <nav className="p-4 pb-8 space-y-2 text-lime-100 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-lime-200/30 scrollbar-track-transparent">
                  {/* User section */}
                  <NavLink
                    href={`${baseProfilePath}/settings`}
                    icon={<FaUser />}
                    text="User Settings"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/favourites`}
                    icon={<MdFavorite />}
                    text="Favourites"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/conversations`}
                    icon={
                      <div className={showNotification ? 'text-red-700 animate-pulse' : ''}>
                        <FaEnvelope />
                      </div>
                    }
                    text="Messages"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/myregistrations`}
                    icon={<FaCalendarAlt />}
                    text="My RSVPs"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/mytickets`}
                    icon={<FaMoneyCheckAlt />}
                    text="My Tickets"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/myinvoices`}
                    icon={<FaFileInvoice />}
                    text="My Invoices"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  
                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t border-lime-200/30"></div>
                  </div>
                  
                  {/* Management section */}
                  <NavLink
                    href={`${baseProfilePath}/manageads`}
                    icon={<FaAd />}
                    text="Manage Listings"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/manageevents`}
                    icon={<FaCalendarAlt />}
                    text="Manage Events"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/managethreads`}
                    icon={<BsChatText />}
                    text="Manage Topics"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  
                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t border-lime-200/30"></div>
                  </div>
                  
                  {/* Event Organiser dropdown */}
                  <MobileDropdown
                    label="Event Organiser"
                    icon={<FaCalendarAlt />}
                    pathname={pathname}
                    baseProfilePath={baseProfilePath}
                    toggleMobileMenu={toggleMobileMenu}
                  />
                  
                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t border-lime-200/30"></div>
                  </div>

                  {/* Check-In section */}
                  <NavLink
                    href={`${baseProfilePath}/checkInFree`}
                    icon={<FaCalendarAlt />}
                    text="Check-In RSVPs"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/checkInPaid`}
                    icon={<FaCalendarAlt />}
                    text="Check-In Paid"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  
                  {/* Divider */}
                  <div className="py-2">
                    <div className="border-t border-lime-200/30"></div>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block hover:underline w-full text-start px-4 py-2"
                  >
                    Logout
                  </button>
                </nav>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b shadow-sm text-lime-100 flex-shrink-0">
                  <h2 className="text-lg font-semibold">Welcome</h2>
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 bg-teal-700 rounded-md shadow"
                  >
                    <IoClose size={20} />
                  </button>
                </div>

                <nav className="p-4 space-y-2 text-lime-100 overflow-y-auto flex-1">
                  <NavLink
                    href="/login"
                    text="Login"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/register"
                    text="Register"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                </nav>
              </>
            )}
          </div>

          <div
            className="fixed inset-0 bg-black opacity-30 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        </>
      )}
    </header>
  );
};

export default Header;

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
      className={`flex items-center gap-2 px-2 md:px-3 lg:px-4 py-2 rounded 
        ${
          isActive
            ? 'bg-lime-100 text-teal-700'
            : 'hover:bg-lime-50 hover:text-teal-700'
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

const MobileDropdown = ({ label, icon, pathname, baseProfilePath, toggleMobileMenu }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const dropdownItems = [
    { label: 'Stripe', href: `${baseProfilePath}/settings/stripeSetup`, icon: <FaMoneyCheckAlt /> },
    { label: 'Manage Refunds', href: `${baseProfilePath}/refunds`, icon: <FaMoneyCheckAlt /> },
  ];
  
  // Check if any child route is active
  const isChildActive = dropdownItems.some(item => pathname === item.href);
  
  /// Auto-open dropdown if a child route is active
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);
  
  return (
    <div>
      <div 
        className={`flex items-center space-x-2 p-2 rounded hover:bg-lime-50 hover:text-teal-700 cursor-pointer transition-colors ${
          isChildActive ? 'bg-lime-100 text-teal-700 font-bold' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {icon}
        <span className="flex-1">{label}</span>
        <span className={`transition-transform duration-200 ${
          isOpen ? 'rotate-90' : ''
        }`}>
          <FaChevronRight size={12} />
        </span>
      </div>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <ul className="ml-4 mt-1 space-y-1 border-l-2 border-lime-200">
          {dropdownItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={toggleMobileMenu}
                className={`flex items-center gap-2 pl-4 pr-2 py-2 rounded transition-colors ${
                  pathname === item.href 
                    ? 'bg-lime-100 text-teal-700 font-bold' 
                    : 'hover:bg-lime-50 hover:text-teal-700'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};