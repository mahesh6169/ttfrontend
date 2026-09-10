import EventsClient from './EventsClient';
import PastEvents from './PastEvents';
import SeoFooterBlock from './SeoFooterBlock';
import { currentIndexingPolicy } from '@/utils/seo/indexingPolicy';

const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
const eventsOgImage = process.env.NEXT_PUBLIC_EVENTS_OG_IMAGE_URL;
const { index: shouldIndex, follow: shouldFollow } = currentIndexingPolicy();
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;

// Attendee-facing signboard (designguide/06-seo/events.md "Landing page (/events)").
const LANDING_TITLE = 'Indian Events in Australia | Concerts, Shows & Festivals';
const LANDING_DESCRIPTION =
  "Find what's on for the Indian community across Australia. Browse upcoming events near you, book tickets or RSVP free - new events added every week.";

export const metadata = {
  // Absolute form: the events layout's "%s | Desify" template must NOT append the brand
  // (Desify already shows in result Row 1); the whole title is free for keywords.
  title: { absolute: LANDING_TITLE },

  description: LANDING_DESCRIPTION,

  // Canonical URL for this page
  alternates: {
    canonical: `${siteUrl}/events`,
  },

  // OpenGraph block — must be full (Next.js shallow-merges; page replaces layout's OG block)
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: `${siteUrl}/events`,
    siteName,
    images: [{
      url: eventsOgImage,
      width: 1200,
      height: 630,
      alt: 'Desify Events Image',
    }],
    locale: 'en_AU',
    type: 'website',
  },

  // Twitter — mirrors og
  twitter: {
    card: 'summary_large_image',
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [eventsOgImage],
  },

  // Environment indexing gate (featureplans/fix-shared-environment-indexing.md)
  robots: { index: shouldIndex, follow: shouldFollow },
};

// The default view = no filters, no location, page 1, default sort. Only then may the
// server pre-fill seed the grid (L7 guard: a filtered/paged arrival fetches client-side).
function isDefaultEventsView(sp = {}) {
  const filterKeys = ['cat', 'communities', 'state', 'month', 'eventType', 'q', 'loc', 'lat', 'lng'];
  if (filterKeys.some((k) => sp[k])) return false;
  if (sp.page && String(sp.page) !== '1') return false;
  if (sp.sort && sp.sort !== 'date') return false;
  return true;
}

// SSR pre-fill of the default first page (soonest first, 12), mirroring the homepage's
// server fetch: same base URL + x-api-key header + 300s revalidate. Returns { events, meta }
// or null on any failure (the client then fetches as usual).
async function fetchDefaultEventsPage() {
  if (!API_BASE_URL) return null;
  const filters = {
    categories: [], communities: [], state: '', month: '', eventType: '',
    searchText: '', sortBy: 'date', location: null,
  };
  const query = new URLSearchParams({
    filters: JSON.stringify(filters),
    pagination: JSON.stringify({ page: 1, limit: 12 }),
  });
  try {
    const res = await fetch(`${API_BASE_URL}/events/search?${query.toString()}`, {
      headers: { 'x-api-key': API_KEY },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error pre-fetching events landing:', error);
    return null;
  }
}

export default async function EventsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  // Only the clean default view is pre-filled; a filtered/paged arrival is left to the client.
  const initialData = isDefaultEventsView(sp) ? await fetchDefaultEventsPage() : null;

  return (
    <>
      <EventsClient
        initialData={initialData}
        heading={
          <div className="border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
            <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
              Discover Indian Events, Concerts &amp; Cultural Shows
            </h1>
          </div>
        }
      />
      <PastEvents />
      <SeoFooterBlock />
    </>
  );
}
