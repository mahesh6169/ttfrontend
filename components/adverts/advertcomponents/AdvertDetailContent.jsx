'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SingleAdvertCard from '@/components/adverts/advertcomponents/SingleAdvertCard';
import SendMessage from '@/components/chat/SendMessage';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import BackButton from '@/components/BackButton';
import { FaShareAlt } from 'react-icons/fa';
import { buildSlugUrl } from '@/utils/slugUtils';

// Client detail view for a single listing. The advert is fetched server-side in
// app/listings/(with-ads)/[slug]/page.jsx and passed in as a prop (no client
// fetch), so the content is in the server HTML for SEO. Interactive parts
// (chat, share, back, wishlist) hydrate in the browser.
const AdvertDetailContent = ({ advert }) => {
  const router = useRouter();
  const id = advert._id;
  const listingUrl = buildSlugUrl('listing', advert.title, advert._id);
  const isCuratedListing = advert?.isCuratedListing || false;

  // Back: return to the previous page if it was on our site (e.g. the grid);
  // otherwise (landed straight from Google/WhatsApp) go to the listings page.
  const handleBack = () => {
    const cameFromSite =
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (cameFromSite) router.back();
    else router.push('/listings');
  };

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

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center">
        <BackButton className="self-start" onClick={handleBack} />
        <ReportLink
          type="listing"
          id={id}
          title={advert.title}
          returnUrl={listingUrl}
        />
      </div>

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
              preserveRedirectUrl: listingUrl,
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
            preserveRedirectUrl={listingUrl}
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
                  <ShareIcons type="listing" title={advert.title} id={advert._id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertDetailContent;
