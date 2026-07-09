'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import { MdLocationOn, MdStore } from 'react-icons/md';
import { FaClock, FaTicketAlt, FaShareAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import CodeModal from '@/components/coupons/CodeModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ShareIconsCampaign from '@/components/shared/ShareIconsCampaign';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

export default function CampaignDetailClient({ params }) {
  const router = useRouter();
  const [slug, setSlug] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userCode, setUserCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);

  // Read-more (terms) + share popover — hooks must live above the early returns
  const termsRef = useRef(null);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [termsOverflow, setTermsOverflow] = useState(false);
  const shareRefDesktop = useRef(null);
  const shareRefMobile = useRef(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const getSlug = async () => {
      const resolved = await params;
      setSlug(resolved.slug);
    };
    getSlug();
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    const fetchCampaign = async () => {
      try {
        const response = await axios.get(`/coupons/campaigns/slug/${slug}`);
        setCampaign(response.data.campaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
        setError('Campaign not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [slug]);

  // Measure whether the terms overflow the clamp
  useEffect(() => {
    const el = termsRef.current;
    if (el) setTermsOverflow(el.scrollHeight > el.clientHeight + 1);
  }, [campaign?.termsConditions]);

  // Close the share popover on click-outside / Esc
  useEffect(() => {
    const onDocClick = (e) => {
      const inDesktop = shareRefDesktop.current?.contains(e.target);
      const inMobile = shareRefMobile.current?.contains(e.target);
      if (!inDesktop && !inMobile) setShowShare(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setShowShare(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

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
        toast.info('Please login to get a coupon');
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
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <BackButton className="self-start" />
        </div>
        <div className="flex justify-center items-center min-h-[calc(100vh-16rem)]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col gap-2">
        <BackButton className="self-start" />
        <EmptyState
          title="Coupon not found"
          description="This offer may have expired or the link is incorrect."
          actionLabel="Browse coupons"
          actionHref="/coupons"
        />
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
  const codesLeft = campaign.maxRedemptions > 0 && campaign.maxRedemptions !== Infinity
    ? campaign.maxRedemptions - campaign.totalGenerated
    : null;

  const locationLabel = campaign.storeId?.address?.suburb || campaign.storeId?.address?.state
    ? [campaign.storeId?.address?.suburb, campaign.storeId?.address?.state].filter(Boolean).join(', ')
    : campaign.storeId?.address?.formattedAddress;

  const actionButton = (
    <div className="flex justify-center">
      <button
        onClick={handleGenerateCode}
        disabled={buttonConfig.disabled}
        className={`px-8 py-2.5 rounded-full font-semibold text-sm sm:text-base shadow-sm transition-colors ${buttonConfig.className}`}
      >
        {buttonConfig.text}
      </button>
    </div>
  );

  const shareIcons = (
    <ShareIconsCampaign
      slug={campaign.slug}
      title={`${campaign.discount} ${campaign.discountProduct}`}
      storeName={campaign.storeId?.storeName}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <BackButton className="self-start" />

      <div className="mx-auto w-full max-w-5xl lg:flex lg:flex-row lg:items-start lg:gap-4">
        {/* Content column */}
        <div className="lg:flex-[7] min-w-0">
          {/* Store header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className={`w-full max-w-[192px] h-24 rounded-lg overflow-hidden flex items-center justify-center shadow-sm ${campaign.storeId?.logo?.url ? 'bg-white' : 'bg-slate-50'}`}>
              {campaign.storeId?.logo?.url ? (
                <img
                  src={campaign.storeId.logo.url}
                  alt={campaign.storeId.storeName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <MdStore className="text-4xl text-slate-400" />
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {campaign.storeId?.storeName}
            </h1>
            {locationLabel && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MdLocationOn className="flex-shrink-0" />
                <span>{locationLabel}</span>
              </div>
            )}
          </div>

          {/* Offer */}
          <p className="text-center text-sm sm:text-base font-semibold text-slate-700 mt-3">
            {campaign.discount} {campaign.discountProduct}
          </p>

          {/* Details */}
          <div className="my-4 p-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <FaClock className="text-slate-500 flex-shrink-0" />
                <span>Valid until <span className="font-semibold">{format(new Date(campaign.expiryDate), 'dd MMM yyyy')}</span></span>
              </div>
              {codesLeft !== null && (
                <div className="flex items-center gap-2 text-slate-700">
                  <FaTicketAlt className="text-slate-500 flex-shrink-0" />
                  <span><span className="font-semibold">{codesLeft}</span> codes left</span>
                </div>
              )}
              {campaign.storeId?.address?.formattedAddress && (
                <div className="flex items-start gap-2 text-slate-700">
                  <MdLocationOn className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{campaign.storeId.address.formattedAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* GET CODE — inline on mobile, right after Details */}
          <div className="lg:hidden mb-4">
            {actionButton}
          </div>

          {/* Terms & Conditions (read-more) */}
          {campaign.termsConditions && (
            <div className="my-4 p-3 relative">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Terms &amp; Conditions</h3>
              <div className="relative">
                <div
                  ref={termsRef}
                  className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${termsExpanded ? '' : 'line-clamp-[8]'}`}
                >
                  {campaign.termsConditions}
                </div>
                {!termsExpanded && termsOverflow && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
              {(termsOverflow || termsExpanded) && (
                <button
                  type="button"
                  onClick={() => setTermsExpanded((e) => !e)}
                  className="mt-2 text-teal-700 hover:text-teal-800 font-semibold text-sm underline"
                >
                  {termsExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — desktop only: GET CODE + Share */}
        <aside className="hidden lg:flex lg:flex-col lg:flex-[3] sticky top-20 self-start gap-3">
          <div className="border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
            {codesLeft !== null && (
              <p className="text-xs text-slate-500 text-center">{codesLeft} codes left</p>
            )}
            {actionButton}
          </div>

          {campaign.slug && (
            <div className="relative flex justify-center" ref={shareRefDesktop}>
              <button
                onClick={() => setShowShare((v) => !v)}
                className="flex items-center gap-2 text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-full px-4 py-1.5 font-semibold text-sm transition-colors"
              >
                <FaShareAlt size={14} />
                <span>Share</span>
              </button>
              {showShare && (
                <div className="absolute top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-20">
                  {shareIcons}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Floating Share — mobile only */}
      {campaign.slug && (
        <div className="lg:hidden fixed bottom-20 right-4 z-40" ref={shareRefMobile}>
          {showShare && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
              {shareIcons}
            </div>
          )}
          <button
            onClick={() => setShowShare((v) => !v)}
            className="bg-teal-700/90 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center justify-center h-12 w-12 rounded-full shadow-lg transition-colors"
            aria-label="Share"
          >
            <FaShareAlt size={18} />
          </button>
        </div>
      )}

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
