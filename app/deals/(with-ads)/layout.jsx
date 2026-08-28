import TopAd from '@/components/ads/TopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const DailyDealsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<TopAd />}>
      {children}
    </AdsFrame>
  );
};

export default DailyDealsLayout;
