'use client';

import { useSelector } from 'react-redux';
import Sidebar from '@/components/users/Sidebar';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import '@/assets/styles/globals.css';

const ProfileLayout = ({ children }) => {
  const { user } = useSelector((state) => state.user);

  return (
    <RequireVerifiedAccount>
      <div className="flex flex-col md:flex-row">
        {/* Sidebar only visible on md+ screens */}
        <div className="hidden md:block md:max-w-[250px] md:min-w-[200px] md:w-auto">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="w-full">{children}</div>
      </div>
    </RequireVerifiedAccount>
  );
};

export default ProfileLayout;