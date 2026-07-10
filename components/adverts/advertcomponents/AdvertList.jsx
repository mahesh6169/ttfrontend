'use client';

import React from 'react';
import AdvertCard from './AdvertCard';
import { useSelector } from 'react-redux';
import { useAdvertWishlist } from '@/utils/helpers/adverts/userAdvertWishlist';
import BottomAd from '@/components/ads/BottomAd';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const AdvertList = ({ adverts, advertStatus, onRetry }) => {
  const {
    user,
    status: userStatus,
  } = useSelector((state) => state.user);

  const {
    advertWishlist,
    isInWishlist,
    toggleWishlist,
  } = useAdvertWishlist();

 // Loading state
if ((advertStatus === 'idle' || advertStatus === 'loading') && (!adverts || adverts.length === 0)) {
  return <PageSkeleton variant="card" rows={8} />;
}

// Failed state
if (advertStatus === 'failed') {
  return <ErrorState onRetry={onRetry} />;
}

// No results state
if (advertStatus === 'success' && (!adverts || adverts.length === 0)) {
  return <EmptyState title="No listings found" description="Try adjusting your filters or search." />;
}


  // Calculate positions for ad insertion after 2 rows on each screen size
  // Mobile: 2 cols x 2 rows = 4 items
  // Tablet: 3 cols x 2 rows = 6 items  
  // Desktop: 4 cols x 2 rows = 8 items
  const mobileAdPosition = 4;
  const tabletAdPosition = 6;
  const desktopAdPosition = 8;

  // Create array with adverts and ad placement
  const itemsWithAd = [];
  let adInserted = false;

  adverts.forEach((advert, index) => {
    itemsWithAd.push({ type: 'advert', data: advert });
    
    // Insert ad after 2 rows based on screen size
    if (!adInserted) {
      if (index === mobileAdPosition - 1 && adverts.length > mobileAdPosition) {
        itemsWithAd.push({ type: 'ad-mobile', data: null });
      }
      if (index === tabletAdPosition - 1 && adverts.length > tabletAdPosition) {
        itemsWithAd.push({ type: 'ad-tablet', data: null });
      }
      if (index === desktopAdPosition - 1 && adverts.length > desktopAdPosition) {
        itemsWithAd.push({ type: 'ad-desktop', data: null });
        adInserted = true;
      }
    }
  });

  return (
    <div id="AdvertGrid" className="min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
      <div
        id="AdvertGrids"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4"
      >
        {itemsWithAd.map((item, index) => {
          if (item.type === 'advert') {
            return (
              <AdvertCard
                key={item.data._id}
                advert={item.data}
                isInWishlist={isInWishlist(item.data._id)}
                onWishlistToggle={() => toggleWishlist(item.data._id)}
              />
            );
          } else if (item.type === 'ad-mobile') {
            return (
              <div key="ad-mobile" className="col-span-2 block md:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-tablet') {
            return (
              <div key="ad-tablet" className="col-span-3 hidden md:block lg:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-desktop') {
            return (
              <div key="ad-desktop" className="col-span-4 hidden lg:block">
                <BottomAd />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default AdvertList;
