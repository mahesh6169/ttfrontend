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


const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
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

  // Handle redirection after login
  useEffect(() => {
    if (!preserveRedirect) {
      localStorage.removeItem('redirectAfterLogin');
    }

    if (user?._id) {
      let redirectPath;

      if (user.role === 'admin') {
        redirectPath = '/admin/profile';
      } else {
        redirectPath =
          localStorage.getItem('redirectAfterLogin') || '/users/profile';
      }

      localStorage.removeItem('redirectAfterLogin');
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
      const result = await dispatch(
        loginUser({
          ...credentials,
          captchaToken,
          formLoadTime,
          timeElapsed,
        })
      ).unwrap();
  
      if (result) {
        toast.success('Login successful! Redirecting...');
      }
    } catch (err) {
      toast.error(err || 'Authentication failed. Please check your credentials.');
    }
  };
  
  
  return (
    <div className="flex my-6 w-full justify-center">
      <div className="p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

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
              className={`w-full p-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
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
            <input
              id="password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              className={`w-full p-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded`}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
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
            className="w-full bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 py-2  transition"
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
              href="/register"
              className="text-teal-700 hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;