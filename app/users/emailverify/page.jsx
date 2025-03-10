'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { verifyEmail, sendVerifyOtp } from '@/store/slices/userSlice';
import { toast } from 'react-toastify';

const EmailVerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30); // Countdown timer for resend button

  const dispatch = useDispatch();
  const router = useRouter();

  const { user, status } = useSelector((state) => state.user);

  // Redirect to profile if already verified
  useEffect(() => {
    if (user?.isAccountVerified) {
      router.push('/users/profile');
    }
  }, [user, router]);

  // Handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await dispatch(verifyEmail({ otp })).unwrap();

      if (result.message) {
        toast.success('Account verified successfully. Redirecting...');
        setTimeout(() => {
          router.push('/users/profile');
        }, 3000);
      }
    } catch (err) {
      toast.error(err || 'Invalid OTP. Please try again.');
    }
  };

  // Resend OTP function
  const resendOtp = async () => {
    try {
      setResendDisabled(true); // Disable the button
      setTimer(30); // Reset timer

      const result = await dispatch(sendVerifyOtp()).unwrap();

      if (result.success) {
        toast.success('OTP has been resent to your email.');
      }
    } catch (err) {
      toast.error(err || 'Failed to resend OTP.');
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (resendDisabled) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(countdown);
            setResendDisabled(false);
            return 30; // Reset timer
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

        {/* OTP Form */}
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

              {/* Verify Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {/* Resend OTP Button */}
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

export default EmailVerifyPage;
