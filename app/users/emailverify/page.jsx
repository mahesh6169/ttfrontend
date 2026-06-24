'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { verifyEmail, sendVerifyOtp } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';
import BaseContentShell from '@/components/layout/BaseContentShell';

export default function EmailVerifyPage() {
  // Form state
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);
  const [verificationState, setVerificationState] = useState('idle'); // idle, verifying, success, error
  const [errorMessage, setErrorMessage] = useState('');
  
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
      setVerificationState('success');
      setTimeout(() => {
        router.push(redirectPath);
        localStorage.removeItem('redirectAfterLogin');
      }, 2000);
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
  const handleSubmit = async () => {
    setVerificationState('verifying');
    setErrorMessage('');
    
    try {
      const result = await dispatch(verifyEmail({ otp })).unwrap();
      
      if (result.message) {
        setVerificationState('success');
        // Don't use toast, show success state instead
        setTimeout(() => {
          router.push(redirectPath);
          localStorage.removeItem('redirectAfterLogin');
        }, 2000);
      }
    } catch (err) {
      setVerificationState('error');
      setErrorMessage(err || 'Invalid OTP. Please try again.');
    }
  };
  
  // Resend OTP handler
  const resendOtp = async () => {
    try {
      setResendDisabled(true);
      setTimer(30);
      setVerificationState('idle');
      setErrorMessage('');
      
      const result = await dispatch(sendVerifyOtp()).unwrap();
      
      if (result.success) {
        toast.success('New verification code sent to your email');
      }
    } catch (err) {
      setErrorMessage('Failed to resend verification code. Please try again.');
    }
  };
  
  // If component hasn't mounted yet, show minimal loading state
  if (!isMounted) {
    return (
      <div className="container mx-auto">
      <BaseContentShell>
        <div className="flex w-full justify-center items-center min-h-[400px]">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </BaseContentShell>
      </div>
    );
  }
  
  // Success state
  if (verificationState === 'success') {
    return (
      <div className="container mx-auto">
      <BaseContentShell>
        <div className="flex w-full justify-center">
        <div className="p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              Account Verified!
            </h1>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting you now...
            </p>
          </div>
          
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting in 2 seconds...
          </div>
        </div>
      </div>
      </BaseContentShell>
      </div>
    );
  }

  // Main component render
  return (
    <div className="container mx-auto">
    <BaseContentShell>
      <div className="flex w-full justify-center">
      <div className="p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-600 text-sm">
            We've sent a verification code to your email address. 
            Please enter it below to activate your account.
          </p>
        </div>
        
        {!user?.isAccountVerified && (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="otp" className="block font-medium mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (verificationState === 'error') {
                      setVerificationState('idle');
                      setErrorMessage('');
                    }
                  }}
                  className={`w-full p-3 border rounded-lg text-center text-lg tracking-wider ${
                    verificationState === 'error' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={verificationState === 'verifying'}
                />
              </div>
              
              {/* Error Message Display */}
              {verificationState === 'error' && errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}
              
              {/* Verification Status Display */}
              {verificationState === 'verifying' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    <p className="text-blue-700 text-sm">Verifying your code...</p>
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={handleSubmit}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  verificationState === 'verifying'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
                disabled={verificationState === 'verifying' || !otp.trim()}
              >
                {verificationState === 'verifying' ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify Account'
                )}
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Didn't receive the code?
                </p>
                <button
                  onClick={resendOtp}
                  disabled={resendDisabled}
                  className={`text-sm font-medium py-2 px-4 rounded-lg transition ${
                    resendDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {resendDisabled ? `Resend in ${timer}s` : 'Send New Code'}
                </button>
              </div>
            </div>
            
            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 Check your spam folder if you don't see the email. 
                The verification code expires in 15 minutes.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
    </BaseContentShell>
    </div>
  );
}