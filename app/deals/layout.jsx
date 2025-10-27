import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import { META_DEFAULTS } from '@/utils/slugUtils';

export const metadata = {
  alternates: {
    canonical: `${META_DEFAULTS.siteUrl}/deals`
  }
};

const PromotionsLayout = ({ children }) => {
  return (
    <main id="Parent" className="container my-2 mx-auto">
      <StateSelector />
      <PromotionTopAd />
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

export default PromotionsLayout;
