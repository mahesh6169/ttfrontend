import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';
import AdsContentShell from '@/components/layout/AdsContentShell';

const DiscountCodeLayout = ({ children }) => {
  return (
    <main id="Parent" className="container mb-2 mx-auto md:flex md:flex-col md:min-h-[calc(100vh-5rem)]">
      <StateSelector />
      <PromotionTopAd />
      <div className="flex gap-2 md:flex-1">
        <LeftAd />
        <div id="Main" className="flex-1 overflow-hidden">
          <AdsContentShell>{children}</AdsContentShell>
        </div>
        <RightAd />
      </div>
      <Footer />
    </main>
  );
};

export default DiscountCodeLayout;
