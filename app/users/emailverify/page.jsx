'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { verifyEmail, sendVerifyOtp } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';

// Client-side component with proper hydration handling
export default function EmailVerifyPage() {
  // Form state
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);
  
  // Important: Add this to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);
  
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Redux state
  const { user, status } = useSelector((state) => state.user);
  
  // Handle redirect path
  const [redirectPath, setRedirectPath] = useState('/users/profile');
  
  // First useEffect: Handle client-side initialization
  useEffect(() => {
    setIsMounted(true);
    
    // Safely access localStorage after component mount
    const savedRedirect = localStorage.getItem('redirectAfterLogin') || '/users/profile';
    setRedirectPath(savedRedirect);
    
    // Check if user is already verified
    if (user?.isAccountVerified) {
      router.push(savedRedirect);
      localStorage.removeItem('redirectAfterLogin');
    }
  }, []);
  
  // Second useEffect: Handle verification status changes
  useEffect(() => {
    if (isMounted && user?.isAccountVerified) {
      router.push(redirectPath);
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [user?.isAccountVerified, isMounted, router, redirectPath]);
  
  // Third useEffect: Handle countdown timer
  useEffect(() => {
    if (!isMounted) return;
    
    let countdown;
    if (resendDisabled) {
      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setResendDisabled(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdown) clearInterval(countdown);
    };
  }, [resendDisabled, isMounted]);
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(verifyEmail({ otp })).unwrap();
      
      if (result.message) {
        toast.success('Account verified successfully. Redirecting...');
        setTimeout(() => {
          router.push(redirectPath);
          localStorage.removeItem('redirectAfterLogin');
        }, 3000);
      }
    } catch (err) {
      toast.error(err || 'Invalid OTP. Please try again.');
    }
  };
  
  // Resend OTP handler
  const resendOtp = async () => {
    try {
      setResendDisabled(true);
      setTimer(30);
      
      const result = await dispatch(sendVerifyOtp()).unwrap();
      
      if (result.success) {
        toast.success('OTP has been resent to your email.');
      }
    } catch (err) {
      toast.error(err || 'Failed to resend OTP.');
    }
  };
  
  // If component hasn't mounted yet, show minimal loading state
  // This prevents hydration errors by ensuring consistent server/client render
  if (!isMounted) {
    return (
      <div className="flex w-full justify-center items-center min-h-[300px]">
        <div className="p-6 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Email Verification
          </h1>
          <div className="flex justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main component render - only runs client-side after mounting
  return (
    <div className="flex w-full justify-center pt-8">
      <div className="p-6 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Email Verification
        </h1>
        
        {!user?.isAccountVerified && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block font-medium">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter the OTP sent to your email"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            
            <button
              onClick={resendOtp}
              disabled={resendDisabled}
              className={`w-full mt-4 text-sm font-medium py-2 rounded transition ${
                resendDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {resendDisabled ? `Resend OTP in ${timer}s` : 'Resend OTP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}