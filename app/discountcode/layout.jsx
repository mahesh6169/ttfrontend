import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import LeftAd from '@/components/ads/LeftAd';
import RightAd from '@/components/ads/RightAd';
import Footer from '@/components/Footer';
import StateSelector from '@/components/ads/StateSelector';

const DiscountCodeLayout = ({ children }) => {
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

export default DiscountCodeLayout;
