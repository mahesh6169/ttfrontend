 'use client';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/userSlice';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { user, status } = useSelector((state) => state.user);
  const isAccountVerified = user?.isAccountVerified; 

  // Fetch profile on mount.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await dispatch(fetchuserProfile()).unwrap();
      } catch (err) {
        if (err === 'Authentication required. Please log in.') {
          router.push('/users/login');
        }
      }
    };

    fetchProfile();
  }, [dispatch, router]);



  // Show loading spinner while fetching profile
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">Manage Profile</h1>
      <p className='text-center'>Welcome to your profile page.</p>
    </div>
  );
};

export default ProfilePage;
