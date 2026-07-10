'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import BaseContentShell from '@/components/layout/BaseContentShell';
import ProfileSidebar from '@/components/layout/ProfileSidebar';
import Footer from '@/components/Footer';

/**
 * Profile layout - wraps all profile pages with authentication.
 */
const ProfileLayout = ({ children }) => {
  // Reset scroll to top on every profile page load / change. The tall auth-gate spinner
  // lets the browser restore a stale scroll offset, which otherwise leaves the short final
  // page scrolled down (heading hidden under the fixed header). See ProfilePageUX.md.
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <RequireVerifiedAccount>
      <div className="min-h-screen bg-white container mx-auto">
        <BaseContentShell>
          {/* Two-column on desktop: static sidebar (≥lg) + content. Below lg the sidebar
              collapses into a burger overlay rendered from the global Header. See ProfilePageUX.md. */}
          <div className="flex gap-6 lg:gap-8">
            <ProfileSidebar className="hidden lg:block w-60 shrink-0 self-start sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto" />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </BaseContentShell>
        <Footer />
      </div>
    </RequireVerifiedAccount>
  );
};

export default ProfileLayout;