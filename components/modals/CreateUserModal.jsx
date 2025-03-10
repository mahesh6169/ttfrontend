import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createUser } from '@/store/slices/adminSlice';
import { toast } from 'react-toastify';

const CreateUserModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  // Initial state for form
  const initialFormState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Reset form when the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState); // Reset the form when modal opens
    }
  }, [isOpen]);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await dispatch(createUser(formData)).unwrap();
      toast.success('User created successfully');
      setFormData(initialFormState); // Reset form after success
      onClose(); // Close modal
    } catch (error) {
      toast.error(error || 'Failed to create user');
    }
  };

  if (!isOpen) return null; // Don't render modal if it's not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Create New User</h2>
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
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
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
          <div className="flex justify-between mt-4">
            <button type="button" className="bg-gray-500 text-white p-2 rounded" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
