'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SingleAdvertCard from '@/components/adverts/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import { useSelector, useDispatch } from 'react-redux';
import { getAdvertById } from '@/store/slices/adverts/advertSlice';
import { RiArrowGoBackFill } from "react-icons/ri";
import { MdReport } from "react-icons/md";
import Link from 'next/link';
import ShareIcons from '@/components/shared/ShareIcons';

const AdvertDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { advert, fetchStatus: status, error } = useSelector(
    (state) => state.advert
  );
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(getAdvertById(id));
  }, [dispatch, id]);

  if (status === 'idle' || status === 'loading') {
    return <div className="text-center mt-8">Loading advert details...</div>;
  }

  if (status === 'failed') {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!advert) {
    return <div className="text-center text-gray-500">No advert found.</div>;
  }

  return (
    <div id="viewsmain" className="flex flex-col gap-2 px-2">
      {/* Navigation Bar */}
      <div className="mt-4 flex justify-between items-center">
        {/* Back to Listings */}
        <button
          onClick={() => router.push('/listings')}
          className="flex items-center gap-2 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
        >
          <RiArrowGoBackFill className="text-xs sm:text-base" />
          <span>Back to Listings</span>
        </button>

        {/* Report this Advert */}
        <Link
          href={`/support/report?type=advert&id=${id}&title=${encodeURIComponent(advert.title)}`}
          onClick={() => {
            localStorage.setItem('reportReturnUrl', `/listings/views/${id}`);
          }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <MdReport className="text-lg" />
          <span className="hidden sm:inline">Report this advert</span>
          <span className="sm:hidden">Report</span>
        </Link>
      </div>

      {/* Share Icons Row */}
      <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600 mr-3">Share this listing:</span>
        <ShareIcons 
          type="listing"
          title={advert.title}
          id={advert._id}
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Primary Content */}
        <div className="flex-[7] bg-white w-full">
          <SingleAdvertCard
            advert={advert}
            chatProps={{
              resourceId: id,
              resourceType: 'advert',
              participantId: advert.postedBy?._id,
              owner: advert.postedBy?.name,
              preserveRedirectUrl: `/listings/views/${id}`,
            }}
          />
        </div>

        {/* Secondary Content - Desktop Only */}
        <div className="hidden lg:block flex-[3] bg-white border rounded shadow-md p-2 self-start">
          <SendMessage
            resourceId={id}
            resourceType="advert"
            participantId={advert.postedBy?._id}
            owner={advert.postedBy?.name}
            preserveRedirectUrl={`/listings/views/${id}`}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvertDetail;
