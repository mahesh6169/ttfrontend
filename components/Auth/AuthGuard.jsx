// auth-guard.js
'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }) {
  const router = useRouter();
  const { tokenValidated } = useSelector((state) => state.user);
  
  useEffect(() => {
    if (!tokenValidated) {
      router.push('/users/login');
    }
  }, [tokenValidated, router]);

  if (!tokenValidated) {
    return null; // Don't render children if not authenticated
  }

  return children;
}