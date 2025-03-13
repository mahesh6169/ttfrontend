'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, sendVerifyOtp } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state) => state.user);

  // 🟢 Get the redirect path from localStorage or default to /users/profile
  const redirect = typeof window !== 'undefined'
    ? localStorage.getItem('redirectAfterLogin') || '/users/profile'
    : '/users/profile';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const result = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        })
      ).unwrap();

      if (result) {
        toast.success('Registration successful. Sending OTP...');

        const otpResult = await dispatch(sendVerifyOtp()).unwrap();

        if (otpResult) {
          toast.success('OTP sent successfully. Redirecting...');
          
          // ✅ Move to email verify page (keep redirect saved in localStorage)
          router.push('/users/emailverify');
        }
      }
    } catch (err) {
      setMessage(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex w-full h-screen items-start justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter your email"
              required
            />
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
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Confirm your password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link
              href="/users/login"
              className="text-blue-600 hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
