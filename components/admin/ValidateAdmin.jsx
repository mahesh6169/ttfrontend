'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateAdmin } from '@/store/slices/admin/users/adminSlice';

const ValidateAdmin = () => {
  const dispatch = useDispatch();
  const { adminInfo } = useSelector((state) => state.admin);

  useEffect(() => {
    // Only dispatch validateAdmin if admin info is not already loaded
    if (!adminInfo) {
      console.log('🔄 Validating admin session...');
      dispatch(validateAdmin())
        .unwrap()
        .then(() => console.log('✅ Admin session validated'))
        .catch((error) => console.log('❌ Admin validation failed:', error));
    }
  }, [dispatch, adminInfo]);

  return null;
};

export default ValidateAdmin;