'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken } from '@/store/slices/users/userSlice';

const RequireVerifiedAccount = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { tokenValidated, user, status } = useSelector((state) => state.user);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await dispatch(validateToken());
      } catch (error) {
        console.log('Token validation failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    if (isInitializing) {
      initAuth();
    }
  }, [dispatch, isInitializing]);

  // Auth guard - redirect if not logged in or not verified
  useEffect(() => {
    if (isInitializing) return;

    if (!tokenValidated || !user) {
      router.replace('/login');
      return;
    }

    // Guests attend only - they must never reach the member area, regardless of the
    // verified flag (a guest could otherwise self-verify via OTP, or be flipped by hand).
    // See featureplans/events-guest-attendee.md.
    if (user.role === 'guest') {
      router.replace('/');
      return;
    }

    // Check if account is verified
    if (user && (user.isAccountVerified === false || user.isAccountVerified === null)) {
      router.replace('/users/emailverify');
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

  // Don't render children if not authenticated, a guest, or not verified
  if (!tokenValidated || !user || user.role === 'guest' || user.isAccountVerified === false || user.isAccountVerified === null) {
    return null;
  }

  return <>{children}</>;
};

export default RequireVerifiedAccount;