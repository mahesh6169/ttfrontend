'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { getDealById, clearDeal } from '@/store/slices/dailydeals/dealSlice';
import SingleDealCard from '@/components/dailydeals/dealcomponents/SingleDealCard';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import { buildSlugUrl } from '@/utils/slugUtils';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import ReportLink from '@/components/support/ReportLink';
import { MdLocationOn, MdPhone, MdEmail, MdLanguage } from 'react-icons/md';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FaCommentDots, FaShareAlt, FaExternalLinkAlt } from 'react-icons/fa';

const SOCIAL_ICONS = {
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  X: FaXTwitter
};

const DealDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const router = useRouter();

  const { deal, fetchStatus, error } = useSelector((state) => state.deal);
  const [showFloatingButtons, setShowFloatingButtons] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (id) {
      dispatch(getDealById(id));
    }

    return () => {
      dispatch(clearDeal());
    };
  }, [dispatch, id]);

  // Hide floating buttons on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY.current;

      if (Math.abs(scrollDiff) > 10) {
        if (scrollDiff > 0) {
          setShowFloatingButtons(false);
        } else {
          setShowFloatingButtons(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

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
          className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Deal not found</p>
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

  // Check if this is an admin-added deal (on behalf of business)
  const isAdminListing = deal.isAdminListing || false;

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

        <ReportLink
          type="deal"
          id={deal._id}
          title={deal.dealTitle}
          returnUrl={`/dailydeals/views/${id}`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Primary Content */}
        <div className="flex-[7] bg-white w-full">
          <SingleDealCard
            deal={deal}
            isAdminListing={isAdminListing}
            chatProps={{
              resourceId: id,
              resourceType: 'deal',
              participantId: ownerId,
              owner: ownerName,
              preserveRedirectUrl: `/dailydeals/views/${id}`,
              isAdminListing,
              listingTitle: deal.dealTitle,
            }}
          />

          {/* Browse More Link */}
          <div className="text-center py-4">
            <Link
              href="/dailydeals"
              className="text-teal-600 hover:text-teal-700 text-sm font-medium hover:underline"
            >
              ← Browse More Deals
            </Link>
          </div>
        </div>

        {/* Secondary Content - Desktop Only (Sticky Sidebar) */}
        <div className="hidden lg:block flex-[3] sticky top-20 self-start space-y-4">
          <SendMessage
            resourceId={id}
            resourceType="deal"
            participantId={ownerId}
            owner={ownerName}
            preserveRedirectUrl={`/dailydeals/views/${id}`}
            isAdminListing={isAdminListing}
            listingTitle={deal.dealTitle}
          />

          {/* Share Icons */}
          <div className="flex items-center justify-center py-3 px-4 border border-slate-200 rounded shadow-sm">
            <span className="text-sm font-bold text-sky-500 mr-3">Share</span>
            <ShareIcons
              type="deal"
              title={deal.dealTitle}
              id={deal._id}
            />
          </div>

          {/* Deal Posted By / Business Contact Details - Desktop Sidebar */}
          <div className="border border-slate-200 rounded shadow-sm p-3">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">
              {isAdminListing ? 'Business Contact Details' : 'Deal Posted By'}
            </h3>

            {/* Business Logo & Name */}
            <div className="flex items-start gap-3 mb-3">
              {partner?.logo?.url ? (
                <img
                  src={partner.logo.url}
                  alt={partner.businessName}
                  className="w-12 h-12 object-contain rounded-lg bg-white p-1 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-lg flex-shrink-0">
                  {partner?.businessName?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-sm">{partner?.businessName}</h4>
              </div>
            </div>

            {/* Contact Info - Vertical Stack */}
            <div className="space-y-1.5 text-xs">
              {partner?.isNationwide ? (
                <div className="flex items-center text-slate-600">
                  <MdLocationOn className="mr-1.5 text-sm flex-shrink-0" />
                  <span>Available Nationwide</span>
                </div>
              ) : partner?.address?.formattedAddress && (
                <div className="flex items-start text-slate-600">
                  <MdLocationOn className="mr-1.5 text-sm mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{partner.address.formattedAddress}</span>
                </div>
              )}

              {partner?.contactInfo?.phone && (
                <div className="flex items-center gap-1.5">
                  <MdPhone className="text-slate-500 flex-shrink-0 text-sm" />
                  <a href={`tel:${partner.contactInfo.phone}`} className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1">
                    {partner.contactInfo.phone}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.email && (
                <div className="flex items-center gap-1.5">
                  <MdEmail className="text-slate-500 flex-shrink-0 text-sm" />
                  <a href={`mailto:${partner.contactInfo.email}`} className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 truncate">
                    {partner.contactInfo.email}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.website && (
                <div className="flex items-center gap-1.5">
                  <MdLanguage className="text-slate-500 flex-shrink-0 text-sm" />
                  <a
                    href={partner.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 truncate"
                  >
                    {partner.contactInfo.website.replace(/^https?:\/\//, '')}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.socialMedia?.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-slate-700">Follow us:</span>
                  {partner.contactInfo.socialMedia.map((social, index) => {
                    const Icon = SOCIAL_ICONS[social.platform];
                    if (!Icon || !social.url) return null;
                    return (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-teal-600 transition-colors"
                        title={social.platform}
                      >
                        <Icon className="text-sm" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* View All Deals Link */}
            <Link
              href={`/dailydeals?partnerstoreId=${partner?._id}`}
              className="block mt-3 pt-2 border-t border-slate-100 text-teal-600 hover:text-teal-700 text-xs font-medium"
            >
              View all deals from {partner?.businessName} →
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Floating Buttons */}
      {showFloatingButtons && (
        <div className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3 transition-opacity duration-200">
          {/* Share Button */}
          <button
            onClick={async () => {
              const shareUrl = `${window.location.origin}${buildSlugUrl('deal', deal.dealTitle, deal._id)}`;
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: deal.dealTitle,
                    text: deal.dealTitle,
                    url: shareUrl,
                  });
                } catch (err) {
                  if (err.name !== 'AbortError') {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
          >
            <FaShareAlt size={16} />
            <span>Share</span>
          </button>

          {/* Chat Button */}
          <button
            onClick={() => {
              const chatSection = document.getElementById('mobile-chat');
              if (chatSection) {
                chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Focus the textarea after scroll completes
                setTimeout(() => {
                  const textarea = chatSection.querySelector('textarea');
                  if (textarea) textarea.focus();
                }, 500);
              }
            }}
            className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
          >
            <FaCommentDots size={16} />
            <span>Chat</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DealDetailPage;
