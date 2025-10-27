// app/adverts2/add/page.jsx
'use client';

import { useDispatch, useSelector } from 'react-redux';
import { addAdvert, clearAdvert } from '@/store/slices/adverts/advertSlice';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdvertForm from '@/components/adverts/AdvertForm';
import RequireVerifiedAccount from '@/components/Auth/RequireVerifiedAccount';
import SuccessModal from '@/components/adverts/SuccessModal';

const AddAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Update to use createStatus instead of status
  const { createStatus, success, message, errors, advert } = useSelector(state => state.advert);
  const { user } = useSelector(state => state.user); // Get user for role

  // Clear state on mount and unmount
  useEffect(() => {
    dispatch(clearAdvert());
    return () => dispatch(clearAdvert());
  }, [dispatch]);

  const handleSubmit = (data) => {
    console.log('=== DISPATCHING addAdvert ===');
    console.log("Raw form data received:", data);
    
    dispatch(clearAdvert());
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
      } else {
        console.log(`Adding other field ${key}:`, value);
        formData.append(key, value);
      }
    });
    
    console.log('About to dispatch with formData');
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File: ${value.name}` : value}`);
    }
    
    dispatch(addAdvert(formData));
    console.log('Dispatch called');
  };

  // Update to check createStatus instead of status
  useEffect(() => {
    if (success && createStatus === 'succeeded' && advert) {
      // Show success modal
      setShowSuccessModal(true);
    }
  }, [success, createStatus, advert]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 sm:py-8 lg:py-10">
      <RequireVerifiedAccount>
      
      {/* Show success view if listing was created successfully */}
      {showSuccessModal && advert ? (
        <SuccessModal
          mode="add"
          onAddAnother={() => {
            setShowSuccessModal(false);
            dispatch(clearAdvert());
            // Reset form by clearing success state
          }}
          onManageListings={() => {
            // Navigate first, then clear state after a small delay
            router.push('/users/profile/manageads');
            setTimeout(() => {
              dispatch(clearAdvert());
            }, 100);
          }}
        />
      ) : (
        <>
          {/* Update to check createStatus instead of status */}
          {createStatus === 'loading' && (
            <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm sm:text-base text-blue-700">Creating your Listing...</p>
            </div>
          )}

          {/* Show only API error messages, not validation errors */}
          {message && success === false && (!errors || errors.length === 0) && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm sm:text-base text-red-700">{message}</p>
            </div>
          )}
          
          {/* Update isLoading prop to use createStatus */}
          <AdvertForm 
            onSubmit={handleSubmit} 
            isLoading={createStatus === 'loading' || (success && createStatus === 'succeeded')} 
            errors={errors}
            userRole={user?.role || 'user'}
            isSuccess={success && createStatus === 'succeeded'}
          />
        </>
      )}
      </RequireVerifiedAccount>
    </div>
    
  );
};

export default AddAdvertPage;