'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { validateAdmin } from '@/store/slices/admin/users/adminSlice';

const ProtectedAdminRoute = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { adminInfo, status } = useSelector((state) => state.admin);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // If no adminInfo, try to validate from cookie first
    if (!adminInfo && status !== 'loading') {
      dispatch(validateAdmin())
        .unwrap()
        .then(() => {
          setIsValidating(false);
        })
        .catch(() => {
          setIsValidating(false);
          toast.error('Admin access required. Please login.');
          router.push('/admin/login');
        });
    } else if (adminInfo) {
      setIsValidating(false);
      // Check if user has admin role
      if (adminInfo.role !== 'admin') {
        toast.error('Admin access required. Please login.');
        router.push('/admin/login');
      }
    }
  }, [adminInfo, status, dispatch, router]);

  // Show loading while validating
  if (isValidating || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render children
  if (!adminInfo || adminInfo.role !== 'admin') {
    return null;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedAdminRoute;