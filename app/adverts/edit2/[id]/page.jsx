'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { getAdvertById, updateAdvert, clearAdvert } from '@/store/slices/adverts/advertSlice.v2';
import AdvertForm from '@/components/advertsv2/AdvertForm';

const EditAdvertPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { id } = useParams();
  const { advert, status, success, message, errors } = useSelector(state => state.advertsV2);

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getAdvertById(id));
    }

    return () => dispatch(clearAdvert());
  }, [id, dispatch]);

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
      } else {
        formData.append(key, value);
      }
    });

    if (data.existingImages) {
      data.existingImages.forEach(img => {
        formData.append('existingImages', JSON.stringify(img));
      });
    }

    dispatch(updateAdvert({ id, formData }));
    setHasSubmitted(true);
  };

  useEffect(() => {
    if (hasSubmitted && success && status === 'succeeded') {
      setTimeout(() => {
        router.push('/users/profile/manageads');
        dispatch(clearAdvert());
      }, 1000);
    }
  }, [hasSubmitted, success, status, router, dispatch]);

 

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Advert</h1>

      {status === 'loading' && (
        <p className="text-blue-700 mb-4">Loading advert...</p>
      )}

      {message && success === false && (
        <div className="mb-4 text-red-600">{message}</div>
      )}

      {errors && errors.length > 0 && (
        <div className="mb-4 text-red-600">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

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
