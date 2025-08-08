'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { sendResetOtp, resetPassword } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';

const ResetPasswordContent = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, resetStatus, otpMessage, resetError } = useSelector(
    (state) => state.user
  );

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  
  // UI states
  const [currentStep, setCurrentStep] = useState(1); // 1: email, 2: otp, 3: password, 4: success
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await dispatch(sendResetOtp(email)).unwrap();
      setCurrentStep(2);
      setResendDisabled(true);
      setTimer(30);
    } catch (err) {
      setErrors({ email: err || 'Failed to send OTP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp.trim()) {
      setErrors({ otp: 'Please enter the verification code' });
      return;
    }
    setCurrentStep(3);
    setErrors({});
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    if (newPassword.length < 8) {
      setErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setErrors({ 
        newPassword: 'Password must contain uppercase, lowercase, and numbers' 
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await dispatch(
        resetPassword({ email, otp, newPassword, confirmPassword })
      ).unwrap();
      setCurrentStep(4);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setErrors({ submit: err || resetError || 'Failed to reset password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setResendDisabled(true);
    setTimer(30);
    setErrors({});
    
    try {
      await dispatch(sendResetOtp(email)).unwrap();
      toast.success('New verification code sent');
    } catch (err) {
      setErrors({ otp: 'Failed to resend verification code' });
    }
  };

  // Timer countdown effect
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

  // Step 4: Success State
  if (currentStep === 4) {
    return (
      <div className="flex w-full justify-center pt-8">
        <div className="p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Password Reset Complete!
          </h1>
          <p className="text-gray-600 mb-4">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center pt-8 px-4">
      <div className="p-6 rounded-lg shadow-md w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">
            {currentStep === 1 && "Enter your email to receive a verification code"}
            {currentStep === 2 && "Enter the code sent to your email"}
            {currentStep === 3 && "Create your new password"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-teal-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Email */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`w-full p-3 border rounded-lg ${
                  errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({});
                }}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSubmitting || !email.trim()}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                isSubmitting || !email.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending Code...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block font-medium mb-2">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                className={`w-full p-3 border rounded-lg text-center text-lg tracking-wider ${
                  errors.otp ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter 7-digit code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (errors.otp) setErrors({});
                }}
                maxLength={7}
              />
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!otp.trim()}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  !otp.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                Verify Code
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendDisabled}
                className={`text-sm font-medium py-2 px-4 rounded-lg transition ${
                  resendDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {resendDisabled ? `Resend in ${timer}s` : 'Send New Code'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: New Password */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block font-medium mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className={`w-full p-3 border rounded-lg ${
                  errors.newPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword) setErrors({});
                }}
              />
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`w-full p-3 border rounded-lg ${
                  errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({});
                }}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Error message for submission */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.submit}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  isSubmitting || !newPassword || !confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                🔐 <strong>Password Requirements:</strong><br/>
                • Minimum 8 characters<br/>
                • At least 1 uppercase letter<br/>
                • At least 1 lowercase letter<br/>
                • At least 1 number
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordContent;