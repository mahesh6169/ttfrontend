'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchuserProfile } from '@/store/slices/users/userSlice';
import { fetchMyAdverts, deleteUserAdvert, renewUserAdvert, toggleAdvertGoLive } from '@/store/slices/adverts/userAdvertsSlice';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'react-toastify';
import Link from 'next/link';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import { buildSlugUrl } from '@/utils/slugUtils';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_ADVERT_IMAGE_URL;

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

  const handleToggleGoLive = async (advert) => {
    try {
      const isLive = advert.status !== 'inactive';
      const result = await dispatch(
        toggleAdvertGoLive({ id: advert._id, goLive: !isLive })
      ).unwrap();
      toast.success(isLive ? 'Listing is now Offline' : 'Listing is now Live');
      dispatch(fetchMyAdverts());
    } catch (error) {
      toast.error(error || 'Failed to update listing visibility.');
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
  

  const PageHeader = () => (
    <>
      <ProfilePageHeading title="Manage Listings" description="Create, edit and manage your listings" />
      <div className="flex justify-center mb-6">
        <Link
          href="/listings/add"
          onClick={() =>
            localStorage.setItem('cancelRedirectUrl', '/users/profile/manageads')
          }
          className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-700 text-white hover:bg-teal-800 font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          + Post New Listing
        </Link>
      </div>
    </>
  );

  // Show loading spinner if adverts are still loading
  const showSkeleton = useDelayedLoading(advertStatus === 'loading');

  if (advertStatus === 'loading' || showSkeleton) {
    return (
      <div>
        <PageHeader />
        {showSkeleton && <PageSkeleton variant="card" rows={6} />}
      </div>
    );
  }

  // Handle errors
  if (advertStatus === 'failed') {
    return (
      <div>
        <PageHeader />
        <ErrorState onRetry={() => dispatch(fetchMyAdverts())} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader />

      {adverts && adverts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {adverts.map((advert) => {
            const expiryTime = new Date(advert.expiresAt).getTime();
            const daysLeft = Math.floor((expiryTime - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const canRenew = daysLeft <= 14;
            const isLive = advert.status !== 'inactive';

            return (
              <div
                key={advert._id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
                <div
                  className="w-full h-32 sm:h-40 rounded-t-xl overflow-hidden cursor-pointer"
                  onClick={() => router.push(buildSlugUrl('listing', advert.title, advert._id))}
                >
                  <img
                    src={advert.images?.[0]?.url || FALLBACK_IMAGE}
                    alt={advert.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-2 pt-1.5">
                  <h3
                    className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-teal-700"
                    onClick={() => router.push(buildSlugUrl('listing', advert.title, advert._id))}
                  >
                    {advert.title}
                  </h3>

                  {/* Status line: Offline overrides, else expiry countdown */}
                  <p className={`text-xs mt-0.5 ${
                    !isLive
                      ? 'text-slate-500'
                      : isExpired
                      ? 'text-red-600 font-medium'
                      : daysLeft <= 7
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }`}>
                    {!isLive ? 'Offline' : isExpired ? 'Expired' : `${daysLeft}d left`}
                  </p>

                  {/* Actions - larger touch targets */}
                  <div className="flex items-center justify-between sm:justify-center sm:gap-6 mt-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleEdit(advert)}
                      className="text-teal-700 hover:text-teal-900 active:underline font-semibold py-1"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => canRenew && handleRenew(advert._id)}
                      disabled={!canRenew}
                      className={`font-semibold py-1 active:underline ${
                        canRenew
                          ? 'text-teal-700 hover:text-teal-900'
                          : 'text-slate-400'
                      }`}
                      title={!canRenew ? 'Available within 14 days of expiry' : 'Renew for 90 days'}
                    >
                      Renew
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(advert._id)}
                      className="text-red-600 hover:text-red-700 active:underline font-semibold py-1"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Live/Offline toggle on its own row */}
                  <div className="flex justify-center mt-1 text-sm">
                    <button
                      type="button"
                      onClick={() => handleToggleGoLive(advert)}
                      className="text-teal-700 hover:text-teal-900 active:underline font-semibold py-1"
                    >
                      {isLive ? 'Go Offline' : 'Go Live'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No listings yet"
          description="You haven't posted any listings yet."
        />
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
