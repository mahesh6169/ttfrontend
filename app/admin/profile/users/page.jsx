'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CreateUserModal from '@/components/modals/CreateUserModal';
import UserEditModal from '@/components/modals/UserEditModal';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

export default function UsersPage() {
  // State management - replaces Redux store
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ 
    totalPages: 1, 
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState({});
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch users - replaces fetchUsers Redux action
  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/admin/users?page=${pageNum}&limit=10`,
        { withCredentials: true }
      );
      
      if (data.success) {
        setUsers(data.users || []);
        setMeta(data.meta || { 
          totalPages: 1, 
          totalItems: 0,
          currentPage: pageNum,
          itemsPerPage: 10
        });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // Delete user - replaces deleteUser Redux action
  const handleDeleteClick = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setIsDeleting(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await axios.delete(
        `${BASE_URL}/admin/users/${userId}`,
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success('User deleted successfully');
        
        // If we deleted the last item on a page, go to previous page
        if (users.length === 1 && page > 1) {
          fetchUsers(page - 1);
        } else {
          fetchUsers(page);
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Callback when user is created or updated
  const handleUserChange = () => {
    fetchUsers(page); // Refresh current page
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

      {loading && <LoadingSpinner />}
      
      {!loading && users.length === 0 && (
        <p className="text-center text-gray-500">No users found.</p>
      )}

      {!loading && users.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {users.length} of {meta.totalItems} users
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2">Registered</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border">
                    <td className="border p-2">{user.name}</td>
                    <td className="border p-2">{user.email}</td>
                    <td className="border p-2">{user.role}</td>
                    <td className="border p-2">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
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
                        disabled={isDeleting[user._id]}
                      >
                        {isDeleting[user._id] ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={meta.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserChange}
      />

      {/* Edit User Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={handleUserChange}
      />
    </div>
  );
}