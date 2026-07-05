'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SingleAdvertCard from '@/components/adverts/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import { useSelector, useDispatch } from 'react-redux';
import { getAdvertById } from '@/store/slices/adverts/advertSlice';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import { FaShareAlt } from 'react-icons/fa';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const AdvertDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { advert, fetchStatus: status, error } = useSelector(
    (state) => state.advert
  );
  const { user } = useSelector((state) => state.user);

  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setShareOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [shareOpen]);

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
      <div className="flex flex-col gap-2">
        <BackButton className="self-start" />
        <ErrorState onRetry={() => dispatch(getAdvertById(id))} />
      </div>
    );
  }

  if (status === 'succeeded' && !advert) {
    return (
      <div className="flex flex-col gap-2">
        <BackButton className="self-start" />
        <EmptyState
          title="Listing not found"
          description="This listing may have been removed, or the link is incorrect."
          actionLabel="Browse listings"
          actionHref="/listings"
        />
      </div>
    );
  }

  // Curated listing — posted by a Desify curator on behalf of the owner
  const isCuratedListing = advert.isCuratedListing || false;

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center">
        {/* Back */}
        <BackButton className="self-start" />

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

          {/* Share - popover trigger */}
          <div className="flex justify-center py-3 px-4">
            <div className="relative" ref={shareRef}>
              <button
                onClick={() => setShareOpen((open) => !open)}
                aria-expanded={shareOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-4 py-1.5 rounded-full font-semibold text-sm md:text-base transition-colors"
              >
                <FaShareAlt size={13} />
                <span>Share</span>
              </button>
              {shareOpen && (
                <div className="absolute right-0 mt-2 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                  <ShareIcons
                    type="listing"
                    title={advert.title}
                    id={advert._id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertDetail;
