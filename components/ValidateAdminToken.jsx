'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { validateAdmin } from '@/store/slices/admin/users/adminSlice';

const ValidateAdminToken = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const adminInfo = useSelector((state) => state.admin.adminInfo);
  const status = useSelector((state) => state.admin.status);
  const userInfo = useSelector((state) => state.user.user);

  useEffect(() => {
    // Only validate admin token if:
    // 1. We're on an admin route
    // 2. No admin is currently logged in
    // 3. Not currently loading
    // 4. No regular user is logged in (to avoid token conflicts)
    const isAdminRoute = pathname?.startsWith('/admin');
    
    if (isAdminRoute && !adminInfo && status !== 'loading' && !userInfo) {
      console.log('🔄 Dispatching validateAdmin...');
      dispatch(validateAdmin())
        .unwrap()
        .then(() => console.log('✅ Admin token validated successfully'))
        .catch((error) => {
          // Only log if it's not a 403 error (which is expected when no admin token exists)
          if (!error?.includes('Admin access required')) {
            console.log('❌ Admin token validation failed:', error);
          }
        });
    }
  }, [dispatch, adminInfo, status, userInfo, pathname]);

  return null;
};

export default ValidateAdminToken;