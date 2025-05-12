'use client';

import { useDispatch, useSelector } from 'react-redux';
import { addAdvert, clearAdvert } from '@/store/slices/adverts/advertSlice.v2';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdvertForm from '@/components/advertsv2/AdvertForm';

const AddAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { status, success, message, errors } = useSelector(state => state.advertsV2);

  // Clear state on mount and unmount
  useEffect(() => {
    dispatch(clearAdvert());
    return () => dispatch(clearAdvert());
  }, [dispatch]);

  const handleSubmit = (data) => {
    dispatch(clearAdvert());
    const formData = new FormData();
const jsonKeys = ['fields', 'pricing', 'address'];

Object.entries(data).forEach(([key, value]) => {
  if (jsonKeys.includes(key)) {
    formData.append(key, JSON.stringify(value));
  } else if (key === 'images') {
    value.forEach((file) => {
      if (file instanceof File) {
        formData.append('images', file);
      }
    });
  } else {
    formData.append(key, value);
  }
});

  
    dispatch(addAdvert(formData));
  };

  useEffect(() => {
    if (success && status === 'succeeded') {
      setTimeout(() => {
        router.push('/users/profile/manageads');
        dispatch(clearAdvert());
      }, 1000);
    }
  }, [success, status, router, dispatch]);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Advert</h1>
      
      {status === 'loading' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700">Creating your advert...</p>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="font-bold text-red-700 mb-2">Validation Errors:</p>
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index} className="text-red-600">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {message && success === false && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{message}</p>
        </div>
      )}
      
      <AdvertForm 
        onSubmit={handleSubmit} 
        isLoading={status === 'loading'} 
        errors={errors} 
      />
    </div>
  );
};

export default AddAdvertPage;