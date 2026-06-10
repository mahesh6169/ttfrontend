import DailyDealsClient from './DailyDealsClient';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const dealsOgImage = process.env.NEXT_PUBLIC_DEALS_OG_IMAGE_URL;

export const metadata = {
  // Google site title — broad value prop
  title: 'Discover Local Deals & Special Offers',

  // Site description — covers both browse and post intent
  description: 'Find deals, discounts and special offers from local businesses and services. Promote your own deals and reach more customers.',

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/dailydeals`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: 'Discover Local Deals & Offers',
    description: 'Find deals and special offers from local businesses and services.',
    url: `${siteUrl}/dailydeals`,
    siteName,
    images: [{
      url: dealsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Deals Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Local Deals & Offers',
    description: 'Find deals and special offers from local businesses and services.',
    images: [dealsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

export default function DailyDealsPage() {
  return <DailyDealsClient />;
}
