'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser } from '@/store/slices/adminSlice';
import Link from 'next/link';
import CreateUserModal from '@/components/modals/CreateUserModal';
import UserEditModal from '@/components/modals/UserEditModal';
import { toast } from 'react-toastify';

export default function UsersPage() {
  const dispatch = useDispatch();
  const { users, status, error } = useSelector((state) => state.admin);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Fetch users when the page loads
  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers(1));
    }
  }, [dispatch, users.length]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteUser(userId)).unwrap();
      toast.success('User deleted successfully');
      dispatch(fetchUsers(1)); // Refresh user list
    } catch (error) {
      toast.error(error || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Add New User
        </button>
      </div>

      {status === 'loading' && <p className="text-center">Loading users...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id} className="border">
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2 flex gap-2">
                  <button 
                    onClick={() => handleEditClick(user)}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(user._id)}
                    className="text-red-500 hover:underline" 
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Create User Modal */}
      <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Edit User Modal */}
      <UserEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={selectedUser} 
      />
    </div>
  );
}