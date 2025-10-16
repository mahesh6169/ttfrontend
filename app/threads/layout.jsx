import ThreadTopAd from '@/components/ads/ThreadTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import { META_DEFAULTS } from '@/utils/slugUtils';

export const metadata = {
  alternates: {
    canonical: `${META_DEFAULTS.siteUrl}/threads`
  }
};

const ThreadsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container bg-white my-2 mx-auto">
      <StateSelector />
      <ThreadTopAd />
      <div className="flex gap-2">
        <LeftAd />
        <div id="Main" className="flex-1 overflow-hidden">
          {children}
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default ThreadsLayout;
