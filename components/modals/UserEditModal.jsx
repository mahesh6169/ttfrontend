'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateUser } from '@/store/slices/admin/users/adminSlice';
import { toast } from 'react-toastify';
import { LoadScriptNext, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];

const UserEditModal = ({ isOpen, onClose, user }) => {
  const dispatch = useDispatch();

  const initialFormState = {
    name: '',
    email: '',
    role: 'user',
    isAccountVerified: false,
    password: '',
    mobile: '',
    marketingOptIn: false,
    suburb: {
      name: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [] },
    },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [autocomplete, setAutocomplete] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        isAccountVerified: user.isAccountVerified || false,
        password: '',
        mobile: user.mobile || '',
        marketingOptIn: user.marketingOptIn || false,
        suburb: user.suburb || initialFormState.suburb,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const components = place.address_components || [];

    let suburb = '',
      state = '',
      postalCode = '',
      coordinates = [];

    components.forEach((component) => {
      const types = component.types;
      if (types.includes('locality')) suburb = component.long_name;
      if (types.includes('administrative_area_level_1'))
        state = component.short_name;
      if (types.includes('postal_code')) postalCode = component.long_name;
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, state, postalCode, location } = formData.suburb;

    if (!name || !state || !postalCode || location.coordinates.length !== 2) {
      toast.error('Please select a valid suburb from suggestions');
      return;
    }

    if (formData.mobile && !/^04\d{8}$/.test(formData.mobile)) {
      toast.error('Mobile must start with 04 and be 10 digits long');
      return;
    }

    const payload = { ...formData };
    if (!formData.password) delete payload.password;

    try {
      await dispatch(
        updateUser({ userId: user._id, userData: payload })
      ).unwrap();
      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to update user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full p-2 border rounded"
            required
          />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <input
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile (04xxxxxxxx)"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="New Password (optional)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

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
                placeholder="Enter suburb"
                className="w-full p-2 border rounded"
              />
            </Autocomplete>
          </LoadScriptNext>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isAccountVerified"
              checked={formData.isAccountVerified}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  isAccountVerified: !prev.isAccountVerified,
                }))
              }
            />
            <label>Account Verified</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="marketingOptIn"
              checked={formData.marketingOptIn}
              onChange={handleChange}
            />
            <label className="text-sm text-gray-600">
              Opt-in for offers & updates
            </label>
          </div>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
