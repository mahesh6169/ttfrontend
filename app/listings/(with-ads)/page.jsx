import ListingsClient from './ListingsClient';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const listingsOgImage = process.env.NEXT_PUBLIC_LISTINGS_OG_IMAGE_URL;

export const metadata = {
  // Google site title — kept short for clean sitelink display
  title: 'Classifieds',

  // Site description — unified with og:description
  description: 'Discover rentals, cars, services, businesses and more, or list your own for free.',

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
  return <ListingsClient />;
}
