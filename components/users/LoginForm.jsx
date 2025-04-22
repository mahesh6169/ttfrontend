'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/store/slices/users/userSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useSearchParams } from 'next/navigation';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preserveRedirect = searchParams.get('preserveRedirect') === 'true';

  const { user, status } = useSelector((state) => state.user);
  const isLoading = status === 'loading';

  // 🔹 After successful login, handle redirection
  useEffect(() => {
    if (!preserveRedirect) {
      localStorage.removeItem('redirectAfterLogin'); // 🧹 clean up old redirect
    }

    if (user?._id) {
      let redirectPath;

      // 1. If admin, go to admin page
      if (user.role === 'admin') {
        redirectPath = '/admin/profile';
      } else {
        // 2. Look for a saved path in localStorage
        redirectPath =
          localStorage.getItem('redirectAfterLogin') || '/users/profile';
      }

      // 3. Clean up localStorage to avoid stale redirects
      localStorage.removeItem('redirectAfterLogin');

      // 4. Redirect!
      router.push(redirectPath);
    }
  }, [user, router]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await dispatch(loginUser(credentials)).unwrap();

      if (result) {
        toast.success('Login successful! Redirecting...');
        // ✅ Redirection handled in useEffect above
      }
    } catch (err) {
      toast.error(
        err || 'Authentication failed. Please check your credentials.'
      );
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
            <div className="text-right mt-1 text-sm">
              <Link
                href="/users/pwdreset"
                className="text-blue-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
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
              href="/users/register"
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
