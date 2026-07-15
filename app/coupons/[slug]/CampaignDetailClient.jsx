'use client';

import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';
import CouponDetail from '@/components/coupons/couponcomponents/CouponDetail';

export default function CampaignDetailClient({ params }) {
  const [slug, setSlug] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return <CouponDetail campaign={campaign} onCampaignChange={setCampaign} />;
}
