'use client';

import React, { useState } from 'react';
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
} from 'react-icons/fa';
import { MdOutlineGroups2 } from "react-icons/md";
import { RiAdvertisementFill } from "react-icons/ri";
import { IoClose } from 'react-icons/io5';
import { CgProfile } from 'react-icons/cg';
import { TbLogout, TbLogin } from 'react-icons/tb';
import { MdFavorite } from 'react-icons/md';
import { BsChatText, BsChatDots } from 'react-icons/bs';
import { toast } from 'react-toastify';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user._id;
  const baseProfilePath = user?.role === 'admin' ? '/admin/profile' : '/users/profile/';
  const profileLink = `${baseProfilePath}/manageads`;
  
  // Get both unreadExists and inActiveChat from state
  const { unreadExists, inActiveChat } = useSelector((state) => state.messages);

  // Only show notification if there are unread messages AND user is not in an active chat
  const showNotification = unreadExists && !inActiveChat;

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
            Telugufy
          </Link>

          {/* Center Nav - Desktop Only */}
          <div className="hidden md:flex gap-6 absolute left-1/2 transform -translate-x-1/2">
            <NavLink
              href="/adverts"
              icon={<RiAdvertisementFill size={20} />}
              text="Adverts"
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
          <div className="hidden md:flex items-center gap-4 ml-auto">
            {isAuthenticated ? (
              <>
                <NavLink
                  href={profileLink}
                  icon={<CgProfile size={20} />}
                  text={user.name}
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
                  text="Messages"
                  pathname={pathname}
                />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 hover:underline"
                >
                  <TbLogout size={20} />
                  <span>Logout</span>
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

          {/* Mobile Header Right Section */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Message Icon */}
            {isAuthenticated && (
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
            href="/"
            icon={<RiAdvertisementFill size={20} />}
            text="Adverts"
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
          <div className="fixed top-0 left-0 h-full w-50 z-50 shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0 bg-teal-700">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between p-4 border-b shadow-sm text-lime-100">
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

                <nav className="p-4 space-y-2 text-lime-100">
                  <NavLink
                    href={`${baseProfilePath}/settings`}
                    icon={<FaUser />}
                    text="Settings"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href={`${baseProfilePath}/manageads`}
                    icon={<FaAd />}
                    text="Manage Ads"
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
                  <NavLink
                    href={`${baseProfilePath}/favourites`}
                    icon={<MdFavorite />}
                    text="Favourites"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  {/* Keep message item in sidemenu for consistency */}
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
                <div className="flex items-center justify-between p-4 border-b shadow-sm text-lime-100">
                  <h2 className="text-lg font-semibold">Welcome</h2>
                  <button
                    onClick={toggleMobileMenu}
                    className="p-2 bg-teal-700 rounded-md shadow"
                  >
                    <IoClose size={20} />
                  </button>
                </div>

                <nav className="p-4 space-y-2 text-lime-100">
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

const NavLink = ({ href, icon, text, pathname, mobile = false, onClick }) => {
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
      className={`flex items-center gap-2 px-4 py-2 rounded 
        ${
          isActive
            ? 'bg-lime-100 text-teal-700'
            : 'hover:bg-lime-50 hover:text-teal-700'
        } 
        ${mobile ? 'text-sm' : ''}`}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </Link>
  );
};