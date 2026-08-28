import ThreadTopAd from '@/components/ads/ThreadTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const ThreadsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<ThreadTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default ThreadsWithAdsLayout;
