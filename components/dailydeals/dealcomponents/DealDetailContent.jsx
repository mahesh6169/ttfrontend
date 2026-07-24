'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SingleDealCard from '@/components/dailydeals/dealcomponents/SingleDealCard';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import ReportLink from '@/components/support/ReportLink';
import BackButton from '@/components/BackButton';
import { buildSlugUrl } from '@/utils/slugUtils';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FaCommentDots, FaShareAlt, FaExternalLinkAlt, FaMobileAlt, FaEnvelope, FaGlobe, FaMapMarkedAlt, FaThumbsUp } from 'react-icons/fa';

const SOCIAL_ICONS = {
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  X: FaXTwitter
};

// Client detail view for a single deal. The deal is fetched server-side in
// app/deals/(with-ads)/[slugId]/page.jsx and passed in as a prop (no client
// fetch), so the content is in the server HTML for SEO. Interactive parts
// (message, share, WhatsApp/deal-link) hydrate in the browser.
const DealDetailContent = ({ deal }) => {
  const router = useRouter();
  const id = deal._id;
  const dealUrl = buildSlugUrl('deal', deal.dealTitle, deal._id);

  const partner = deal?.partnerstoreId;
  const ownerId = deal?.postedBy?._id || deal?.postedBy;
  const ownerName = partner?.businessName || deal?.postedBy?.name || 'Business';
  const isCuratedDeal = deal?.isCuratedDeal || false;

  const [chatInView, setChatInView] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  // Fade out the mobile floating buttons once the inline chat scrolls into view (B6).
  useEffect(() => {
    const node = document.getElementById('mobile-chat');
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setChatInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [deal?._id]);

  // Close the share popover on outside-click / Esc (B5).
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

  // Back: return to the previous page if it was on our site; otherwise go to /deals.
  const handleBack = () => {
    const cameFromSite =
      typeof document !== 'undefined' &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (cameFromSite) router.back();
    else router.push('/deals');
  };

  return (
    <div id="viewsmain" className="flex flex-col gap-2">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center">
        <BackButton className="self-start" onClick={handleBack} />
        <ReportLink
          type="deal"
          id={deal._id}
          title={deal.dealTitle}
          returnUrl={dealUrl}
        />
      </div>

      <>
      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Primary Content */}
        <div className="flex-[7] bg-white w-full">
          <SingleDealCard
            deal={deal}
            isCurated={isCuratedDeal}
            chatProps={{
              resourceId: id,
              resourceType: 'deal',
              participantId: ownerId,
              owner: ownerName,
              preserveRedirectUrl: dealUrl,
              isCurated: isCuratedDeal,
              listingTitle: deal.dealTitle,
            }}
          />

          {/* Browse More Link */}
          <div className="text-center pt-8 pb-4">
            <Link
              href="/deals"
              className="text-teal-700 hover:text-teal-800 text-sm font-medium hover:underline"
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
            preserveRedirectUrl={dealUrl}
            isCurated={isCuratedDeal}
            listingTitle={deal.dealTitle}
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
                    type="deal"
                    title={deal.dealTitle}
                    id={deal._id}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Offered By - Desktop Sidebar */}
          <div className="border border-slate-200 rounded shadow-sm p-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">
              Offered By
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
                  <FaMapMarkedAlt className="text-slate-500 mr-1.5 flex-shrink-0" size={13} />
                  <span>Available Nationwide</span>
                </div>
              ) : partner?.address?.formattedAddress && (
                <div className="flex items-start text-slate-600">
                  <FaMapMarkedAlt className="text-slate-500 mr-1.5 mt-0.5 flex-shrink-0" size={13} />
                  <span className="line-clamp-2">{partner.address.formattedAddress}</span>
                </div>
              )}

              {partner?.contactInfo?.phone && (
                <div className="flex items-center gap-1.5">
                  <FaMobileAlt className="text-slate-500 flex-shrink-0" size={13} />
                  <a href={`tel:${partner.contactInfo.phone}`} className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1">
                    {partner.contactInfo.phone}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.email && (
                <div className="flex items-center gap-1.5">
                  <FaEnvelope className="text-slate-500 flex-shrink-0" size={13} />
                  <a href={`mailto:${partner.contactInfo.email}`} className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1 truncate">
                    {partner.contactInfo.email}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.website && (
                <div className="flex items-center gap-1.5">
                  <FaGlobe className="text-slate-500 flex-shrink-0" size={13} />
                  <a
                    href={partner.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-700 hover:text-slate-900 underline flex items-center gap-1 truncate"
                  >
                    {partner.contactInfo.website.replace(/^https?:\/\//, '')}
                    <FaExternalLinkAlt className="text-[9px] text-slate-400 flex-shrink-0" />
                  </a>
                </div>
              )}

              {partner?.contactInfo?.socialMedia?.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <FaThumbsUp className="text-slate-500 flex-shrink-0" size={13} title="Follow us" aria-label="Follow us" />
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

          </div>
        </div>
      </div>

      {/* Mobile Floating Buttons - fade out once the inline chat is in view */}
      <div
        className={`lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3 transition-all duration-200 ${
          chatInView ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
        }`}
        aria-hidden={chatInView}
      >
          {/* Share Button */}
          <button
            onClick={async () => {
              const shareUrl = `${window.location.origin}${buildSlugUrl('deal', deal.dealTitle, deal._id)}`;
              const shareText = `${deal.dealTitle}\n\nView on Desify\n`;

              if (navigator.share) {
                try {
                  await navigator.share({
                    title: deal.dealTitle,
                    text: shareText,
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

          {/* Chat Button - hidden on curated deals (no chat box to jump to) */}
          {!isCuratedDeal && (
            <button
              onClick={() => {
                const chatSection = document.getElementById('mobile-chat');
                if (chatSection) {
                  chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          )}
        </div>
      </>
    </div>
  );
};

export default DealDetailContent;
