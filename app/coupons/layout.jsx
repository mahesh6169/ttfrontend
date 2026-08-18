import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

// The landing metadata now lives on the server page (app/coupons/page.jsx) after the
// server split (featureplans/coupons-seo-landing.md). This layout keeps only the ads frame.
const DiscountCodeLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<PromotionTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default DiscountCodeLayout;
