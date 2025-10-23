'use client';

import { MdLocationOn, MdStore } from 'react-icons/md';
import { FaTag, FaClock, FaTicketAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import CodeModal from '../CodeModal';

export default function CampaignCard({ campaign, onGenerateCode }) {
  const router = useRouter();
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
        router.push('/users/login');
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
        text: 'LIMIT REACHED',
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

  return (
    <div className={`relative h-full flex flex-col border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200 transition-colors ${borderColorClass}`}>
      {/* Top Section: Store Name + Discount | Logo */}
      <div className="flex gap-3 p-3 pb-2">
        {/* Column 1: Store Name + Discount */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 truncate">
            {campaign.store?.storeName}
          </h2>
          <div className="flex items-start gap-2">
            <FaTag className="text-teal-600 mt-1 flex-shrink-0 text-sm" />
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-700">
              {campaign.discount}
            </p>
          </div>
        </div>

        {/* Column 2: Logo */}
        <div className="flex-1 flex-shrink-0">
          <div className="relative w-full h-24 bg-white rounded-md overflow-hidden flex items-center justify-center">
            {campaign.store?.logo ? (
              <img 
                src={campaign.store.logo} 
                alt={campaign.store.storeName}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <MdStore className="text-4xl text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column 3: Full Width Details */}
      <div className="flex flex-col flex-1 px-3 pb-3">
        {/* Product */}
        <div className="text-sm font-bold text-gray-700 my-1">
          {campaign.discountProduct}
        </div>

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

          {/* Action Button */}
          <button
            onClick={handleButtonClick}
            disabled={buttonConfig.disabled}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors mt-2 ${buttonConfig.className}`}
          >
            {buttonConfig.text}
          </button>
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
