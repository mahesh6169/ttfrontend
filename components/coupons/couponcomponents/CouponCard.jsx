'use client';

import { MdLocationOn, MdStore, MdContentCopy } from 'react-icons/md';
import { FaTag, FaClock, FaTicketAlt, FaWhatsapp, FaFacebook } from 'react-icons/fa';
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
      localStorage.setItem('redirectAfterLogin', '/discountcode');
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
        localStorage.setItem('redirectAfterLogin', '/discountcode');
        router.push('/login?preserveRedirect=true');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonConfig = () => {
    if (userHasCode) {
      return {
        text: loadingCode ? 'LOADING...' : 'VIEW YOUR CODE',
        className: 'bg-teal-600 hover:bg-teal-700 text-white',
        disabled: loadingCode
      };
    }

    if (isExpired) {
      return {
        text: 'EXPIRED',
        className: 'bg-gray-300 text-gray-600 cursor-not-allowed',
        disabled: true
      };
    }

    if (isLimitReached) {
      return {
        text: 'SOLD OUT',
        className: 'bg-gray-300 text-gray-600 cursor-not-allowed',
        disabled: true
      };
    }

    return {
      text: isGenerating ? 'GENERATING...' : 'GET CODE',
      className: 'bg-teal-600 hover:bg-teal-700 text-white',
      disabled: isGenerating
    };
  };

  const buttonConfig = getButtonConfig();

  const borderColorClass = isExpired 
    ? 'border-l-4 border-gray-400' 
    : isLimitReached 
    ? 'border-l-4 border-amber-400' 
    : 'border-l-4 border-teal-700';

  const handleCopyLink = () => {
    if (!campaign.slug) {
      toast.error('Share link not available');
      return;
    }
    const url = `${window.location.origin}/discountcode/${campaign.slug}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWhatsAppShare = () => {
    if (!campaign.slug) {
      toast.error('Share link not available');
      return;
    }
    const url = `${window.location.origin}/discountcode/${campaign.slug}`;
    const text = `Check out this discount: ${campaign.discount} on ${campaign.discountProduct} at ${campaign.store?.storeName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const handleFacebookShare = () => {
    if (!campaign.slug) {
      toast.error('Share link not available');
      return;
    }
    const url = `${window.location.origin}/discountcode/${campaign.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className={`relative h-full flex flex-col border rounded-lg shadow-md bg-gradient-to-br from-teal-50 to-lime-50 hover:from-teal-100 hover:to-lime-100 transition-all ${borderColorClass}`}>
      {/* Top Section: Store Name + Discount | Logo */}
      <div className="flex gap-3 p-3 pb-2">
        {/* Column 1: Store Name + Discount */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-teal-800 mb-1 line-clamp-2 uppercase tracking-tight">
            {campaign.store?.storeName}
          </h2>
          <p className="text-sm sm:text-base font-bold text-teal-800 line-clamp-2 leading-snug">
            {campaign.discount} {campaign.discountProduct}
          </p>
        </div>

        {/* Column 2: Logo */}
        <div className="flex-1 md:max-w-[192px] flex-shrink-0">
          <div className="relative w-full h-24 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-teal-200">
            {campaign.store?.logo?.url ? (
              <img 
                src={campaign.store.logo.url} 
                alt={campaign.store.storeName}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <MdStore className="text-4xl text-teal-300" />
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
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
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
            <div className="flex items-center gap-1 text-xs font-medium text-gray-600 truncate">
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
                  href={`/discountcode/views/${campaign._id}`}
                  className="text-xs text-teal-600 hover:text-teal-700 underline"
                >
                  More details & terms
                </Link>
              )}
            </div>

            {/* Share Icons */}
            {campaign.slug && (
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  title="Copy Link"
                >
                  <MdContentCopy className="text-base" />
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                  title="Share on WhatsApp"
                >
                  <FaWhatsapp className="text-base" />
                </button>
                <button
                  onClick={handleFacebookShare}
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Share on Facebook"
                >
                  <FaFacebook className="text-base" />
                </button>
              </div>
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
