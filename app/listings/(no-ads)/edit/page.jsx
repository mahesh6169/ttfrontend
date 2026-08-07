'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function EditListingRedirect() {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;

  useEffect(() => {
    // If logged in, redirect to manage ads
    // If not logged in, redirect to profile (which will show login)
    if (isLoggedIn) {
      router.push('/users/profile/manageads');
    } else {
      router.push('/users/profile');
    }
  }, [isLoggedIn, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirecting...</p>
      </div>
    </div>
  );
}