'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SingleAdvertCard from '@/components/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdvertById } from '@/store/slices/advertSlice';

const AdvertDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { selectedAdvert, status, error } = useSelector((state) => state.advert);
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchAdvertById(id));
  }, [dispatch, id]);


  if (status === 'loading') {
    return <div className="text-center mt-8">Loading advert details...</div>;
  }

  if (status === 'failed') {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!selectedAdvert) {
    return <div className="text-center text-gray-500">No advert found.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cancel Button */}
      <div className="text-left">
        <button
          type="button"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-400"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
  
      {/* Advert Details and Chat Container */}
      <div className="flex flex-col lg:flex-row gap-2">
        {/* Advert Details */}
        <div className="flex-[7] border-r bg-white">
          <SingleAdvertCard advert={selectedAdvert} />
        </div>
  

{/* Chat Container */}
<div className="flex-[3] bg-white shadow rounded-none p-4">
  <SendMessage
    advertId={id}
    participantId={selectedAdvert.postedBy?._id}
    owner={selectedAdvert.postedBy?.name}
    preserveRedirectUrl={`/adverts/views/${id}`}
  />
</div>


      </div>
    </div>
  );
  
};

export default AdvertDetail;
