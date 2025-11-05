// app/adverts2/edit/[id]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { getAdvertById, updateAdvert, clearAdvert, clearErrorsAndStatus } from '@/store/slices/adverts/advertSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdvertForm from '@/components/adverts/AdvertForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import SuccessModal from '@/components/adverts/SuccessModal';

const EditAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const { advert, fetchStatus, updateStatus, success, message, errors } = useSelector(state => state.advert);
  const { user } = useSelector(state => state.user);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState(null); // Store the submitted form data
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch advert on load
  useEffect(() => {
    if (id) {
      dispatch(getAdvertById(id));
    }

    return () => dispatch(clearAdvert());
  }, [id, dispatch]);

  // Prepare and submit FormData
  const handleSubmit = (data) => {
    console.log('=== UPDATING ADVERT ===');
    console.log("Raw form data received:", data);
    
    dispatch(clearErrorsAndStatus());
    const formData = new FormData();
    
    // Explicitly set critical fields first
    console.log("Adding title:", data.title);
    formData.append('title', data.title || '');
    
    console.log("Adding description:", data.description);
    formData.append('description', data.description || '');
    
    console.log("Adding category:", data.category);
    formData.append('category', data.category || '');
    
    console.log("Adding adType:", data.adType);
    formData.append('adType', data.adType || 'offered');
    
    // Handle nested objects only if not already added
    const jsonKeys = ['fields', 'pricing', 'address', 'communities'];
    Object.entries(data).forEach(([key, value]) => {
      // Skip the keys we've already handled directly
      if (key === 'title' || key === 'description' || key === 'category' || key === 'adType') {
        console.log(`Skipping ${key} as it was already added directly`);
        return;
      }
    
      if (jsonKeys.includes(key)) {
        console.log(`Adding ${key} as JSON:`, value);
        formData.append(key, JSON.stringify(value));
      } else if (key === 'images') {
        console.log(`Processing ${value.length} images`);
        value.forEach((file, index) => {
          if (file instanceof File) {
            console.log(`Adding image ${index}:`, file.name);
            formData.append('images', file);
          }
        });
      } else if (key === 'existingImages') {
        // *** FIX STARTS HERE ***
        // Always send existingImages, even if empty
        if (Array.isArray(value)) {
          if (value.length === 0) {
            // Send an explicit empty array as a string
            formData.append('existingImages', JSON.stringify([]));
            console.log('No existing images left, sending empty array');
          } else {
            value.forEach((img, index) => {
              const imgData = typeof img === 'string' ? img : JSON.stringify(img);
              formData.append('existingImages', imgData);
            });
          }
        }
        // *** FIX ENDS HERE ***
      } else {
        console.log(`Adding other field ${key}:`, value);
        formData.append(key, value);
      }
    });
    
    
    console.log('About to dispatch updateAdvert with formData');
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : (typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value)}`);
    }
    
    // Store the submitted data to show optimistic UI updates
    setFormData(data);
    setHasSubmitted(true);
    
    dispatch(updateAdvert({ id, formData }));
  };

  // Handle redirect on success
  useEffect(() => {
    if (hasSubmitted && success && updateStatus === 'succeeded') {
      // Revalidate metadata cache
      const revalidateMetadata = async () => {
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tag: `listing-${id}`,
              secret: process.env.NEXT_PUBLIC_REVALIDATION_SECRET
            })
          });
        } catch (error) {
          console.error('Failed to revalidate metadata:', error);
        }
      };
      
      revalidateMetadata();
      
      // Show success modal
      setShowSuccessModal(true);
    }
  }, [hasSubmitted, success, updateStatus, id]);

  // Simply use the advert data - no complex merging needed
  const displayData = advert;

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-8 lg:py-10">
      <RequireVerifiedAccount>

      {/* Show success view if listing was updated successfully */}
      {showSuccessModal && displayData ? (
        <SuccessModal
          mode="edit"
          onViewListing={() => {
            router.push(`/listings/views/${displayData._id || id}`);
            dispatch(clearAdvert());
          }}
          onManageListings={() => {
            router.push('/users/profile/manageads');
            dispatch(clearAdvert());
          }}
        />
      ) : (
        <>
          {fetchStatus === 'loading' && (
            <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm sm:text-base text-blue-700">Loading Listing...</p>
            </div>
          )}

          {updateStatus === 'loading' && (
            <LoadingSpinner message="Updating Listing..." />
          )}

          {/* Show only API error messages, not validation errors */}
          {message && success === false && (!errors || errors.length === 0) && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm sm:text-base text-red-700">{message}</p>
            </div>
          )}
          
          {/* If advert fetch failed but status is success */}
          {fetchStatus === 'succeeded' && !displayData && (
            <div className="text-sm sm:text-base text-red-600 mb-4 p-3">
              Listing not found or you're not authorized to edit it.
            </div>
          )}

          {/* Render form if advert is fetched */}
          {displayData && (
            <AdvertForm
              initialData={{
                ...displayData,
                existingImages: displayData.images || []
              }}
              onSubmit={handleSubmit}
              isLoading={fetchStatus === 'loading' || updateStatus === 'loading' || (success && updateStatus === 'succeeded')}
              errors={errors}
              userRole={user?.role || 'user'}
              isSuccess={success && updateStatus === 'succeeded'}
            />
          )}
        </>
      )}
      </RequireVerifiedAccount>
    </div>
  );
};

export default EditAdvertPage;