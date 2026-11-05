// Per-page "hide from Google" rules for detail pages (feature 1013).
// A page that should stay reachable but out of search (expired / switched-off listing, ended /
// switched-off deal, switched-off event) gets noindex. It is never MORE open than the site-wide
// environment policy (utils/seo/indexingPolicy.js): staging stays noindex,nofollow everywhere.
import { currentIndexingPolicy } from './indexingPolicy.js';

// robots metadata for a detail page. indexable=true -> undefined (inherit the root layout's
// policy, as before); indexable=false -> noindex, links still followed where the policy allows.
export function detailPageRobots(indexable) {
  if (indexable) return undefined;
  const policy = currentIndexingPolicy();
  return { index: false, follow: policy.follow };
}

const isPast = (date, now) => {
  if (!date) return false;
  const t = new Date(date).getTime();
  return Number.isFinite(t) && t < now;
};

// Live listing = switched on (status 'active') and not past its expiry date.
// Same rule as the backend listings sitemap (utils/seo/sitemapFilters.js).
export function isListingIndexable(listing, now = Date.now()) {
  if (!listing) return false;
  if (listing.status && listing.status !== 'active') return false;
  return !isPast(listing.expiresAt, now);
}

// Live deal = online and its end date not before today. (An admin-killed deal, isActive false,
// already comes back 404 from the backend.) Same rule as the backend deals sitemap.
export function isDealIndexable(deal, now = Date.now()) {
  if (!deal) return false;
  if (deal.isOnline === false) return false;
  if (!deal.endDate) return true;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(deal.endDate).getTime() >= startOfToday.getTime();
}

// An event switched off by its organiser (goLive false) is hidden from search. Finished and
// cancelled events stay indexable (owner decision): finished shows an "ended" note, cancelled is
// marked EventCancelled in its structured data.
export function isEventIndexable(event) {
  if (!event) return false;
  return event.goLive !== false;
}
