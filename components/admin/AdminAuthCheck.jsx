'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';

const AdminAuthCheck = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if admin is already authenticated on app load
    const checkAdminAuth = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/check-auth`,
          { withCredentials: true }
        );
        
        if (response.data.success && response.data.admin) {
          // Dispatch action to set admin info in Redux
          dispatch({
            type: 'admin/setAdminInfo',
            payload: response.data.admin
          });
        }
      } catch (error) {
        // Not authenticated, ignore
        console.log('Admin not authenticated');
      }
    };

    checkAdminAuth();
  }, [dispatch]);

  return null;
};

export default AdminAuthCheck;