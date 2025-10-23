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

  const adPosition = 4;

  const itemsWithAd = [];
  campaigns.forEach((campaign, index) => {
    itemsWithAd.push({ type: 'campaign', data: campaign });
    
    if (index === adPosition - 1 && campaigns.length > adPosition) {
      itemsWithAd.push({ type: 'ad', data: null });
    }
  });

  return (
    <div id="CouponGrid" className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
      <div
        id="CouponGrids"
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-stretch"
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
          } else if (item.type === 'ad') {
            return (
              <div key="ad" className="col-span-1 md:col-span-2">
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
