'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { verifyEmail, sendVerifyOtp } from '@/store/slices/userSlice';
import { toast } from 'react-toastify';

const EmailVerifyContent = () => {
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);

  const dispatch = useDispatch();
  const router = useRouter();

  // 🟢 Get redirect path from localStorage (as fallback, go to /users/profile)
  const redirect = typeof window !== 'undefined'
    ? localStorage.getItem('redirectAfterLogin') || '/users/profile'
    : '/users/profile';

  const { user, status } = useSelector((state) => state.user);

  useEffect(() => {
    if (user?.isAccountVerified) {
      router.push(redirect);

      // ✅ Clean up the redirect item if you no longer need it
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [user, router, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await dispatch(verifyEmail({ otp })).unwrap();

      if (result.message) {
        toast.success('Account verified successfully. Redirecting...');
        setTimeout(() => {
          router.push(redirect);
          localStorage.removeItem('redirectAfterLogin');
        }, 3000);
      }
    } catch (err) {
      toast.error(err || 'Invalid OTP. Please try again.');
    }
  };

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

  useEffect(() => {
    if (resendDisabled) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            setResendDisabled(false);
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [resendDisabled]);

  return (
    <div className="flex w-full h-screen items-start justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Email Verification</h1>

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
};

const EmailVerifyPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailVerifyContent />
    </Suspense>
  );
};

export default EmailVerifyPage;
