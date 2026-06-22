import Link from 'next/link';
import ListingsClient from './ListingsClient';
import SeoFooterBlock from './SeoFooterBlock';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const listingsOgImage = process.env.NEXT_PUBLIC_LISTINGS_OG_IMAGE_URL;

export const metadata = {
  // Google site title — kept short for clean sitelink display
  title: 'Classifieds',

  // Site description
  description: 'Indian classifieds Australia for rentals, cars, services and businesses. Discover local listings or post your own for free and get discovered locally.',

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/listings`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: `Australia's Indian Classifieds`,
    description: 'Discover rentals, cars, services, businesses and more, or list your own for free.',
    url: `${siteUrl}/listings`,
    siteName,
    images: [{
      url: listingsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Listing Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: `Australia's Indian Classifieds`,
    description: 'Discover rentals, cars, services, businesses and more, or list your own for free.',
    images: [listingsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

export default function ListingsPage() {
  return (
    <>
      <ListingsClient
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Australia&apos;s Indian Classifieds
            </h1>
            <Link
              href="/listings/add"
              className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
            >
              + Create Listing
            </Link>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
