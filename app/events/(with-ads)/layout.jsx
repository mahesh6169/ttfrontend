import { Suspense } from 'react';
import EventTopAd from '@/components/ads/EventTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import AdsContentShell from '@/components/layout/AdsContentShell';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Events'
  }
};

const EventsWithAdsLayout = ({ children }) => {
  return (
    // Desktop: make the layout a flex column at least as tall as the viewport
    // (minus the fixed header reserved in root layout's md:pt-14 plus our mt/mb),
    // and let the ads-and-content row grow so the Footer is pushed to the
    // bottom even on pages with short content (e.g. loading state).
    // Mobile uses BottomNavigation as the bottom anchor and stays as-is.
    <main id="Parent" className="container mb-2 mx-auto md:flex md:flex-col md:min-h-[calc(100vh-5rem)]">
      <StateSelector />
      <EventTopAd />
      <div className="flex gap-2 md:flex-1">
        <LeftAd />
        <div id="Main" className="flex-1">
          <Suspense>
            <AdsContentShell>{children}</AdsContentShell>
          </Suspense>
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default EventsWithAdsLayout;
