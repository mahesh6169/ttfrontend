import PromotionTopAd from '@/components/ads/promotions/PromotionTopAd';
import AdsFrame from '@/components/layout/AdsFrame';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const couponsOgImage = process.env.NEXT_PUBLIC_COUPONS_OG_IMAGE_URL || process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE_URL;

// Applies to the /coupons landing page. Campaign detail pages (/coupons/[slug])
// override this with their own generateMetadata (title, description, canonical, OG).
export const metadata = {
  // Google site title — broad value prop
  title: 'Discover Local Coupons & Store Offers',

  // Site description — covers both browse and store-promote intent
  description: 'Find coupons and discount offers from local stores and businesses. Browse offers near you and redeem in-store, or promote your own store offers.',

  // Canonical URL for the landing page
  alternates: {
    canonical: `${siteUrl}/coupons`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; this replaces layout's OG block)
  openGraph: {
    title: 'Discover Local Coupons & Offers',
    description: 'Find coupons and discount offers from local stores near you.',
    url: `${siteUrl}/coupons`,
    siteName,
    images: [{
      url: couponsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Coupons Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Local Coupons & Offers',
    description: 'Find coupons and discount offers from local stores near you.',
    images: [couponsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

const DiscountCodeLayout = ({ children }) => {
  return (
    <AdsFrame topAd={<PromotionTopAd />}>
      {children}
    </AdsFrame>
  );
};

export default DiscountCodeLayout;
