'use client';

// import TopAd from '@/components/ads/TopAd';
import EventTopAd from '@/components/ads/EventTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import { usePathname } from 'next/navigation';

const EventsLayout = ({ children }) => {
  const pathname = usePathname();
  
  // List of pages where ads should NOT show
  const noAdPages = ['/events/sell', '/events/add-paid'];
  const shouldHideAds = noAdPages.includes(pathname);

  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <StateSelector />
      {!shouldHideAds && <EventTopAd />}
      <div className="flex gap-2">
        {!shouldHideAds && <LeftAd />}
        <div id="Main" className="flex-1 overflow-hidden">
          {children}
        </div>
        {!shouldHideAds && <RightAd />}
      </div>
      <Footer />
    </main>
  );
};

export default EventsLayout;
