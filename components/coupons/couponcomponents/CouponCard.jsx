'use client';

import { MdLocationOn, MdStore, MdSchedule, MdCalendarMonth } from 'react-icons/md';
import { FaClock, FaTicketAlt, FaShareAlt } from 'react-icons/fa';
import { formatValidDays, formatValidHours } from '@/utils/couponSchedule';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import Link from 'next/link';
import CodeModal from '../CodeModal';
import CouponGuestAuthModal from './CouponGuestAuthModal';

export default function CampaignCard({ campaign, onGenerateCode }) {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [userCode, setUserCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isLimitReached = campaign.maxRedemptions > 0 && 
                        campaign.totalGenerated >= campaign.maxRedemptions;
  
  const userHasCode = campaign.userHasCode || false;

  const fetchUserCode = async () => {
    setLoadingCode(true);
    try {
      const response = await axios.get('/coupons/my-codes');
      const userCodes = response.data.codes;
      const codeForCampaign = userCodes.find(
        code => code.campaignId._id === campaign._id
      );
      
      if (codeForCampaign) {
        setUserCode(codeForCampaign);
        setShowModal(true);
      } else {
        toast.error('Code not found');
      }
    } catch (error) {
      toast.error('Failed to fetch your code');
    } finally {
      setLoadingCode(false);
    }
  };

  const handleButtonClick = async () => {
    if (!isLoggedIn) {
      // Logged out: offer the login-or-email fork instead of bouncing straight to login.
      if (isLimitReached || isExpired) return;
      setShowGuestModal(true);
      return;
    }

    if (userHasCode) {
      fetchUserCode();
      return;
    }

    if (isLimitReached || isExpired) return;

    setIsGenerating(true);
    try {
      await onGenerateCode(campaign._id);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.setItem('redirectAfterLogin', '/coupons');
        router.push('/login?preserveRedirect=true');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!campaign.slug) return;
    // Append a timestamp param (ignored by the page) so WhatsApp treats each re-share as a new URL
    // and re-scrapes the preview after a campaign edit - same pattern as the events share button.
    const timestamp = Date.now();
    const url = `${window.location.origin}/coupons/${campaign.slug}?v=${timestamp}`;
    const shareData = {
      title: campaign.store?.storeName || 'Coupon',
      text: `${campaign.discount} ${campaign.discountProduct}`,
      url
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch {
        toast.error('Unable to share');
      }
    }
  };

  const getButtonConfig = () => {
    if (userHasCode) {
      const isRedeemed = campaign.userCodeRedeemed || false;
      return {
        text: loadingCode ? 'LOADING...' : (isRedeemed ? 'REDEEMED' : 'VIEW YOUR CODE'),
        className: isRedeemed ? 'bg-slate-500 text-white' : 'bg-teal-700 hover:bg-teal-800 text-white',
        disabled: loadingCode
      };
    }

    if (isExpired) {
      return {
        text: 'EXPIRED',
        className: 'bg-slate-200 text-slate-500 cursor-not-allowed',
        disabled: true
      };
    }

    if (isLimitReached) {
      return {
        text: 'SOLD OUT',
        className: 'bg-slate-200 text-slate-500 cursor-not-allowed',
        disabled: true
      };
    }

    return {
      text: isGenerating ? 'GENERATING...' : 'GET CODE',
      className: 'bg-teal-700 hover:bg-teal-800 text-white',
      disabled: isGenerating
    };
  };

  const buttonConfig = getButtonConfig();

  const daysLabel = formatValidDays(campaign.validDays);
  const hoursLabel = formatValidHours(campaign.validHours);

  // Border class removed


  return (
    <div className={`relative h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all`}>
      {/* Top Section — Row 1: Logo + Store Name · Row 2: Discount heading */}
      <div className="p-3 pb-2">
        {/* Row 1: Logo + Store Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-14 h-14 flex-shrink-0 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            {campaign.store?.logo?.url ? (
              <img
                src={campaign.store.logo.url}
                alt={campaign.store.storeName}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <MdStore className="text-2xl text-slate-400" />
              </div>
            )}
          </div>
          <h2 className="flex-1 min-w-0 text-base font-bold text-slate-900 line-clamp-2 leading-tight">
            {campaign.store?.storeName}
          </h2>
        </div>

        {/* Row 2: Discount heading — fixed 2-line height so the divider aligns across cards */}
        <p className="mt-2.5 text-base font-bold text-slate-900 line-clamp-2 leading-snug min-h-[2.75rem]">
          {campaign.discount} {campaign.discountProduct}
        </p>
      </div>

      {/* Column 3: Full Width Details */}
      <div className="flex flex-col flex-1 px-3 pb-3">
        {/* Metadata — anchored under the headline so the divider aligns across cards */}
        <div className="space-y-1 border-t border-slate-100 pt-2">
          {/* Availability: valid until · codes left */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <FaClock className="flex-shrink-0" />
            <span>Valid until {format(new Date(campaign.expiryDate), 'dd MMM yyyy')}</span>
          </div>

          {campaign.maxRedemptions > 0 && campaign.maxRedemptions !== Infinity && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <FaTicketAlt className="flex-shrink-0" />
              <span>{campaign.maxRedemptions - campaign.totalGenerated} left</span>
            </div>
          )}

          {/* Schedule: days · hours (when set) */}
          {daysLabel && (
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <MdCalendarMonth className="flex-shrink-0" />
              <span className="truncate">{daysLabel}</span>
            </div>
          )}

          {hoursLabel && (
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <MdSchedule className="flex-shrink-0" />
              <span className="truncate">{hoursLabel}</span>
            </div>
          )}

          {/* Location */}
          {campaign.store?.address?.formattedAddress && (
            <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <MdLocationOn className="flex-shrink-0" />
              <span className="truncate">
                {campaign.store.address.suburb || campaign.store.address.state ?
                  [campaign.store.address.suburb, campaign.store.address.state].filter(Boolean).join(', ') :
                  campaign.store.address.formattedAddress}
              </span>
            </div>
          )}
        </div>

        {/* Spacer pushes the action row to the bottom */}
        <div className="flex-1"></div>

        {/* Action Button and Share Icons */}
        <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={handleButtonClick}
                disabled={buttonConfig.disabled}
                className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${buttonConfig.className}`}
              >
                {buttonConfig.text}
              </button>
              {(campaign.slug || campaign._id) && (
                <Link
                  // Link to the canonical, indexable slug page so the landing page's SSR
                  // links feed Google the detail pages (the /coupons/views/{id} route is
                  // noindex - see shared-seo-plumbing). Falls back to /views for the rare
                  // slug-less campaign. See featureplans/coupons-seo-landing.md.
                  href={campaign.slug ? `/coupons/${campaign.slug}` : `/coupons/views/${campaign._id}`}
                  className="text-xs text-teal-700 hover:text-teal-800 underline"
                >
                  More details & terms
                </Link>
              )}
            </div>

            {campaign.slug && (
              <button
                onClick={handleShare}
                title="Share"
                aria-label="Share"
                className="w-8 h-8 rounded-full flex items-center justify-center text-teal-700 hover:bg-teal-50 transition-colors flex-shrink-0"
              >
                <FaShareAlt className="w-4 h-4" />
              </button>
            )}
          </div>
      </div>

      {showModal && userCode && (
        <CodeModal
          code={userCode}
          campaign={userCode.campaignId}
          store={userCode.campaignId.storeId}
          onClose={() => setShowModal(false)}
        />
      )}

      <CouponGuestAuthModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        campaign={campaign}
      />
    </div>
  );
}
