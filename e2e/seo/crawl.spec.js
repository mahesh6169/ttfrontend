// What a crawler sees: sitemaps, noindex on the legacy /views pages, no extra noindex on real
// detail pages, and no hover-tooltip title= strings leaking into the server HTML.
// Plans: featureplans/shared-seo-plumbing.md, featureplans/fix-shared-seo-icon-tooltips.md.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';
import { createSlugUrl } from '../../utils/slugUtils.js';

// The robots meta content for the current page, or null if there is no robots meta tag.
async function robotsContent(page) {
  const loc = page.locator('meta[name="robots"]');
  if ((await loc.count()) === 0) return null;
  return (await loc.first().getAttribute('content')) || '';
}

test('sitemaps: the index references the deals sitemap, which lists an active deal, and the static sitemap leaves out the noindex support pages', async ({ request }) => {
  const seed = readSeed();

  // The deals sitemap lists /deals/{title}-{id} for an active deal.
  const dealsRes = await request.get('/sitemap-deals.xml');
  expect(dealsRes.status()).toBe(200);
  expect(dealsRes.headers()['content-type']).toContain('xml');
  const dealsXml = await dealsRes.text();
  expect(dealsXml).toContain(`/deals/${createSlugUrl(seed.seoDealTitle, seed.seoDealId)}`);
  expect(dealsXml).toContain('<urlset');

  // The sitemap index references sitemap-deals.xml.
  const indexRes = await request.get('/sitemap.xml');
  expect(indexRes.status()).toBe(200);
  const indexXml = await indexRes.text();
  expect(indexXml).toContain('<sitemapindex');
  expect(indexXml).toContain('/sitemap-deals.xml');

  // The static sitemap does NOT contain the noindex /support pages.
  const staticRes = await request.get('/sitemap-static.xml');
  expect(staticRes.status()).toBe(200);
  const staticXml = await staticRes.text();
  expect(staticXml).not.toContain('/support/terms');
  expect(staticXml).not.toContain('/support/privacy');
  expect(staticXml).not.toContain('/support/contact');
});

// events and coupons /views pages are genuine client-rendered pages whose server layout emits
// noindex. listings / deals / threads /views/[id] were retired to server redirect() stubs (no
// noindex meta possible or needed - the redirect itself removes the duplicate).
test('legacy /views pages: events and coupons are noindex, listings, deals and threads redirect to their detail page', async ({ page }) => {
  const seed = readSeed();

  for (const url of [`/events/views/${seed.freeEventId}`, `/coupons/views/${seed.couponCampaignId}`]) {
    await page.goto(url);
    const robots = await robotsContent(page);
    expect(robots, `${url} should be noindex`).toContain('noindex');
  }

  const cases = [
    { url: `/listings/views/${seed.seoListingId}`, target: `/listings/${seed.seoListingId}` },
    { url: `/deals/views/${seed.seoDealId}`, target: `/deals/${seed.seoDealId}` },
    { url: `/threads/views/${seed.threadRichId}`, target: `/threads/${seed.threadRichId}` },
  ];
  for (const { url, target } of cases) {
    // A real browser navigation honours the stub's redirect: we must land on the detail page
    // /{vertical}/{id} and no longer be on /views.
    await page.goto(url);
    await page.waitForURL(`**${target}`, { timeout: 15_000 });
    expect(page.url(), `${url} should redirect to ${target}`).toContain(target);
    expect(page.url(), `${url} should redirect away from /views`).not.toContain('/views/');
  }
});

// Real detail (slug) pages must not carry an EXTRA noindex beyond whatever the environment already
// applies to any page (guards against the /views noindex leaking onto them). The shared test server
// noindexes every page by design, so the guard is "matches the homepage's own robots state".
test('slug detail pages in every vertical carry no extra noindex beyond the homepage', async ({ page }) => {
  const seed = readSeed();
  const slugUrls = [
    `/events/${createSlugUrl(seed.freeEventTitle, seed.freeEventId)}`,
    `/listings/${createSlugUrl(seed.seoListingTitle, seed.seoListingId)}`,
    `/deals/${createSlugUrl(seed.seoDealTitle, seed.seoDealId)}`,
    `/threads/${createSlugUrl(seed.threadRichTitle, seed.threadRichId)}`,
    `/coupons/${seed.couponCampaignSlug}`,
  ];

  await page.goto('/');
  const homeRobots = await robotsContent(page);

  for (const url of slugUrls) {
    await page.goto(url);
    const robots = await robotsContent(page);
    expect(robots, `${url} robots should match the homepage robots`).toBe(homeRobots);
  }
});

test('the server HTML has no icon tooltip title= strings; wishlist and share buttons keep their aria-labels', async ({ request }) => {
  // Homepage: no header Signin/Register/nav-link title= strings.
  const homeRes = await request.get('/');
  expect(homeRes.status()).toBe(200);
  const homeHtml = await homeRes.text();
  for (const t of ['Signin', 'Register', 'Events', 'Listings', 'Deals', 'Coupons', 'Forum', 'Home']) {
    expect(homeHtml).not.toContain(`title="${t}"`);
  }

  // /events: no event-type icon, header Messages/Menu/Signout or wishlist title= strings.
  const eventsRes = await request.get('/events');
  expect(eventsRes.status()).toBe(200);
  const eventsHtml = await eventsRes.text();
  for (const t of ['Recurring Event', 'Promotional Event', 'Paid Event', 'RSVP', 'External tickets']) {
    expect(eventsHtml).not.toContain(`title="${t}"`);
  }
  for (const t of ['Messages', 'Menu', 'Signout']) {
    expect(eventsHtml).not.toContain(`title="${t}"`);
  }
  expect(eventsHtml).not.toContain('title="Add to Wishlist"');
  expect(eventsHtml).not.toContain('title="Remove from Wishlist"');
  expect(eventsHtml).toContain('aria-label="Add to Wishlist"');

  // /listings: no Location / Follow-us or wishlist title= strings.
  const listingsRes = await request.get('/listings');
  expect(listingsRes.status()).toBe(200);
  const listingsHtml = await listingsRes.text();
  expect(listingsHtml).not.toContain('title="Location"');
  expect(listingsHtml).not.toContain('title="Follow us"');
  expect(listingsHtml).not.toContain('title="Add to Wishlist"');
  expect(listingsHtml).not.toContain('title="Remove from Wishlist"');
  expect(listingsHtml).toContain('aria-label="Add to Wishlist"');

  // /coupons: no title="Share", aria-label="Share" kept.
  const couponsRes = await request.get('/coupons');
  expect(couponsRes.status()).toBe(200);
  const couponsHtml = await couponsRes.text();
  expect(couponsHtml).not.toContain('title="Share"');
  expect(couponsHtml).toContain('aria-label="Share"');
});
