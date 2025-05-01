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
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard functionality
  useEffect(() => {
    if (!tokenValidated) {
      router.push('/login');
      return;
    }
    
    // Verification check (only run if tokenValidated is true)
    if (user && (user.isAccountVerified === false || user.isAccountVerified === null)) {
      router.push('/users/emailverify');
    }
  }, [tokenValidated, user, router]);

  // Don't render children if not authenticated
  if (!tokenValidated) {
    return null;
  }

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row ">
      {/* Sidebar only visible on md+ screens */}
      <div className="hidden md:block md:max-w-[250px] md:min-w-[200px] md:w-auto">
        <Sidebar onLinkClick={handleLinkClick} />
      </div>

      {/* Main Content */}
      <div className="w-full">{children}</div>
    </div>
  );
};

export default ProfileLayout;