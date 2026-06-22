import TopAd from '@/components/ads/TopAd';
import AdsFrame from '@/components/layout/AdsFrame';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Daily Deals'
  }
};

const DailyDealsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<TopAd />}>
      {children}
    </AdsFrame>
  );
};

export default DailyDealsLayout;
