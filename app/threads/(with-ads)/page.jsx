import Link from 'next/link';
import ThreadsClient from './ThreadsClient';
import SeoFooterBlock from './SeoFooterBlock';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const threadsOgImage = process.env.NEXT_PUBLIC_THREADS_OG_IMAGE_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Asker/reader-facing signboard (designguide/06-seo/threads.md "Landing page (/threads)").
const LANDING_TITLE = 'Indian Community Forum Australia | Ask, Share & Discuss';
const LANDING_DESCRIPTION =
  'Get answers from the Indian community in Australia on visas, careers, money, health and everyday life. Ask a question or join a discussion free.';

export const metadata = {
  // Absolute form: the threads layout's "%s | Desify" template must NOT append the brand
  // (Desify already shows in result Row 1); the whole title is free for keywords.
  title: { absolute: LANDING_TITLE },

  description: LANDING_DESCRIPTION,

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/threads`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: `${siteUrl}/threads`,
    siteName,
    images: [{
      url: threadsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Forum Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [threadsOgImage],
  },

  // Explicit robots (also the inherited default)
  robots: { index: true, follow: true },
};

// The default view = no filters, no location, page 1, default sort. Only then may the
// server pre-fill seed the grid (T7 guard: a filtered/paged arrival fetches client-side).
function isDefaultThreadsView(sp = {}) {
  const filterKeys = ['cat', 'communities', 'state', 'q', 'loc', 'lat', 'lng'];
  if (filterKeys.some((k) => sp[k])) return false;
  if (sp.page && String(sp.page) !== '1') return false;
  if (sp.sort && sp.sort !== 'newest') return false;
  return true;
}

// SSR pre-fill of the default first page (newest first, 12), mirroring the events landing:
// same base URL + x-api-key header + 300s revalidate. Returns { threads, meta } (the search
// body's .data, the shape useSearchThreads yields) or null on any failure.
async function fetchDefaultThreadsPage() {
  if (!API_BASE_URL) return null;
  const filters = {
    categories: [], communities: [], state: '',
    searchText: '', sortBy: 'newest', location: null,
  };
  const query = new URLSearchParams({
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page: 1, limit: 12 }),
  });
  try {
    const res = await fetch(`${API_BASE_URL}/threads/search?${query.toString()}`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data || null;
  } catch (error) {
    console.error('Error pre-fetching threads landing:', error);
    return null;
  }
}

export default async function ThreadsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  // Only the clean default view is pre-filled; a filtered/paged arrival is left to the client.
  const initialData = isDefaultThreadsView(sp) ? await fetchDefaultThreadsPage() : null;

  return (
    <>
      <ThreadsClient
        initialData={initialData}
        heading={
          <div className="flex items-center justify-center gap-x-3 sm:gap-x-4 border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Indian Community Forum: Ask, Share &amp; Discuss
            </h1>
            <Link
              href="/threads/new"
              className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-2.5 px-5 rounded-lg shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
            >
              + Create a Topic
            </Link>
          </div>
        }
      />
      <SeoFooterBlock />
    </>
  );
}
