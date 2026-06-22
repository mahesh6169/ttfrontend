import EventTopAd from '@/components/ads/EventTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Events'
  }
};

const EventsWithAdsLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<EventTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default EventsWithAdsLayout;
