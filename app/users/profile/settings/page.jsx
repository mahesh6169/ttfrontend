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
import DeleteAccountModal from '@/components/DeleteAccountModal';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';

const libraries = ['places'];

export default function Settings() {
  const dispatch = useDispatch();
  const router = useRouter();
  const userId = useSelector((state) => state.user.user?._id);
  const [autocomplete, setAutocomplete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(true);
    try {
      console.log('🔸 Deleting account for userId:', userId);
      await dispatch(deleteUserAccount(userId)).unwrap();
      
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      toast.success('Account deleted successfully');
      
      // Force a hard refresh to home page to clear all state
      window.location.href = '/';
    } catch (err) {
      toast.error(err || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <ProfilePageHeading title="Account Settings" />

      <div className="bg-white rounded shadow p-4">
      <form onSubmit={handleUpdate} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-slate-300 rounded"
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
            className="w-full p-2 border bg-slate-100 border-slate-200 rounded cursor-not-allowed"
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
            className="w-full p-2 border border-slate-300 rounded"
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
                className="w-full p-2 border border-slate-300 rounded"
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
          <label htmlFor="marketingOptIn" className="text-sm text-slate-700">
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
          onClick={() => setShowDeleteModal(true)}
          className="text-red-600 hover:underline text-sm"
        >
          Delete My Account
        </button>
      </div>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
