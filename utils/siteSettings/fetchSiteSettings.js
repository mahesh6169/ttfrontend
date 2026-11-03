// Server-side read of the admin's site switches (backend GET /settings, models/platformSettingModel.js).
// Called once by app/layout.jsx. Cached for 5 minutes under the 'platform-settings' tag, which the backend
// clears (via /api/revalidate) the moment an admin saves, so a change normally shows at once.
// Any failure returns the defaults - everything shown - so a backend hiccup never hides a section.
export const DEFAULT_SITE_SETTINGS = { showDeals: true, showCoupons: true };

export async function fetchSiteSettings() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return DEFAULT_SITE_SETTINGS;
  try {
    const res = await fetch(`${base}/settings`, {
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY },
      next: { revalidate: 300, tags: ['platform-settings'] },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return DEFAULT_SITE_SETTINGS;
    const data = await res.json();
    const s = data?.settings || {};
    return {
      showDeals: s.showDeals !== false,
      showCoupons: s.showCoupons !== false,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
