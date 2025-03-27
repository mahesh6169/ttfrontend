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
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    marketingOptIn: false,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state) => state.user);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Confirm Password is required';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.postcode && !/^\d{4}$/.test(formData.postcode)) {
      newErrors.postcode = 'Postcode must be exactly 4 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const result = await dispatch(registerUser({ ...formData })).unwrap();

      if (result) {
        toast.success('Registration successful. Sending OTP...');
        const otpResult = await dispatch(sendVerifyOtp()).unwrap();

        if (otpResult) {
          toast.success('OTP sent successfully. Redirecting...');
          router.push('/users/emailverify');
        }
      }
    } catch (err) {
      setMessage(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex w-full min-h-screen items-start justify-center">
      <div className="bg-white p-4 rounded-lg shadow-md max-w-md w-full mt-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            'name',
            'email',
            'password',
            'confirmPassword',
            'address',
            'suburb',
            'state',
            'postcode',
          ].map((field) => {
            const isRequired = ['name', 'email', 'password', 'confirmPassword', 'postcode'].includes(field);
            const labelText = field === 'confirmPassword' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1);
            const inputType = field.toLowerCase().includes('password') ? 'password' : 'text';

            return (
              <div key={field}>
                <label htmlFor={field} className="block font-medium capitalize">
                  {labelText}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  id={field}
                  name={field}
                  type={inputType}
                  value={formData[field]}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    errors[field] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={`Enter your ${field}`}
                />
                {errors[field] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                )}
              </div>
            );
          })}

          {/* Marketing Opt-In */}
          <div className="flex items-center">
            <input
              id="marketingOptIn"
              name="marketingOptIn"
              type="checkbox"
              checked={formData.marketingOptIn}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="marketingOptIn" className="text-sm text-gray-700">
              I agree to receive updates and offers
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}

        <div className="mt-6 text-center">
          <p>
            Already have an account?{' '}
            <Link href="/users/login" className="text-blue-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
