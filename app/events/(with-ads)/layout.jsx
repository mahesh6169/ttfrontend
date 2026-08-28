import EventTopAd from '@/components/ads/EventTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const EventsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<EventTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default EventsWithAdsLayout;
