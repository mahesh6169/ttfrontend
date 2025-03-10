import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/slices/adminSlice';
import { toast } from 'react-toastify';

const UserEditModal = ({ isOpen, onClose, user }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isAccountVerified: false,
    password: '', // Optional password field
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        isAccountVerified: user.isAccountVerified || false,
        password: '', // Keep empty by default
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedData = { ...formData };

    // Ensure password is only included if it's entered
    if (!formData.password) {
      delete updatedData.password;
    }

    try {
      await dispatch(updateUser({ userId: user._id, userData: updatedData })).unwrap();
      toast.success('User updated successfully');
      onClose();
    } catch (error) {
      toast.error(error || 'Failed to update user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              name="isAccountVerified"
              checked={formData.isAccountVerified}
              onChange={() => setFormData({ ...formData, isAccountVerified: !formData.isAccountVerified })}
            />
            <label>Account Verified</label>
          </div>
          <input
            type="password"
            name="password"
            placeholder="New Password (optional)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
          />
          <div className="flex justify-between mt-4">
            <button type="button" className="bg-gray-500 text-white p-2 rounded" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;