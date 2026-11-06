import axios from '@/utils/axiosConfig';

// Per child sitemap: { count, lastmod } from GET /api/sitemap/summary (feature 1013), e.g.
// { listings: { count: 39, lastmod: '2026-11-03T...' }, events: { count: 0, lastmod: null }, ... }.
// Returns null if the backend cannot be reached, so callers can fall back to listing everything.
export async function fetchSitemapSummary() {
  try {
    const res = await axios.get('/sitemap/summary');
    return res?.data && typeof res.data === 'object' ? res.data : null;
  } catch (error) {
    console.error('Error fetching sitemap summary:', error?.message || error);
    return null;
  }
}

// The newest of several ISO dates (null when none).
export function newestDate(...dates) {
  const times = dates.filter(Boolean).map((d) => new Date(d).getTime()).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}
