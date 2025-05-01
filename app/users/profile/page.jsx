'use client';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { user, status } = useSelector((state) => state.user);
 
  // Show loading spinner while fetching profile
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="my-4 w-full justify-center">
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Manage Profile
      </h1>
      <p className="text-center">Welcome to your profile page.</p>
    </div>
  );
};

export default ProfilePage;
