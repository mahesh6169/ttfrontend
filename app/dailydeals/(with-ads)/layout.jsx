import { Suspense } from 'react';
import TopAd from '@/components/ads/TopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';

export const metadata = {
  title: {
    template: '%s | Desify',
    default: 'Daily Deals'
  }
};

const DailyDealsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container mt-4 mb-2 mx-auto">
      <StateSelector />
      <TopAd />
      <div className="flex gap-2">
        <LeftAd />
        <div id="Main" className="flex-1">
          <Suspense>
            {children}
          </Suspense>
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default DailyDealsLayout;
