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

  const isAuthenticated =
    tokenValidated && typeof user._id === 'string' && user._id.trim() !== '';
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
      {/* Sidebar only visible on md+ screens */}
      <div className="hidden md:block md:max-w-[250px] md:min-w-[180px] md:w-auto">
        {isAuthenticated && <Sidebar onLinkClick={handleLinkClick} />}
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
};

export default ProfileLayout;
