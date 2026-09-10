// Public organiser page /events/by/{slug} - see featureplans/events-organiser-share-meta.md
// (and the original page: featureplans/events-by-organiser.md).
// Thin server component: reads the slug and renders the client body. Public, no login.
// generateMetadata emits an Open Graph share card from the organiser's optional share fields,
// mirroring the event page's generateMetadata (app/events/(with-ads)/[slug]/page.jsx).
import { META_DEFAULTS } from '@/utils/slugUtils';
import { currentIndexingPolicy } from '@/utils/seo/indexingPolicy';
import OrganiserEventsClient from './OrganiserEventsClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const siteUrl = META_DEFAULTS.siteUrl;

// Make a possibly-relative image path absolute against the site URL (mirrors the event page).
function absoluteImage(image) {
  if (!image) return `${siteUrl}${META_DEFAULTS.defaultImage}`;
  if (image.startsWith('http')) return image;
  return image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const canonical = `${siteUrl}/events/by/${slug}`;

  // Defaults used when the organiser has not set the matching share field (D5). organiserName is
  // resolved by the endpoint; fall back to a neutral label if the fetch fails.
  let organiserName = 'this organiser';
  let shareTitle = '';
  let shareDescription = '';
  let shareImage = '';

  try {
    if (API_BASE_URL) {
      // /events/by/{slug} is behind the API-key gate (enforce mode), so the SSR fetch must send the
      // same x-api-key the browser client attaches (utils/axiosConfig.js).
      // Always fresh: the organiser share fields are hand-set directly in Mongo (no admin UI, so no
      // revalidateTag hook to clear a cache), so caching would leave the share card stale. The share
      // card is scraped rarely, so an uncached fetch per scrape is cheap. The ?v= on shared links
      // handles the social platform's own cache.
      const apiKey = process.env.NEXT_PUBLIC_FRONTEND_API_KEY;
      const res = await fetch(`${API_BASE_URL}/events/by/${slug}`, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        organiserName = data.organiserName || organiserName;
        shareTitle = data.organiserShareTitle || '';
        shareDescription = data.organiserShareDescription || '';
        shareImage = data.organiserShareImage || '';
      }
    }
  } catch (error) {
    console.error('Error fetching organiser for share meta:', error);
  }

  const title = shareTitle || `Events by ${organiserName}`;
  const description =
    shareDescription || `Book upcoming events by ${organiserName} on Desify!!`;
  const image = absoluteImage(shareImage);

  const { index: shouldIndex, follow: shouldFollow } = currentIndexingPolicy();

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: shouldIndex, follow: shouldFollow },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: META_DEFAULTS.siteName,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'en_AU',
      type: 'website',
    },
  };
}

export default async function OrganiserEventsPage({ params }) {
  const { slug } = await params;
  return <OrganiserEventsClient slug={slug} />;
}
