'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/store/slices/userSlice';
import { FaHome, FaHashtag, FaCalendarAlt, FaBars } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { CgProfile } from 'react-icons/cg';
import { TbLogout, TbLogin } from 'react-icons/tb';
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
    <header className="bg-white">
      <div className="header-container container py-2 shadow">
        <div className="header-flexbox flex items-center justify-between">
          {/* Logo */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="logo text-4xl font-extrabold flex items-center gap-1">
                <FaHashtag size={32} /> Telugu
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/" icon={<FaHome size={20} />} text="Home" pathname={pathname} />
            <NavLink href="/events" icon={<FaCalendarAlt size={20} />} text="Events" pathname={pathname} />
            <NavLink href="/threads" icon={<FaHashtag size={20} />} text="Threads" pathname={pathname} />
          </div>

          {/* Desktop Auth Links */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <NavLink href={profileLink} icon={<CgProfile size={20} />} text={user.name} pathname={pathname} />
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
                <NavLink href="/users/login" icon={<TbLogin size={20} />} text="Login" pathname={pathname} />
                <NavLink href="/users/register" text="Register" pathname={pathname} />
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden focus:outline-none"
            onClick={toggleMobileMenu}
          >
            <FaBars className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Navigation Panel */}
      <div className="md:hidden">
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Slide-in Header */}
          <div className="flex items-center justify-between p-4 border-b shadow-sm">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 bg-gray-100 rounded-md shadow"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Slide-in Nav Items */}
          <nav className="p-4 space-y-2">
            <NavLink href="/" text="Home" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />
            <NavLink href="/events" text="Events" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />
            <NavLink href="/threads" text="Threads" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />

            {isAuthenticated ? (
              <>
                <NavLink href={profileLink} text="Profile" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />
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
                <NavLink href="/users/login" text="Login" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />
                <NavLink href="/users/register" text="Register" pathname={pathname} mobile onClick={() => setMobileMenuOpen(false)} />
              </>
            )}
          </nav>
        </div>

        {/* Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black opacity-30 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;

// 🔗 Reusable NavLink component
const NavLink = ({ href, icon, text, pathname, mobile = false, onClick }) => {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded 
        ${isActive ? 'bg-gray-950 text-white' : 'hover:bg-gray-200'} 
        ${mobile ? 'block' : ''}`}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </Link>
  );
};
