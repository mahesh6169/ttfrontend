import ThreadTopAd from '@/components/ads/ThreadTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Threads'
  }
};

const ThreadsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<ThreadTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default ThreadsWithAdsLayout;
