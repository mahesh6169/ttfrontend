'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ProfileSidebar from '@/components/layout/ProfileSidebar';
import BaseContentShell from '@/components/layout/BaseContentShell';
import '@/assets/styles/globals.css';

// Chat shares the profile shell: same ProfileSidebar (≥lg) + content, and the header
// burger overlay below lg. See designGuides/02-Frontend-GUI/ProfilePageUX.md.
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
    <div className="bg-white container mx-auto">
      <BaseContentShell>
        <div className="flex gap-6 lg:gap-8">
          <ProfileSidebar className="hidden lg:block w-60 shrink-0 self-start sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto" />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </BaseContentShell>
    </div>
  );
};

export default ChatLayout;
