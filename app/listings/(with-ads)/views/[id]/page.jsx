'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SingleAdvertCard from '@/components/adverts/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import { useSelector, useDispatch } from 'react-redux';
import { getAdvertById } from '@/store/slices/adverts/advertSlice';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import LoadingSpinner from '@/components/LoadingSpinner';

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

  if ((status === 'idle' || status === 'loading') && !advert) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="text-center text-red-500 mt-8">
        <p>{error}</p>
        <button 
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (status === 'succeeded' && !advert) {
    return (
      <div className="text-center text-slate-500 mt-8">
        <p>Listing not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Curated listing — posted by a Desify curator on behalf of the owner
  const isCuratedListing = advert.isCuratedListing || false;

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center">
        {/* Back to Listings */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-3 py-1 md:px-4 md:py-2 rounded-full font-semibold text-xs md:text-base transition-colors"
        >
          <span>&lt;</span>
          <span>back</span>
        </button>

        {/* Report this Listing */}
        <ReportLink
          type="listing"
          id={id}
          title={advert.title}
          returnUrl={`/listings/views/${id}`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
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
              isCurated: isCuratedListing,
              listingTitle: advert.title,
            }}
          />
        </div>

        {/* Secondary Content - Desktop Only (Sticky Sidebar) */}
        <div className="hidden lg:block flex-[3] sticky top-20 self-start space-y-4">
          <SendMessage
            resourceId={id}
            resourceType="advert"
            participantId={advert.postedBy?._id}
            owner={advert.postedBy?.name}
            preserveRedirectUrl={`/listings/views/${id}`}
            isCurated={isCuratedListing}
            listingTitle={advert.title}
          />

          {/* Share Icons - Sticky with sidebar */}
          <div className="flex items-center justify-center py-3 px-4 border border-slate-200 rounded shadow-sm">
            <span className="text-sm font-bold text-sky-500 mr-3">Share</span>
            <ShareIcons
              type="listing"
              title={advert.title}
              id={advert._id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertDetail;
