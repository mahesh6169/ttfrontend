'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const ProtectedAdminRoute = ({ children }) => {
  const router = useRouter();
  const { adminInfo } = useSelector((state) => state.admin);

  useEffect(() => {
    // Check if admin is logged in
    if (!adminInfo || adminInfo.role !== 'admin') {
      toast.error('Admin access required. Please login.');
      router.push('/admin/login');
    }
  }, [adminInfo, router]);

  // Show loading while checking auth
  if (!adminInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render children
  if (adminInfo.role !== 'admin') {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedAdminRoute;