'use client';

import React from 'react';
import CouponCard from './CouponCard';
import SkeletonLoader from '../../SkeletonLoader';
import PromotionBottomAd from '@/components/ads/promotions/PromotionBottomAd';

const CouponGrid = ({ campaigns, campaignStatus, onGenerateCode }) => {
  if ((campaignStatus === 'idle' || campaignStatus === 'loading') && (!campaigns || campaigns.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <SkeletonLoader />
      </div>
    );
  }

  if (campaignStatus === 'success' && (!campaigns || campaigns.length === 0)) {
    return (
      <div className="flex justify-center items-center text-center p-8 min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
        <p className="text-xs sm:text-sm text-gray-800">No Promotions Listed</p>
      </div>
    );
  }

  const mobileAdPosition = 4;
  const tabletAdPosition = 6;
  const desktopAdPosition = 8;

  const itemsWithAd = [];
  let adInserted = false;

  campaigns.forEach((campaign, index) => {
    itemsWithAd.push({ type: 'campaign', data: campaign });
    
    if (!adInserted) {
      if (index === mobileAdPosition - 1 && campaigns.length > mobileAdPosition) {
        itemsWithAd.push({ type: 'ad-mobile', data: null });
      }
      if (index === tabletAdPosition - 1 && campaigns.length > tabletAdPosition) {
        itemsWithAd.push({ type: 'ad-tablet', data: null });
      }
      if (index === desktopAdPosition - 1 && campaigns.length > desktopAdPosition) {
        itemsWithAd.push({ type: 'ad-desktop', data: null });
        adInserted = true;
      }
    }
  });

  return (
    <div id="CouponGrid" className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
      <div
        id="CouponGrids"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4"
      >
        {itemsWithAd.map((item, index) => {
          if (item.type === 'campaign') {
            return (
              <CouponCard
                key={item.data._id}
                campaign={item.data}
                onGenerateCode={onGenerateCode}
              />
            );
          } else if (item.type === 'ad-mobile') {
            return (
              <div key="ad-mobile" className="col-span-2 block md:hidden">
                <PromotionBottomAd />
              </div>
            );
          } else if (item.type === 'ad-tablet') {
            return (
              <div key="ad-tablet" className="col-span-3 hidden md:block lg:hidden">
                <PromotionBottomAd />
              </div>
            );
          } else if (item.type === 'ad-desktop') {
            return (
              <div key="ad-desktop" className="col-span-4 hidden lg:block">
                <PromotionBottomAd />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default CouponGrid;
