'use client';

import DealCard from './DealCard';
import BottomAd from '@/components/ads/BottomAd';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const DealsGrid = ({ deals, dealStatus }) => {
  // Loading State
  if (
    (dealStatus === 'idle' || dealStatus === 'loading') &&
    (!deals || deals.length === 0)
  ) {
    return <PageSkeleton variant="card" rows={8} />;
  }

  // Failed State
  if (dealStatus === 'failed') {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  // No results state
  if (dealStatus === 'success' && (!deals || deals.length === 0)) {
    return <EmptyState title="No deals found" description="Try adjusting your filters or search." />;
  }

  // Calculate positions for ad insertion after 2 rows on each screen size
  // Mobile (< md): 2 cols x 2 rows = 4 items
  // MD (md to lg): 3 cols x 2 rows = 6 items
  // LG+: 4 cols x 2 rows = 8 items
  const mobileAdPosition = 4;
  const mdAdPosition = 6;
  const lgAdPosition = 8;

  // Create array with deals and ad placement
  const itemsWithAd = [];
  let adInserted = false;

  deals.forEach((deal, index) => {
    itemsWithAd.push({ type: 'deal', data: deal });

    // Insert ad after 2 rows based on screen size
    if (!adInserted) {
      if (index === mobileAdPosition - 1 && deals.length > mobileAdPosition) {
        itemsWithAd.push({ type: 'ad-mobile', data: null });
      }
      if (index === mdAdPosition - 1 && deals.length > mdAdPosition) {
        itemsWithAd.push({ type: 'ad-md', data: null });
      }
      if (index === lgAdPosition - 1 && deals.length > lgAdPosition) {
        itemsWithAd.push({ type: 'ad-lg', data: null });
        adInserted = true;
      }
    }
  });

  return (
    <div id="DealsGrid" className="min-h-[400px]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {itemsWithAd.map((item, index) => {
          if (item.type === 'deal') {
            return <DealCard key={item.data._id} deal={item.data} />;
          } else if (item.type === 'ad-mobile') {
            return (
              <div key="ad-mobile" className="col-span-2 block md:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-md') {
            return (
              <div key="ad-md" className="col-span-3 hidden md:block lg:hidden">
                <BottomAd />
              </div>
            );
          } else if (item.type === 'ad-lg') {
            return (
              <div key="ad-lg" className="col-span-4 hidden lg:block">
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

export default DealsGrid;
