'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/slices/users/userSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  sanitizeInput,
  validateAuthForm,
} from '@/utils/forms/validation';
import { isHoneypotTriggered, isFormSubmittedTooQuickly } from '@/utils/forms/antiBot';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const honeypotRef = useRef(null);
  
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preserveRedirect = searchParams.get('preserveRedirect') === 'true';
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(0);

  const { user, status } = useSelector((state) => state.user);
  const isLoading = status === 'loading';

  // Set form load time when component mounts
  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  // Handle redirection after login.
  // Only bounce a REAL member away from the login page. A guest (visitor sticker)
  // must be allowed to see the form so they can log in or upgrade to a real account -
  // matches the "guest = logged out" rule the header already uses (Header.jsx).
  useEffect(() => {
    if (user?._id && user?.role !== 'guest') {
      // Get redirect path from localStorage (set by RequireLogin or PostListingButton)
      const storedRedirect = localStorage.getItem('redirectAfterLogin');

      // Clear the stored redirect
      localStorage.removeItem('redirectAfterLogin');

      // Redirect logic:
      // 1. If there's a stored redirect and preserveRedirect=true, use it
      // 2. Otherwise, go to profile page (direct login case)
      const redirectPath = (preserveRedirect && storedRedirect) ? storedRedirect : '/users/profile';

      router.push(redirectPath);
    }
  }, [user, router, preserveRedirect]);



  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
  
    setCredentials((prev) => ({ ...prev, [name]: sanitizedValue }));
  
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const honeypotValue = honeypotRef.current?.value || '';
    const currentTime = Date.now();
    const timeElapsed = currentTime - formLoadTime;
  
    if (isHoneypotTriggered(honeypotValue)) {
      toast.success('Processing your request...');
      return;
    }
  
    if (isFormSubmittedTooQuickly(formLoadTime, 1500)) {
      setTimeout(() => {
        toast.error('An error occurred. Please try again later.');
      }, 2000);
      return;
    }
  
    if (currentTime - lastSubmitTime < 3000) {
      toast.error('Please wait before trying again');
      return;
    }
  
    setSubmitCount((prev) => prev + 1);
    setLastSubmitTime(currentTime);
  
    if (submitCount >= 5) {
      toast.error('Too many login attempts. Please try again later');
      return;
    }
  
    const validationErrors = validateAuthForm(credentials, 'login');
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
  
    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }
  
    try {
      await dispatch(
        loginUser({
          ...credentials,
          captchaToken,
          formLoadTime,
          timeElapsed,
        })
      ).unwrap();
    } catch (err) {
      toast.error(err || 'Authentication failed. Please check your credentials.');
    }
  };
  
  
  return (
    <>
      {/* Page title — centered (forms.md §2, matches Contact) */}
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Login</h1>
      </div>

      <div className="mx-auto max-w-[300px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              className={`w-full px-3 py-1.5 text-sm border ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              } rounded`}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 pr-10 text-sm border ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                } rounded`}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
            <div className="text-right mt-1 text-sm">
              <Link
                href="/users/pwdreset"
                className="text-teal-700 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Honeypot field - hidden from real users, but bots will fill it */}
          <input
            type="text"
            name="website"
            ref={honeypotRef}
            tabIndex="-1"
            aria-hidden="true"
            style={{ 
              position: 'absolute',
              opacity: 0,
              height: '0',
              width: '0',
              zIndex: -1
            }}
          />

          {/* ReCAPTCHA */}
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="mx-auto block bg-teal-700 text-white hover:bg-teal-800 rounded-full px-10 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p>
            Don't have an account?{' '}
            <Link
              href={preserveRedirect ? "/register?preserveRedirect=true" : "/register"}
              className="text-teal-700 hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;