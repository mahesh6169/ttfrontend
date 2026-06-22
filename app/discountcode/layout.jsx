import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const DiscountCodeLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<PromotionTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default DiscountCodeLayout;
