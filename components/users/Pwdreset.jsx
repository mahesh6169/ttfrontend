'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { sendResetOtp, resetPassword } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';

const ResetPasswordContent = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, resetStatus, otpMessage, resetError } = useSelector(
    (state) => state.user
  );

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    try {
      await dispatch(sendResetOtp(email)).unwrap();
      toast.success('OTP sent to your email');
      setOtpSent(true);
      setResendDisabled(true);
      setTimer(30);
    } catch (err) {
      toast.error(err || 'Failed to send OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      await dispatch(
        resetPassword({ email, otp, newPassword, confirmPassword })
      ).unwrap();
      toast.success('Password reset successful. Redirecting to login...');

      // 🔁 Wait 3 seconds, then redirect
      setTimeout(() => {
        router.push('/users/login');
      }, 3000);
    } catch (err) {
      toast.error(err || resetError || 'Failed to reset password.');
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
    <div className="flex my-4 w-full justify-center">
      <div className="p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Row 1 - Email + Send OTP */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              className="flex-1 p-2 border border-gray-300 rounded"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="button"
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              onClick={handleSendOtp}
              disabled={status === 'loading' || !email}
            >
              {status === 'loading' ? 'Sending...' : 'Send OTP'}
            </button>
          </div>

          {/* Only show OTP and password inputs after OTP is sent */}
          {otpSent && (
            <>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex justify-center">
  <ReCAPTCHA
    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
    onChange={(token) => setCaptchaToken(token)}
    onExpired={() => setCaptchaToken(null)}
  />
</div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                disabled={resetStatus === 'loading'}
              >
                {resetStatus === 'loading' ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
              type="button"
                onClick={handleSendOtp}
                disabled={resendDisabled}
                className={`w-full mt-4 text-sm font-medium py-2 rounded transition ${
                  resendDisabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {resendDisabled ? `Resend OTP in ${timer}s` : 'Resend OTP'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordContent;
