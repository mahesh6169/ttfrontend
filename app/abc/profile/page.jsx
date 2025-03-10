'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/userSlice';
import { deleteUserAdvert, editAdvertById, updateAdvertById } from '@/store/slices/userAdvertsSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('settings'); // Default tab
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertToDelete, setAdvertToDelete] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [formData, setFormData] = useState(null);

  const { user, adverts, status: userStatus } = useSelector((state) => state.user);
  const { status: advertStatus, error: advertError, currentAdvert } = useSelector((state) => state.userAdverts);

  // Fetch user profile on mount
  useEffect(() => {
    dispatch(fetchuserProfile());
  }, [dispatch]);

  // Handle edit click - fetch advert details
  const handleEdit = (advert) => {
    setEditMode(advert._id);
    dispatch(editAdvertById(advert._id));
  };

  // Prefill form with advert data when fetched
  useEffect(() => {
    if (currentAdvert) {
      setFormData({ ...currentAdvert });
    }
  }, [currentAdvert]);

  // Cancel edit
  const handleCancelEdit = () => {
    setEditMode(null);
    setFormData(null);
  };

  // Handle input changes in the edit form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit updated advert data
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(updateAdvertById({ id: editMode, data: formData }));
      if (updateAdvertById.fulfilled.match(result)) {
        toast.success('Advert updated successfully.');
        setEditMode(null);
        dispatch(fetchuserProfile()); // Refresh profile
      } else {
        toast.error(result.payload || 'Failed to update advert.');
      }
    } catch (error) {
      console.error('Error updating advert:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  // Confirm deletion modal
  const confirmDelete = (id) => {
    setAdvertToDelete(id);
    setIsModalOpen(true);
  };

  // Handle advert deletion
  const handleDelete = async () => {
    if (!advertToDelete) return;
    try {
      const result = await dispatch(deleteUserAdvert(advertToDelete));
      if (deleteUserAdvert.fulfilled.match(result)) {
        toast.success('Advert deleted successfully.', { autoClose: 3000 });
        dispatch(fetchuserProfile()); // Refresh list
      } else {
        toast.error(result.payload || 'Failed to delete advert.');
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsModalOpen(false);
    }
  };

  // Show loading spinner while fetching data
  if (userStatus === 'loading' || advertStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        {['settings', 'manageads', 'favourites', 'messages', 'postadvert'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Settings Section */}
      {activeTab === 'settings' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">User Settings</h2>
          <p><strong>Name:</strong> {user?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </div>
      )}

      {/* Manage Ads Section */}
      {activeTab === 'manageads' && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Manage Ads</h2>
          {adverts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {adverts.map((advert) => (
                <div key={advert._id} className="p-4 border border-gray-300 rounded shadow">
                  {editMode === advert._id ? (
                    // Inline Edit Form
                    <form onSubmit={handleUpdate} className="space-y-2">
                      <input
                        type="text"
                        name="title"
                        value={formData?.title || ''}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        placeholder="Title"
                      />
                      <textarea
                        name="description"
                        value={formData?.description || ''}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        placeholder="Description"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="bg-green-500 text-white px-4 py-1 rounded">Save</button>
                        <button type="button" className="bg-gray-500 text-white px-4 py-1 rounded" onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    // Regular Display Mode
                    <>
                      <h3 className="text-lg font-bold">{advert.title}</h3>
                      {advert.images?.length > 0 && (
                        <img src={advert.images[0].url} alt={advert.title} className="w-full h-40 object-cover mt-2" />
                      )}
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => handleEdit(advert)}
                          className="bg-blue-500 text-white px-4 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(advert._id)}
                          className="bg-red-500 text-white px-4 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>You have no adverts posted.</p>
          )}
        </div>
      )}

      {/* Confirm Modal for Deletion */}
      <ConfirmModal
        isOpen={isModalOpen}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this advert?"
      />
    </div>
  );
};

export default UserDashboard;
