'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../store/slices/users/userSlice';
import { CgProfile } from 'react-icons/cg';
import { FaHome } from 'react-icons/fa';
import { FaEnvelope } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { TbLogout, TbLogin } from 'react-icons/tb';
import { RiAdvertisementFill } from 'react-icons/ri';

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  // Get user state from Redux
  const { user, isAuthenticated } = useSelector((state) => state.user);

  // Handle logout
  const handleLogout = async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      router.push('/users/login'); // Redirect to login page after successful logout
    } else {
      alert(result.payload || 'Logout failed.');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white text-black p-4 shadow-md mb-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo Section */}
        <div className="text-xl font-bold">
          <Link href="/" className="flex items-center space-x-2">
            <FaHome size={20} />
            <span>Marketplace</span>
          </Link>
        </div>

        {/* Navigation Links (Desktop) */}
        <div className="space-x-6 hidden md:flex items-center">
          {isAuthenticated ? (
            <>
              <Link
                href="/users/profile"
                className="flex items-center space-x-2 hover:underline"
              >
                <CgProfile size={20} />
                <span>{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:underline cursor-pointer"
              >
                <TbLogout size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/users/login"
                className="flex items-center space-x-2 hover:underline"
              >
                <TbLogin size={20} />
                <span>Login</span>
              </Link>
              <Link
                href="/users/register"
                className="flex items-center space-x-2 hover:underline"
              >
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="block md:hidden focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-4 z-50 transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:hidden`}
        >
          {isAuthenticated ? (
            <>
              <Link
                href="/users/profile"
                className="block flex items-center space-x-2 hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                <CgProfile size={20} />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false); // Close the menu after logout
                }}
                className="block text-left flex items-center space-x-2 hover:underline cursor-pointer"
              >
                <TbLogout size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/users/login"
                className="block flex items-center space-x-2 hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                <TbLogin size={20} />
                <span>Login</span>
              </Link>
              <Link
                href="/users/register"
                className="block flex items-center space-x-2 hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
