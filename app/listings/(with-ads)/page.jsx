import Link from 'next/link';
import ListingsClient from './ListingsClient';
import SeoFooterBlock from './SeoFooterBlock';
import { currentIndexingPolicy } from '@/utils/seo/indexingPolicy';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const listingsOgImage = process.env.NEXT_PUBLIC_LISTINGS_OG_IMAGE_URL;
const { index: shouldIndex, follow: shouldFollow } = currentIndexingPolicy();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Buyer-facing signboard (designguide/06-seo/listings.md "Landing page (/listings)").
const LANDING_TITLE = 'Indian Classifieds in Australia | Buy & Sell, Jobs, Rentals';
const LANDING_DESCRIPTION =
  'Find rooms, vehicles, home maintenance and professional services from the Indian community near you. New listings added daily.';

export const metadata = {
  // Absolute form: the listings layout's "%s | Desify" template must NOT append the brand
  // (Desify already shows in result Row 1); the whole title is free for keywords.
  title: { absolute: LANDING_TITLE },

  description: LANDING_DESCRIPTION,

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/listings`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
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
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [listingsOgImage],
  },

  // Environment indexing gate (featureplans/fix-shared-environment-indexing.md)
  robots: { index: shouldIndex, follow: shouldFollow },
};

// The default view = no filters, no location, page 1, default sort. Only then may the
// server pre-fill seed the grid (L7 guard: a filtered/paged arrival fetches client-side).
function isDefaultListingsView(sp = {}) {
  const filterKeys = ['cat', 'sub', 'state', 'adType', 'q', 'loc', 'lat', 'lng', 'communities'];
  if (filterKeys.some((k) => sp[k])) return false;
  if (sp.page && String(sp.page) !== '1') return false;
  if (sp.sort && sp.sort !== 'newest') return false;
  return true;
}

// SSR pre-fill of the default first page (newest first, 12), mirroring the events landing:
// same base URL + x-api-key header + 300s revalidate. Returns { adverts, meta } (the search
// body's .data, the shape useSearchListings yields) or null on any failure.
async function fetchDefaultListingsPage() {
  if (!API_BASE_URL) return null;
  const filters = {
    categories: [], subcategories: [], location: null, state: '',
    searchText: '', adType: null, sortBy: 'newest', communities: [],
  };
  const query = new URLSearchParams({
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page: 1, limit: 12 }),
  });
  try {
    const res = await fetch(`${API_BASE_URL}/adverts/search?${query.toString()}`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data || null;
  } catch (error) {
    console.error('Error pre-fetching listings landing:', error);
    return null;
  }
}

export default async function ListingsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  // Only the clean default view is pre-filled; a filtered/paged arrival is left to the client.
  const initialData = isDefaultListingsView(sp) ? await fetchDefaultListingsPage() : null;

  return (
    <>
      <ListingsClient
        initialData={initialData}
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
