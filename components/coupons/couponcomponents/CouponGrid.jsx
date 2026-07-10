'use client';

import React from 'react';
import CouponCard from './CouponCard';
import PromotionBottomAd from '@/components/ads/promotions/PromotionBottomAd';

const CouponGrid = ({ campaigns, campaignStatus, onGenerateCode }) => {
  // Loading / empty / error states are handled by the parent page
  // (PageSkeleton / EmptyState / ErrorState); the grid only renders items.

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
