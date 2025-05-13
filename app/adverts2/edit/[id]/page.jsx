'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { getAdvertById, updateAdvert, clearAdvert } from '@/store/slices/adverts/advertSlice.v2';
import AdvertForm from '@/components/advertsv2/AdvertForm';
import { toast } from 'react-toastify';

const EditAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const { advert, status, success, message, errors } = useSelector(state => state.advertsV2);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ✅ Fetch advert on load
  useEffect(() => {
    if (id) {
      dispatch(getAdvertById(id));
    }

    return () => dispatch(clearAdvert());
  }, [id, dispatch]);

  // ✅ Prepare and submit FormData
  const handleSubmit = (data) => {
    const formData = new FormData();
    const jsonKeys = ['fields', 'pricing', 'address'];

    Object.entries(data).forEach(([key, value]) => {
      if (jsonKeys.includes(key)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'images') {
        value.forEach(file => {
          if (file instanceof File) {
            formData.append('images', file);
          }
        });
      } else if (key !== 'existingImages') {
        formData.append(key, value);
      }
    });

    // ✅ Fixed: Ensure existing images are properly stringified
    if (Array.isArray(data.existingImages)) {
      data.existingImages.forEach(img => {
        // Always stringify the image object, even if it's already a string
        const imgData = typeof img === 'string' ? img : JSON.stringify(img);
        formData.append('existingImages', imgData);
      });
    } else if (data.existingImages) {
      // Handle case where existingImages might not be an array
      console.warn('⚠️ existingImages is not an array:', data.existingImages);
      formData.append('existingImages', JSON.stringify(data.existingImages));
    }

    // Debug logging to verify what's being sent
    console.log('📤 Submitting update with existing images:', data.existingImages);
    
    dispatch(updateAdvert({ id, formData }));
    setHasSubmitted(true);
  };

  // ✅ Handle redirect on success
  useEffect(() => {
    if (hasSubmitted && success && status === 'succeeded' && advert?._id) {
      toast.success("Advert updated successfully!");
      setTimeout(() => {
        router.push('/users/profile/manageads');
        dispatch(clearAdvert());
      }, 1000);
    }
  }, [hasSubmitted, success, status, router, dispatch, advert]);

  // ✅ Log backend errors
  useEffect(() => {
    if (message && success === false) {
      console.error("❌ Advert update failed:", message);
      if (errors && errors.length > 0) {
        console.error("❌ Validation errors:", errors);
      }
    }
  }, [message, success, errors]);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Advert</h1>

      {status === 'loading' && (
        <p className="text-blue-700 mb-4">Loading advert...</p>
      )}

      {message && success === false && (
        <div className="mb-4 text-red-600 bg-red-50 p-4 rounded border border-red-200">
          <p className="font-semibold">Error:</p>
          <p>{message}</p>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="mb-4 text-red-600 bg-red-50 p-4 rounded border border-red-200">
          <p className="font-semibold">Validation Errors:</p>
          <ul className="list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* ✅ If advert fetch failed but status is success */}
      {status === 'succeeded' && !advert && (
        <div className="text-red-600 mb-4">
          Advert not found or you're not authorized to edit it.
        </div>
      )}

      {/* ✅ Render form if advert is fetched */}
      {advert && (
        <AdvertForm
          initialData={{
            ...advert,
            existingImages: advert.images || []
          }}
          onSubmit={handleSubmit}
          isLoading={status === 'loading'}
          errors={errors}
        />
      )}
    </div>
  );
};

export default EditAdvertPage;