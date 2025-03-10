'use client';

import Sidebar from '@/components/users/Sidebar';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { IoMenu, IoClose } from 'react-icons/io5';

const ProfileLayout = ({ children }) => {
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user._id;
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLinkClick = () => {
    setSidebarOpen(false); // Close the menu
  };

  return (
      <div className="flex w-full h-screen">
        {/* Toggle Button (Hamburger / Close) */}
        <button
          className="fixed top-15 left-0 z-50 p-2 bg-gray-100 rounded-md shadow md:hidden"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>
  
        {/* Sidebar (Slide In/Out on Mobile, Static on Larger Screens) */}
        <div
          className={`fixed  h-1/2 bg-white w-64 shadow-md z-40 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:h-full`}
        >
          <aside>
            {isAuthenticated ? <Sidebar onLinkClick={handleLinkClick} /> : null}
          </aside>
        </div>
  
        {/* Backdrop for Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
  
        {/* Main Content */}
        <div className="flex-grow md:w-3/4 justify-center">
          <main>{children}</main>
        </div>
      </div>
    );
};

export default ProfileLayout;
