'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { validateAdmin } from '@/store/slices/admin/users/adminSlice';

const ProtectedAdminRoute = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { adminInfo } = useSelector((state) => state.admin);
  const [isValidating, setIsValidating] = useState(true);
  // Validate from the cookie AT MOST ONCE per mount. Without this guard, a rejected validateAdmin sets
  // status='failed' but leaves adminInfo null, so an effect keyed on `status` re-dispatches forever - a
  // request storm that spams "No token provided." and slows the whole app. See feel-pass note.
  const triedRef = useRef(false);

  useEffect(() => {
    // Already have an admin: just gate on the role.
    if (adminInfo) {
      setIsValidating(false);
      if (adminInfo.role !== 'admin') {
        toast.error('Admin access required. Please login.');
        router.push('/admin/login');
      }
      return;
    }
    // No admin yet: try the cookie exactly once.
    if (triedRef.current) return;
    triedRef.current = true;
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
  }, [adminInfo, dispatch, router]);

  // Show loading while validating
  if (isValidating) {
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