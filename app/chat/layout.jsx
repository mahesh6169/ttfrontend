'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/users/Sidebar';
import BaseContentShell from '@/components/layout/BaseContentShell';
import '@/assets/styles/globals.css';

const ChatLayout = ({ children }) => {
  const router = useRouter();
  const { tokenValidated, user } = useSelector((state) => state.user);

  // Verification check (only run if tokenValidated is true)
  useEffect(() => {
    if (tokenValidated && (user?.isAccountVerified === false || user?.isAccountVerified === null)) {
      router.push('/users/emailverify');
    }
  }, [tokenValidated, user, router]);

  return (
    <div className="container mx-auto flex flex-col md:flex-row">
      {/* Sidebar only visible on md+ screens */}
      <div className="hidden md:block md:max-w-[250px] md:min-w-[180px] md:w-auto">
        <Sidebar onLinkClick={() => {}} />
      </div>

      {/* Main Content */}
      <div className="w-full">
        <BaseContentShell>{children}</BaseContentShell>
      </div>
    </div>
  );
};

export default ChatLayout;
