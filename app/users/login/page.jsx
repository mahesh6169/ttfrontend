'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/slices/userSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Get the redirect param from URL, fallback to /users/profile
  const redirect = searchParams.get('redirect') || '/users/profile';

  const { user, status } = useSelector((state) => state.user);
  const isLoading = status === 'loading';

  // ✅ Redirect users based on role or redirect param
  useEffect(() => {
    if (user?._id) {
      if (user.role === 'admin') {
        router.push('/users/admin');
      } else {
        router.push(redirect); // ✅ Use dynamic redirect
      }
    }
  }, [user, router, redirect]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await dispatch(loginUser(credentials)).unwrap();

      if (result) {
        toast.success('Login successful! Redirecting...');
        // ✅ Redirection is handled in useEffect
      }
    } catch (err) {
      toast.error(err || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex w-full h-screen items-start justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
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
              className="w-full p-2 border border-gray-300 rounded"
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
              value={credentials.password}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter your password"
              required
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
              href={`/users/register?redirect=${encodeURIComponent(redirect)}`}
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
