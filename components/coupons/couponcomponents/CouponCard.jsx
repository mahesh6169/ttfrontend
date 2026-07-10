'use client';

import { MdLocationOn, MdStore } from 'react-icons/md';
import { FaClock, FaTicketAlt, FaShareAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import Link from 'next/link';
import CodeModal from '../CodeModal';

export default function CampaignCard({ campaign, onGenerateCode }) {
  const router = useRouter();
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isLoggedIn = tokenValidated && !!user?._id;
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      localStorage.setItem('redirectAfterLogin', '/coupons');
      router.push('/login?preserveRedirect=true');
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
    const url = `${window.location.origin}/coupons/${campaign.slug}`;
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

  // Border class removed


  return (
    <div className={`relative h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all`}>
      {/* Top Section: Store Name + Discount | Logo */}
      <div className="flex gap-3 p-3 pb-2">
        {/* Column 1: Store Name + Discount */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">
            {campaign.store?.storeName}
          </h2>
          <p className="text-sm font-semibold text-slate-700 line-clamp-2 leading-snug">
            {campaign.discount} {campaign.discountProduct}
          </p>
        </div>

        {/* Column 2: Logo */}
        <div className="flex-1 md:max-w-[192px] flex-shrink-0">
          <div className="relative w-full h-24 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            {campaign.store?.logo?.url ? (
              <img 
                src={campaign.store.logo.url} 
                alt={campaign.store.storeName}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <MdStore className="text-4xl text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column 3: Full Width Details */}
      <div className="flex flex-col flex-1 px-3 pb-3">
        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Bottom Details */}
        <div className="space-y-1">
          {/* Expiry Date and Redemption Count */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <FaClock className="flex-shrink-0" />
            <span>
              Valid until {format(new Date(campaign.expiryDate), 'dd MMM yyyy')}
            </span>
            {campaign.maxRedemptions > 0 && campaign.maxRedemptions !== Infinity && (
              <>
                <FaTicketAlt className="flex-shrink-0 ml-2" />
                <span>
                  {campaign.maxRedemptions - campaign.totalGenerated} left
                </span>
              </>
            )}
          </div>

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
              {campaign._id && (
                <Link
                  href={`/coupons/views/${campaign._id}`}
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
      </div>

      {showModal && userCode && (
        <CodeModal
          code={userCode}
          campaign={userCode.campaignId}
          store={userCode.campaignId.storeId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
