'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccountDetails, updateAccountDetails } from '@/store/slices/userSlice';
import { toast } from 'react-toastify';

export default function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    suburb: '',
    state: '',
    postcode: '',
    marketingOptIn: false,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAccountDetails()).then((res) => {
      if (res.payload) {
        setFormData(res.payload);
      }
    });
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center">Account Settings</h1>

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

        {/* Email (read-only) */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full p-2 border border-gray-200 bg-gray-100 rounded cursor-not-allowed"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Suburb */}
        <div>
          <label className="block font-medium mb-1">Suburb</label>
          <input
            type="text"
            name="suburb"
            value={formData.suburb}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* State */}
        <div>
          <label className="block font-medium mb-1">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Postcode */}
        <div>
          <label className="block font-medium mb-1">Postcode</label>
          <input
            type="text"
            name="postcode"
            value={formData.postcode}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
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
            I agree to receive updates and offers
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Details'}
        </button>
      </form>
    </div>
  );
}
