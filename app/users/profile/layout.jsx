'use client';

import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import BaseContentShell from '@/components/layout/BaseContentShell';

/**
 * Profile layout - wraps all profile pages with authentication.
 * No sidebar - profile page uses accordion navigation instead.
 */
const ProfileLayout = ({ children }) => {
  return (
    <RequireVerifiedAccount>
      <div className="min-h-screen bg-white container mx-auto">
        <BaseContentShell>{children}</BaseContentShell>
      </div>
    </RequireVerifiedAccount>
  );
};

export default ProfileLayout;