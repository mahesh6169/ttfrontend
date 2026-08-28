import CouponsClient from './CouponsClient';
import SeoFooterBlock from './SeoFooterBlock';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const couponsOgImage = process.env.NEXT_PUBLIC_COUPONS_OG_IMAGE_URL || process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Shopper-facing signboard (designguide/06-seo/coupons.md "Landing page (/coupons)").
// This metadata moved off layout.jsx as part of the server split.
const LANDING_TITLE = 'Discover In-Store Coupons From Local Businesses Near You';
const LANDING_DESCRIPTION =
  'Browse coupons from restaurants, grocery stores, fashion, beauty and wellbeing businesses near you. Show the QR code in-store and save.';

export const metadata = {
  // Absolute form: the coupons layout's title template must NOT append the brand
  // (Desify already shows in result Row 1); the whole title is free for keywords.
  title: { absolute: LANDING_TITLE },

  description: LANDING_DESCRIPTION,

  // Canonical URL for this page (kept on /coupons through the metadata move - AC10).
  alternates: {
    canonical: `${siteUrl}/coupons`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; this replaces layout's OG block)
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
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
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [couponsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

// The default view = no filters, no location, page 1, default sort. Only then may the
// server pre-fill seed the grid (C8 guard: a filtered/paged arrival fetches client-side).
function isDefaultCouponsView(sp = {}) {
  const filterKeys = ['category', 'subcategory', 'state', 'searchText', 'loc', 'lat', 'lng'];
  if (filterKeys.some((k) => sp[k])) return false;
  if (sp.page && String(sp.page) !== '1') return false;
  if (sp.sort && sp.sort !== 'latest') return false;
  return true;
}

// SSR pre-fill of the default first page, replicating the searchCoupons thunk: fetch the first
// page of active stores, then their active campaigns, flatten + attach store + sort newest-first.
// Same base URL + x-api-key + 300s revalidate as the other landings. Returns { campaigns, meta }
// or null on any failure (the client then fetches as usual).
async function fetchDefaultCouponsPage() {
  if (!API_BASE_URL) return null;
  const headers = { 'x-api-key': API_KEY };
  const opts = { headers, next: { revalidate: 300 } };
  try {
    const storesRes = await fetch(`${API_BASE_URL}/coupons/stores?page=1&limit=20`, opts);
    if (!storesRes.ok) return null;
    const storesBody = await storesRes.json();
    const stores = storesBody.stores || [];

    const campaignBodies = await Promise.all(
      stores.map((s) =>
        fetch(`${API_BASE_URL}/coupons/stores/${s._id}/campaigns`, opts)
          .then((r) => (r.ok ? r.json() : { campaigns: [] }))
          .catch(() => ({ campaigns: [] }))
      )
    );

    const campaigns = campaignBodies.flatMap((body, i) =>
      (body.campaigns || []).map((c) => ({ ...c, store: stores[i] }))
    );
    // Default sort is "Latest" (newest added first), matching the slice.
    campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      campaigns,
      meta: {
        totalCount: storesBody.totalCount || 0,
        totalPages: storesBody.totalPages || 1,
        currentPage: storesBody.currentPage || 1,
      },
    };
  } catch (error) {
    console.error('Error pre-fetching coupons landing:', error);
    return null;
  }
}

export default async function DiscountCodePage({ searchParams }) {
  const sp = (await searchParams) || {};
  // Only the clean default view is pre-filled; a filtered/paged arrival is left to the client.
  const initialData = isDefaultCouponsView(sp) ? await fetchDefaultCouponsPage() : null;

  return (
    <>
      <CouponsClient
        initialData={initialData}
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Indian Store Coupons &amp; Offers Near You
            </h1>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
