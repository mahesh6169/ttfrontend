'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/users/userSlice';
import { deleteUserAdvert } from '@/store/slices/adverts/userAdvertsSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();

  // Extract required state fields
  const {
    adverts,
    status: userStatus,
    error: userError,
  } = useSelector((state) => state.user);
  const { status: advertStatus, error: advertError } = useSelector(
    (state) => state.userAdverts
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertToDelete, setAdvertToDelete] = useState(null);

  // Fetch user profile on mount
  useEffect(() => {
    dispatch(fetchuserProfile())
      .unwrap()
      .catch((err) => {
        if (err === 'Authentication required. Please log in.') {
          // Save current page path to localStorage
          localStorage.setItem(
            'redirectAfterLogin',
            '/admin/profile/adverts/manage'
          );
          router.push('/users/login');
        }
      });
  }, [dispatch, router]);

  // 🚀 Preload the edit page when the component loads
  useEffect(() => {
    adverts.forEach((advert) => {
      router.prefetch(`/admin/profile/adverts/edit/${advert._id}`);
    });
  }, [adverts, router]);

  const handleEdit = (advert) => {
    router.push(`/admin/profile/adverts/edit/${advert._id}`);
  };

  const confirmDelete = (id) => {
    setAdvertToDelete(id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!advertToDelete) return;

    try {
      const result = await dispatch(deleteUserAdvert(advertToDelete));

      if (deleteUserAdvert.fulfilled.match(result)) {
        toast.success('Advert deleted successfully.', { autoClose: 3000 });
        dispatch(fetchuserProfile()); // Refresh profile
      } else {
        toast.error(result.payload || 'Failed to delete advert.');
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsModalOpen(false);
      router.push('/admin/profile/adverts/manage');
    }
  };

  // Show loading spinner if user profile or adverts are still loading
  if (userStatus === 'loading' || advertStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle errors
  if (userStatus === 'failed' || advertStatus === 'failed') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{userError || advertError}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Manage Ads
      </h1>
      <Link
        href="/admin/profile/adverts/add"
        onClick={() =>
          localStorage.setItem('cancelRedirectUrl', '/admin/profile/adverts/manage')
        }
        className="block my-2 p-2 bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Advertisement
      </Link>

      {adverts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {adverts.map((advert) => (
            <div
              key={advert._id}
              className="p-4 border border-slate-300 rounded shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-bold">{advert.title}</h3>
              {advert.images?.length > 0 && (
                <div className="mt-2">
                  <img
                    src={advert.images[0].url}
                    alt={advert.title}
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => handleEdit(advert)}
                  className="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(advert._id)}
                  className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-700 pt-25">You have no adverts posted.</p>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={isModalOpen}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        title="Confirm Deletion"
        message="Are you sure you want to delete this advert?"
      />
    </div>
  );
}
