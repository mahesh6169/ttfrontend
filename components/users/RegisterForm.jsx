'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, sendVerifyOtp } from '@/store/slices/userSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const libraries = ['places'];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    suburb: {
      name: '',
      state: '',
      postalCode: '',
      location: {
        type: 'Point',
        coordinates: [],
      },
    },
    marketingOptIn: false,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading } = useSelector((state) => state.user);
  const searchParams = useSearchParams();
  const preserveRedirect = searchParams.get('preserveRedirect') === 'true';

  useEffect(() => {
    if (!preserveRedirect) {
      localStorage.removeItem('redirectAfterLogin');
    }
  }, [preserveRedirect]);
  

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

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const addressComponents = place.address_components || [];

    let suburb = '';
    let state = '';
    let postalCode = '';
    let coordinates = [];

    addressComponents.forEach((component) => {
      const types = component.types;
      if (types.includes('locality')) suburb = component.long_name;
      if (types.includes('administrative_area_level_1')) state = component.short_name;
      if (types.includes('postal_code')) postalCode = component.long_name;
    });

    if (place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      coordinates = [lng, lat];
    }

    setFormData((prev) => ({
      ...prev,
      suburb: {
        name: suburb,
        state,
        postalCode,
        location: {
          type: 'Point',
          coordinates,
        },
      },
    }));

    if (errors.suburb) {
      setErrors((prev) => ({ ...prev, suburb: '' }));
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
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile is required';
    if (!/^04\d{8}$/.test(formData.mobile)) newErrors.mobile = 'Mobile must be 10 digits and start with 04';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    const { name, state, postalCode, location } = formData.suburb;
    if (!name || !state || !postalCode || location.coordinates.length !== 2) {
      newErrors.suburb = 'Please select a valid suburb using the autocomplete field';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await dispatch(registerUser(formData)).unwrap();
      if (result) {
        toast.success('Registration successful. Sending OTP...');
        const otpResult = await dispatch(sendVerifyOtp()).unwrap();
        if (otpResult) {
          const redirect = localStorage.getItem('redirectAfterLogin') || '/users/profile';
          localStorage.setItem('redirectAfterLogin', redirect);
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

          {['name', 'email', 'mobile', 'password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block font-medium capitalize">
                {field === 'confirmPassword' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                id={field}
                name={field}
                type={field.toLowerCase().includes('password') ? 'password' : 'text'}
                value={formData[field]}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors[field] ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={`Enter your ${field}`}
              />
              {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
            </div>
          ))}

          <div>
            <label className="block font-medium">Suburb</label>
            <LoadScriptNext
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              libraries={libraries}
            >
              <Autocomplete
                onLoad={(auto) => setAutocomplete(auto)}
                onPlaceChanged={handlePlaceChanged}
                options={{
                  componentRestrictions: { country: 'AU' },
                  types: ['(regions)'],
                }}
              >
                <input
                  type="text"
                  placeholder="Enter your suburb"
                  className={`w-full p-2 border rounded ${errors.suburb ? 'border-red-500' : 'border-gray-300'}`}
                />
              </Autocomplete>
            </LoadScriptNext>
            {errors.suburb && <p className="text-red-500 text-sm mt-1">{errors.suburb}</p>}
          </div>

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
