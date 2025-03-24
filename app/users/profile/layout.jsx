'use client';

import { useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoMenu, IoClose } from 'react-icons/io5';
import Sidebar from '@/components/users/Sidebar';
import '@/assets/styles/globals.css';

const ProfileLayout = ({ children }) => {
  const router = useRouter();
  const { tokenValidated, user } = useSelector((state) => state.user);

  const isAuthenticated = tokenValidated && typeof user._id === 'string' && user._id.trim() !== '';
  const isVerified = user?.isAccountVerified;
  const isUnverified = isVerified === false || isVerified === null;

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isUnverified) {
      router.push('/users/emailverify');
    }
  }, [isAuthenticated, isUnverified, router]);

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      {/* Mobile Toggle Button */}
      <div className="md:hidden bg-white shadow-md p-2 flex justify-between items-center">
        <h2 className="text-lg font-bold">Menu</h2>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-gray-100 rounded-md shadow"
        >
          {isSidebarOpen ? <IoClose size={20} /> : <IoMenu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 bg-white shadow-md w-64 transform md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:w-1/4`}
      >
        {/* You can optionally hide the mobile close button here if you want */}
        {isAuthenticated && <Sidebar onLinkClick={handleLinkClick} />}
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
};

export default ProfileLayout;
