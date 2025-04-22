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
import { IoClose } from 'react-icons/io5';
import { CgProfile } from 'react-icons/cg';
import { TbLogout, TbLogin } from 'react-icons/tb';
import { MdFavorite } from 'react-icons/md';
import { BsChatText } from 'react-icons/bs';
import { toast } from 'react-toastify';

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user._id;
  const profileLink =
    user?.role === 'admin' ? '/users/admin' : '/users/profile';

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      router.push('/users/login');
      toast.success('Logout successful');
    } catch (error) {
      toast.error(error || 'Logout failed. Please try again.');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto py-2 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-extrabold"
          >
            <FaHashtag size={28} /> Telugu
          </Link>

          <div className="hidden md:flex items-center gap-6 ml-auto">
            <NavLink
              href="/"
              icon={<FaHome size={20} />}
              text="Home"
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
              icon={<FaHashtag size={20} />}
              text="Threads"
              pathname={pathname}
            />

            {isAuthenticated ? (
              <>
                <NavLink
                  href={profileLink}
                  icon={<CgProfile size={20} />}
                  text={user.name}
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
                  href="/users/login"
                  icon={<TbLogin size={20} />}
                  text="Login"
                  pathname={pathname}
                />
                <NavLink
                  href="/users/register"
                  text="Register"
                  pathname={pathname}
                />
              </>
            )}
          </div>

          <button className="md:hidden" onClick={toggleMobileMenu}>
            <FaBars className="w-6 h-6" />
          </button>
        </div>

        <div className="flex md:hidden items-center justify-around border-t pt-2">
          <NavLink
            href="/"
            icon={<FaHome size={18} />}
            text="Home"
            pathname={pathname}
            mobile
          />
          <NavLink
            href="/events"
            icon={<FaCalendarAlt size={18} />}
            text="Events"
            pathname={pathname}
            mobile
          />
          <NavLink
            href="/threads"
            icon={<FaHashtag size={18} />}
            text="Threads"
            pathname={pathname}
            mobile
          />
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0">
            <div className="flex items-center justify-between p-4 border-b shadow-sm">
              <h2 className="text-lg font-semibold">Account</h2>
              <button
                onClick={toggleMobileMenu}
                className="p-2 bg-gray-100 rounded-md shadow"
              >
                <IoClose size={20} />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <NavLink
                    href={profileLink}
                    icon={<CgProfile size={18} />}
                    text={user.name}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/profile/settings"
                    icon={<FaUser />}
                    text="Settings"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/profile/manageads"
                    icon={<FaAd />}
                    text="Manage Ads"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/profile/managethreads"
                    icon={<BsChatText />}
                    text="Manage Threads"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/profile/favourites"
                    icon={<MdFavorite />}
                    text="Favourites"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/profile/conversations"
                    icon={<FaEnvelope />}
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
                </>
              ) : (
                <>
                  <NavLink
                    href="/users/login"
                    text="Login"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                  <NavLink
                    href="/users/register"
                    text="Register"
                    pathname={pathname}
                    mobile
                    onClick={toggleMobileMenu}
                  />
                </>
              )}
            </nav>
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
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded 
        ${
          isActive
            ? 'bg-gray-300 text-gray-900'
            : 'hover:bg-gray-200 hover:text-gray-900'
        } 
        ${mobile ? 'text-sm' : ''}`}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </Link>
  );
};
