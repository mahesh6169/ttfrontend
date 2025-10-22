'use client';

import { MdLocationOn, MdStore } from 'react-icons/md';
import { FaTag, FaClock } from 'react-icons/fa';
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
    <div className={`relative border rounded-lg shadow-md bg-gray-100 hover:bg-gray-200 transition-colors ${borderColorClass}`}>
      {/* Store Logo */}
      <div className="relative w-full h-32 sm:h-36 md:h-40 bg-white rounded-md overflow-hidden">
        {campaign.store?.logo ? (
          <img 
            src={campaign.store.logo} 
            alt={campaign.store.storeName}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <MdStore className="text-6xl text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Store Name */}
        <h2 className="text-xs sm:text-sm text-center font-semibold my-1 px-2 truncate text-gray-800">
          {campaign.store?.storeName}
        </h2>

        {/* Discount */}
        <div className="flex items-start gap-2">
          <FaTag className="text-teal-600 mt-1 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-teal-700">
              {campaign.discount}
            </p>
            <p className="text-xs text-gray-600">
              on {campaign.discountProduct}
            </p>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaClock className="flex-shrink-0" />
          <span>
            Valid until {format(new Date(campaign.expiryDate), 'dd MMM yyyy')}
          </span>
        </div>

        {/* Location */}
        {campaign.store?.address?.formattedAddress && (
          <div className="flex items-center gap-2 text-xs text-gray-600 truncate">
            <MdLocationOn className="flex-shrink-0" />
            <span className="truncate">
              {campaign.store.address.suburb || campaign.store.address.state || 
               campaign.store.address.formattedAddress}
            </span>
          </div>
        )}

        {/* Redemption Count */}
        {campaign.maxRedemptions > 0 && (
          <div className="text-xs text-gray-500">
            {campaign.totalGenerated}/{campaign.maxRedemptions} claimed
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={buttonConfig.disabled}
          className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${buttonConfig.className}`}
        >
          {buttonConfig.text}
        </button>
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
