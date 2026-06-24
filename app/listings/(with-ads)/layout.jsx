import TopAd from '@/components/ads/TopAd';
import AdsFrame from '@/components/layout/AdsFrame';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Listings'
  }
};

const ListingsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<TopAd />}>
      {children}
    </AdsFrame>
  );
};

export default ListingsWithAdsLayout;
