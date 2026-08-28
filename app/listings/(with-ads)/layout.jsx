import TopAd from '@/components/ads/TopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const ListingsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<TopAd />}>
      {children}
    </AdsFrame>
  );
};

export default ListingsWithAdsLayout;
