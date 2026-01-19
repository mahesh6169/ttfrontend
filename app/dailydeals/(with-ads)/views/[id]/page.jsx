'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { getDealById, clearDeal } from '@/store/slices/dailydeals/dealSlice';
import SingleDealCard from '@/components/dailydeals/dealcomponents/SingleDealCard';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { MdReport } from 'react-icons/md';

const DealDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { deal, fetchStatus, error } = useSelector((state) => state.deal);

  useEffect(() => {
    if (id) {
      dispatch(getDealById(id));
    }

    return () => {
      dispatch(clearDeal());
    };
  }, [dispatch, id]);

  if (fetchStatus === 'loading' || (fetchStatus === 'idle' && !deal)) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (fetchStatus === 'failed') {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Failed to load deal'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Deal not found</p>
        <Link
          href="/dailydeals"
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          Browse Deals
        </Link>
      </div>
    );
  }

  // Get the deal poster for messaging
  const partner = deal.partnerstoreId;
  const ownerId = deal.postedBy?._id || deal.postedBy;
  const ownerName = partner?.businessName || deal.postedBy?.name || 'Business';

  return (
    <div id="viewsmain" className="flex flex-col gap-2 px-2 min-h-screen pb-8">
      {/* Navigation Bar */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
        >
          <span>&lt;</span>
          <span>back</span>
        </button>

        <Link
          href={`/support/report?type=deal&id=${deal._id}&title=${encodeURIComponent(deal.dealTitle)}`}
          onClick={() => {
            localStorage.setItem('reportReturnUrl', `/dailydeals/views/${id}`);
          }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
        >
          <MdReport className="text-lg" />
          <span className="hidden sm:inline">Report this deal</span>
          <span className="sm:hidden">Report</span>
        </Link>
      </div>

      {/* Share Icons */}
      <div className="flex items-center justify-center py-3 px-4">
        <span className="text-sm sm:text-base font-bold text-sky-500 mr-3">Share</span>
        <ShareIcons
          type="deal"
          title={deal.dealTitle}
          id={deal._id}
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Primary Content */}
        <div className="flex-[7] bg-white w-full">
          <SingleDealCard
            deal={deal}
            chatProps={{
              resourceId: id,
              resourceType: 'deal',
              participantId: ownerId,
              owner: ownerName,
              preserveRedirectUrl: `/dailydeals/views/${id}`,
            }}
          />
        </div>

        {/* Secondary Content - Desktop Only */}
        <div className="hidden lg:block flex-[3] bg-white border rounded shadow-md p-2 self-start">
          <SendMessage
            resourceId={id}
            resourceType="deal"
            participantId={ownerId}
            owner={ownerName}
            preserveRedirectUrl={`/dailydeals/views/${id}`}
          />
        </div>
      </div>

      {/* Browse More Button */}
      <div className="text-center mt-6 mb-4">
        <Link
          href="/dailydeals"
          className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Browse More Deals
        </Link>
      </div>
    </div>
  );
};

export default DealDetailPage;
