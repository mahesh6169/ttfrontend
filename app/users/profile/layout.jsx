'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken } from '@/store/slices/users/userSlice';
import Sidebar from '@/components/users/Sidebar';
import '@/assets/styles/globals.css';

const ProfileLayout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { tokenValidated, user, status } = useSelector((state) => state.user);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to validate existing token/session
        await dispatch(validateToken());
      } catch (error) {
        // If validation fails, user will need to login
        console.log('Token validation failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    if (isInitializing) {
      initAuth();
    }
  }, [dispatch, isInitializing]);

  // Auth guard - only redirect after initialization is complete
  useEffect(() => {
    if (isInitializing) return; // Don't redirect while still checking auth

    if (!tokenValidated || !user) {
      router.push('/login');
      return;
    }
    
    // Verification check (only run if tokenValidated is true)
    if (user && (user.isAccountVerified === false || user.isAccountVerified === null)) {
      router.push('/users/emailverify');
    }
  }, [tokenValidated, user, router, isInitializing]);

  // Show loading while initializing
  if (isInitializing || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!tokenValidated || !user) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar only visible on md+ screens */}
      <div className="hidden md:block md:max-w-[250px] md:min-w-[200px] md:w-auto">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="w-full">{children}</div>
    </div>
  );
};

export default ProfileLayout;