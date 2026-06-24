import Link from 'next/link';
import DailyDealsClient from './DailyDealsClient';
import SeoFooterBlock from './SeoFooterBlock';

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
  return (
    <>
      <DailyDealsClient
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Discover Indian Deals, Discounts &amp; Special Offers
            </h1>
            <Link
              href="/users/profile/dailydeals"
              className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
            >
              + Create Deal
            </Link>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
