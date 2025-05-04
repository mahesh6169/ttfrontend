'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SingleAdvertCard from '@/components/adverts/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdvertById } from '@/store/slices/adverts/advertSlice';
import { RiArrowGoBackFill } from "react-icons/ri";
import { MdReport } from "react-icons/md";
import Link from 'next/link';

const AdvertDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { selectedAdvert, status, error } = useSelector(
    (state) => state.advert
  );
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
    <div id="viewsmain" className="flex flex-col gap-2 px-2">
      {/* Row 1: Back & Report */}
      <div className=" mt-4 flex justify-between">
  {/* Back to Adverts */}
  <span
    onClick={() => router.back()}
    className="flex items-center gap-2 bg-yellow-400  text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-medium"
  >
    <RiArrowGoBackFill className="text-xs sm:text-base " />
    <span>Back to Adverts</span>
  </span>

  {/* Report this Advert */}
  <Link
    href={`/support/report?type=advert&id=${id}&title=${encodeURIComponent(selectedAdvert.title)}`}
    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
  >
    <MdReport className="text-lg" />
    <span>Report this advert</span>
  </Link>
</div>

      {/* Row 2: Advert + Chat */}
      <div className="flex flex-col lg:flex-row gap-4 ">
        {/* Advert Details */}
        <div className="flex-[7] bg-white w-full">
          <SingleAdvertCard
            advert={selectedAdvert}
            chatProps={{
              resourceId: id,
              resourceType: 'advert',
              participantId: selectedAdvert.postedBy?._id,
              owner: selectedAdvert.postedBy?.name,
              preserveRedirectUrl: `/adverts/views/${id}`,
            }}
          />
        </div>

        {/* Chat Container: desktop only */}
        <div className="hidden lg:block flex-[3] shadow p-2 self-start">
          <SendMessage
            resourceId={id}
            resourceType="advert"
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
