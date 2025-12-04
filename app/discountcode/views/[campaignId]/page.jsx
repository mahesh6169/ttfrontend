'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import { MdLocationOn, MdStore, MdShare } from 'react-icons/md';
import { FaClock, FaTicketAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import CodeModal from '@/components/coupons/CodeModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareIconsCampaign from '@/components/shared/ShareIconsCampaign';

export default function CampaignViewPage() {
  const router = useRouter();
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userCode, setUserCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);

  useEffect(() => {
    if (!campaignId) return;

    const fetchCampaign = async () => {
      try {
        const response = await axios.get(`/coupons/campaigns/${campaignId}`);
        setCampaign(response.data.campaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setError('Campaign not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

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

  const handleGenerateCode = async () => {
    if (campaign.userHasCode) {
      fetchUserCode();
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(`/coupons/campaigns/${campaign._id}/generate-code`);
      toast.success('Code generated successfully!');
      setCampaign({ ...campaign, userHasCode: true });
      setUserCode(response.data.couponCode);
      setShowModal(true);
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.info('Please login to get a discount code');
        router.push('/users/login');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to generate code');
      }
    } finally {
      setIsGenerating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Campaign not found'}</p>
          <button
            onClick={() => router.push('/discountcode')}
            className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
          >
            Browse More Discount Codes
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(campaign.expiryDate) < new Date();
  const isLimitReached = campaign.maxRedemptions > 0 && 
                        campaign.totalGenerated >= campaign.maxRedemptions;

  const getButtonConfig = () => {
    if (campaign.userHasCode) {
      const isRedeemed = campaign.userCodeRedeemed || false;
      return {
        text: loadingCode ? 'LOADING...' : (isRedeemed ? 'REDEEMED' : 'VIEW YOUR CODE'),
        className: isRedeemed ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white',
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

  return (
    <div className="min-h-screen py-2 sm:py-4 px-2 sm:px-3">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-3">
          <button
            onClick={() => router.push('/discountcode')}
            className="flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
          >
            <span>&lt;</span>
            <span>back</span>
          </button>
        </div>

        {/* Main Campaign Card */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-3">
          {/* Store Logo and Name */}
          <div className="flex gap-2.5 sm:gap-4 mb-3">
            <div className="flex-1 max-w-[192px] h-24 bg-white rounded-lg overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0">
              {campaign.storeId?.logo?.url ? (
                <img 
                  src={campaign.storeId.logo.url} 
                  alt={campaign.storeId.storeName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <MdStore className="text-4xl text-teal-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-teal-800 mb-1 line-clamp-2 uppercase tracking-tight">
                {campaign.storeId?.storeName}
              </h1>
              {campaign.storeId?.address?.formattedAddress && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <MdLocationOn className="flex-shrink-0 text-sm" />
                  <span className="truncate">
                    {campaign.storeId.address.suburb || campaign.storeId.address.state ? 
                      [campaign.storeId.address.suburb, campaign.storeId.address.state].filter(Boolean).join(', ') :
                      campaign.storeId.address.formattedAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Discount and Product */}
          <p className="text-sm sm:text-base font-bold text-teal-800 line-clamp-2 leading-snug mb-3">
            {campaign.discount} {campaign.discountProduct}
          </p>

          {/* Details */}
          <div className="space-y-1">
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

            {campaign.storeId?.address?.formattedAddress && (
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600 truncate">
                <MdLocationOn className="flex-shrink-0" />
                <span className="truncate">
                  {campaign.storeId.address.formattedAddress}
                </span>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {campaign.termsConditions && (
            <div className="bg-white/80 rounded-lg p-2.5 sm:p-3 mb-3 mt-2 sm:mt-3">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-1">Terms & Conditions</h3>
              <div className="max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {campaign.termsConditions}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleGenerateCode}
            disabled={buttonConfig.disabled}
            className={`w-full py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base md:text-lg transition-colors ${buttonConfig.className}`}
          >
            {buttonConfig.text}
          </button>
        </div>

        {/* Share Section */}
        {campaign.slug && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
              <MdShare className="text-teal-600 text-lg sm:text-xl" />
              <h3 className="text-sm sm:text-base font-bold text-gray-800">Share this discount</h3>
            </div>
            <div className="flex justify-center">
              <ShareIconsCampaign 
                slug={campaign.slug}
                title={`${campaign.discount} ${campaign.discountProduct}`}
                storeName={campaign.storeId?.storeName}
              />
            </div>
          </div>
        )}

        {/* Browse More Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/discountcode')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors"
          >
            Browse More Discount Codes
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
