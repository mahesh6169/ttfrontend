'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/users/userSlice';
import { fetchMyAdverts, deleteUserAdvert, renewUserAdvert } from '@/store/slices/adverts/userAdvertsSlice';
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
    status: advertStatus, 
    error: advertError 
  } = useSelector((state) => state.userAdverts);

  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advertToDelete, setAdvertToDelete] = useState(null);

  
  useEffect(() => {
    dispatch(fetchMyAdverts());
  }, [dispatch]);

  // 🚀 Preload the edit page when the component loads
  useEffect(() => {
    if (adverts && adverts.length > 0) {
      adverts.forEach((advert) => {
        router.prefetch(`/listings/edit/${advert._id}`);
      });
    }
  }, [adverts, router]);

  const handleEdit = (advert) => {
    // Save where we came from for Cancel button
    localStorage.setItem('cancelRedirectUrl', '/users/profile/manageads');
    router.push(`/listings/edit/${advert._id}`);
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
      router.push('/users/profile/manageads');
    }
  };

  const handleRenew = async (advertId) => {
    try {
      const result = await dispatch(renewUserAdvert(advertId)).unwrap();
      toast.success('Advert renewed successfully.');
      dispatch(fetchuserProfile()); // Refresh list
    } catch (error) {
      toast.error(error || 'Failed to renew advert.');
    }
  };
  

    // Show loading spinner if adverts are still loading
    if (advertStatus === 'loading') {
      return (
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      );
    }
  
    // Handle errors
    if (advertStatus === 'failed') {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p>{advertError}</p>
        </div>
      );
    }

  return (
    <div className='m-2' >
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">
        Manage Ads
      </h1>
      <Link
        href="/listings/add"
        onClick={() =>
          localStorage.setItem('cancelRedirectUrl', '/users/profile/manageads')
        }
        className="block my-2 p-2 bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Listing
      </Link>

      {adverts && adverts.length > 0 ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {adverts.map((advert) => {
  const expiryTime = new Date(advert.expiresAt).getTime();
  const daysLeft = Math.floor((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;
  const canRenew = daysLeft <= 14 && daysLeft >= -7; // Allow renewal 14 days before to 7 days after expiry

  return (
    <div
      key={advert._id}
      className="p-4 border border-gray-300 rounded shadow hover:shadow-lg transition"

    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-bold truncate max-w-[60%]">{advert.title}</h3>
        <span
          className={`text-xs font-semibold whitespace-nowrap ${
            isExpired ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          {isExpired ? 'Expired' : `Expires in: ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
        </span>
      </div>

      {advert.images?.length > 0 && (
        <div className="mt-2">
          <img
            src={advert.images[0].url}
            alt={advert.title}
            className="w-full h-48 object-cover rounded"
          />
        </div>
      )}

      <div className="flex justify-between items-center mt-4 gap-2">
        <button
          onClick={() => handleEdit(advert)}
          disabled={isExpired}
          className={`flex-1 py-1 px-4 rounded transition ${
            isExpired
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100'
          }`}
        >
          Edit
        </button>

        <button
          onClick={() => canRenew && handleRenew(advert._id)}
          disabled={!canRenew}
          className={`flex-1 py-1 px-4 rounded transition ${
            canRenew
              ? daysLeft <= 7 
                ? 'bg-orange-600 text-white hover:bg-orange-700' // Urgent color for last 7 days
                : 'bg-green-600 text-white hover:bg-green-700'   // Normal color for 14-8 days
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
          title={!canRenew ? 'Renewal available within 14 days of expiry' : 'Renew for another 90 days'}
        >
          {canRenew && daysLeft <= 0 ? 'Renew !!' : 'Renew'}
        </button>

        <button
          onClick={() => confirmDelete(advert._id)}
          className="flex-1 bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
})}

  </div>
) : (
  <p className="text-gray-700 pt-25">You have no adverts posted.</p>
)}



      {/* Reusable Confirm Modal */}
      <ConfirmModal
  isOpen={isModalOpen}
  onConfirm={handleDelete}
  onCancel={() => setIsModalOpen(false)}
  title={<span className="text-xs text-gray-800 font-bold">Confirm Deletion</span>}
  message={<span className="text-xs text-gray-800">Are you sure you want to delete this advert?</span>}
/>

    </div>
  );
}
