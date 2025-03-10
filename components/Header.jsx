'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { logoutUser } from '@/store/slices/userSlice';
import { FaHome, FaHashtag, FaCalendarAlt, FaBars } from 'react-icons/fa';
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
  const profileLink = user?.role === 'admin' ? '/users/admin' : '/users/profile';

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
        <div className="header-flexbox flex items-centre justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="text-4xl font-extrabold flex items-center gap-1">
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

          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <NavLink href={profileLink} icon={<CgProfile size={20} />} text={user.name} pathname={pathname} />
                <button onClick={handleLogout} className="flex items-center gap-2 hover:underline">
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
          <button className="md:hidden focus:outline-none" onClick={toggleMobileMenu}>
            <FaBars className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="container mx-auto md:hidden bg-white shadow-lg py-4">
          <nav className="space-y-1">
            <NavLink href="/" text="Home" pathname={pathname} mobile />
            <NavLink href="/events" text="Events" pathname={pathname} mobile />
            <NavLink href="/threads" text="Threads" pathname={pathname} mobile />
            {isAuthenticated ? (
              <>
                <NavLink href={profileLink} text="Profile" pathname={pathname} mobile />
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-left hover:underline w-full text-start px-4 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink href="/users/login" text="Login" pathname={pathname} mobile />
                <NavLink href="/users/register" text="Register" pathname={pathname} mobile />
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

// Separate NavLink component with logging
const NavLink = ({ href, icon, text, pathname, mobile = false }) => {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded 
        ${isActive ? 'bg-gray-950 text-white' : 'hover:bg-gray-200'} 
        ${mobile ? 'block' : ''}`}
    >
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </Link>
  );
};
