'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAccountDetails,
  updateAccountDetails,
  deleteUserAccount,
  logoutUser,
} from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Autocomplete, LoadScriptNext } from '@react-google-maps/api';

const libraries = ['places'];

export default function Settings() {
  const dispatch = useDispatch();
  const router = useRouter();
  const userId = useSelector((state) => state.user.user?._id);
  const [autocomplete, setAutocomplete] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    suburb: {
      name: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [0, 0] },
    },
    marketingOptIn: false,
  });

  useEffect(() => {
    dispatch(fetchAccountDetails()).then((res) => {
      if (res.payload) {
        setFormData(res.payload);
      }
    });
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('suburb.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        suburb: {
          ...prev.suburb,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const components = place.address_components || [];

    let suburb = '',
      state = '',
      postalCode = '';
    let coordinates = [];

    components.forEach((c) => {
      if (c.types.includes('locality')) suburb = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.short_name;
      if (c.types.includes('postal_code')) postalCode = c.long_name;
    });

    if (place.geometry?.location) {
      coordinates = [
        place.geometry.location.lng(),
        place.geometry.location.lat(),
      ];
    }

    setFormData((prev) => ({
      ...prev,
      suburb: {
        name: suburb,
        state,
        postalCode,
        location: { type: 'Point', coordinates },
      },
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await dispatch(updateAccountDetails(formData)).unwrap();
      toast.success(result || 'Account updated successfully');
    } catch (err) {
      toast.error(err || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    )
      return;

    try {
      console.log('🔸 Deleting account for userId:', userId);
      await dispatch(deleteUserAccount(userId)).unwrap();
      toast.success('Account deleted successfully');
      router.push('/');
    } catch (err) {
      toast.error(err || 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">
        Account Settings
      </h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Email (disabled) */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full p-2 border bg-gray-100 border-gray-200 rounded cursor-not-allowed"
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block font-medium mb-1">Mobile</label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Suburb (Google Autocomplete) */}
        <div>
          <label className="block font-medium mb-1">Suburb</label>
          <LoadScriptNext
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
          >
            <Autocomplete
              onLoad={(a) => setAutocomplete(a)}
              onPlaceChanged={handlePlaceChanged}
              options={{
                componentRestrictions: { country: 'AU' },
                types: ['(regions)'],
              }}
            >
              <input
                type="text"
                name="suburb.name"
                value={formData.suburb.name}
                onChange={handleChange}
                placeholder="Search and select suburb"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </Autocomplete>
          </LoadScriptNext>
        </div>

        {/* Marketing Opt-in */}
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
            I agree to receive communication and promotional emails
          </label>
        </div>

        {/* Update Button */}
        <button
          type="submit"
          className="w-full bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 py-2 rounded  transition"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Details'}
        </button>
      </form>

      {/* Delete Account Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleDelete}
          className="text-red-600 hover:underline text-sm"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}
