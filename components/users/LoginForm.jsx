'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/slices/users/userSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';

// List of allowed email domains (popular providers)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'live.com',
  'msn.com',
  'bigpond.com',
  'optusnet.com.au',
  'iinet.net.au',
  'internode.on.net',
  'tpg.com.au',
  'aapt.net.au',
  'telstra.com',
  'dodo.com.au',
];

// Helper function to sanitize input and prevent XSS
const sanitizeInput = (input) => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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
          localStorage.getItem('redirectAfterLogin') || '/users/profile/manageads';
      }

      localStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    }
  }, [user, router, preserveRedirect]);

  // AU domain suffixes
  const AU_SUFFIXES = ['.com.au', '.net.au', '.org.au', '.edu.au', '.gov.au'];

  // Validate email domain
  const isValidEmailDomain = (email) => {
    if (!email || !email.includes('@')) return false;
  
    const domain = email.split('@')[1].toLowerCase();
  
    return (
      ALLOWED_EMAIL_DOMAINS.includes(domain) ||
      domain.endsWith('.au') ||
      AU_SUFFIXES.some((suffix) => domain.endsWith(suffix))
    );
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email format is invalid';
    } else if (!isValidEmailDomain(credentials.email)) {
      newErrors.email = 'Registration is limited to reputable email services.';
    }
    
    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    setCredentials({ ...credentials, [name]: sanitizedValue });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if honeypot field is filled (bots often fill hidden fields)
    if (honeypotRef.current && honeypotRef.current.value) {
      console.log('Bot detected via honeypot'); // Log for monitoring
      // Pretend success but do nothing
      toast.success('Processing your request...');
      return;
    }
    
    // Check if form was submitted too quickly (bot detection)
    const currentTime = Date.now();
    const timeElapsed = currentTime - formLoadTime;
    if (timeElapsed < 1500) { // Less than 1.5 seconds
      console.log('Bot detected: form filled too quickly'); // Log for monitoring
      // Slow down the response to discourage bots
      setTimeout(() => {
        toast.error('An error occurred. Please try again later.');
      }, 2000);
      return;
    }
    
    // Rate limiting
    if (currentTime - lastSubmitTime < 3000) { // 3 seconds between submissions
      toast.error('Please wait before trying again');
      return;
    }
    
    // Increment submission counter for rate limiting
    setSubmitCount(submitCount + 1);
    setLastSubmitTime(currentTime);
    
    // Too many attempts
    if (submitCount >= 5) {
      toast.error('Too many login attempts. Please try again later');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check captcha
    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }
    
    try {
      const result = await dispatch(
        loginUser({ 
          ...credentials, 
          captchaToken,
          formLoadTime, // Send to server for additional timing verification
          timeElapsed
        })
      ).unwrap();
      
      if (result) {
        toast.success('Login successful! Redirecting...');
        // Redirection handled in useEffect
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
                className="text-blue-600 hover:underline"
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
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
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
              className="text-blue-600 hover:underline"
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