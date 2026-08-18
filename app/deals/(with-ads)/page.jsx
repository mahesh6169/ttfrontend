import Link from 'next/link';
import DailyDealsClient from './DailyDealsClient';
import SeoFooterBlock from './SeoFooterBlock';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const dealsOgImage = process.env.NEXT_PUBLIC_DEALS_OG_IMAGE_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Shopper-facing signboard (designguide/06-seo/deals.md "Landing page (/deals)").
const LANDING_TITLE = 'Indian Deals, Discounts & Offers in Australia';
const LANDING_DESCRIPTION =
  'Find special offers from businesses serving the Indian community - restaurants, groceries, fashion, jewellery, beauty, entertainment, classes and more.';

export const metadata = {
  // Absolute form: the deals layout's "%s | Desify" template must NOT append the brand
  // (Desify already shows in result Row 1); the whole title is free for keywords.
  title: { absolute: LANDING_TITLE },

  description: LANDING_DESCRIPTION,

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/deals`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: `${siteUrl}/deals`,
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
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [dealsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

// The default view = no filters, no location, page 1, default sort. Only then may the
// server pre-fill seed the grid (D7 guard: a filtered/paged arrival fetches client-side).
function isDefaultDealsView(sp = {}) {
  const filterKeys = ['cat', 'subcat', 'state', 'day', 'q', 'partnerstoreId', 'loc', 'lat', 'lng'];
  if (filterKeys.some((k) => sp[k])) return false;
  if (sp.page && String(sp.page) !== '1') return false;
  if (sp.sort && sp.sort !== 'newest') return false;
  return true;
}

// SSR pre-fill of the default first page (newest first, 12), mirroring the shipped landings:
// same base URL + x-api-key header + 300s revalidate. The deals API is /dailydeals (query-param
// style, not JSON). Returns the browse body { deals, totalPages, currentPage, ... } - the shape
// useSearchDeals yields - or null on any failure.
async function fetchDefaultDealsPage() {
  if (!API_BASE_URL) return null;
  const query = new URLSearchParams({ sortBy: 'newest', page: '1', limit: '12' });
  try {
    const res = await fetch(`${API_BASE_URL}/dailydeals?${query.toString()}`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error pre-fetching deals landing:', error);
    return null;
  }
}

export default async function DailyDealsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  // Only the clean default view is pre-filled; a filtered/paged arrival is left to the client.
  const initialData = isDefaultDealsView(sp) ? await fetchDefaultDealsPage() : null;

  return (
    <>
      <DailyDealsClient
        initialData={initialData}
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Discover Indian Deals, Discounts &amp; Special Offers
            </h1>
            <Link
              href="/users/profile/deals"
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
