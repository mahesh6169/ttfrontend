// Plan: featureplans/shared-seo-plumbing.md - AC2..AC6 (sitemaps + /views noindex).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';
import { createSlugUrl } from '../utils/slugUtils.js';

// The robots meta content for the current page, or null if there is no robots meta tag.
async function robotsContent(page) {
  const loc = page.locator('meta[name="robots"]');
  if ((await loc.count()) === 0) return null;
  return (await loc.first().getAttribute('content')) || '';
}

test('AC2 GET /sitemap-deals.xml lists a /deals/{title}-{id} URL for an active deal', async ({ page }) => {
  const seed = readSeed();
  const res = await page.request.get('/sitemap-deals.xml');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('xml');

  const xml = await res.text();
  const expectedSlug = createSlugUrl(seed.seoDealTitle, seed.seoDealId);
  expect(xml).toContain(`/deals/${expectedSlug}`);
  expect(xml).toContain('<urlset');
});

test('AC3 GET /sitemap.xml (the index) references sitemap-deals.xml', async ({ page }) => {
  const res = await page.request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain('<sitemapindex');
  expect(xml).toContain('/sitemap-deals.xml');
});

test('AC4 GET /sitemap-static.xml does NOT contain the noindex /support pages', async ({ page }) => {
  const res = await page.request.get('/sitemap-static.xml');
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).not.toContain('/support/terms');
  expect(xml).not.toContain('/support/privacy');
  expect(xml).not.toContain('/support/contact');
});

// AC5 - legacy /views detail pages carry a noindex robots meta tag.
// events and coupons are genuine client-rendered /views pages: the noindex is emitted from the
// server layout added by this job.
test('AC5 the events /views detail page is noindex', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);
  const robots = await robotsContent(page);
  expect(robots).toContain('noindex');
});

test('AC5 the coupons /views detail page is noindex', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/coupons/views/${seed.couponCampaignId}`);
  const robots = await robotsContent(page);
  expect(robots).toContain('noindex');
});

// AC7 - listings / deals / threads /views/[id] were already retired to server redirect() stubs
// (no noindex meta possible or needed - the redirect itself removes the duplicate). Prove each one
// responds with a redirect to its detail page /{vertical}/{id}. (Resolved via planneragentsignoff Q1.)
test('AC7 the listings/deals/threads /views pages redirect to their detail page', async ({ page }) => {
  const seed = readSeed();
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

// AC6 - real detail (slug) pages must NOT carry noindex (guards against the noindex leaking onto
// pages we want indexed).
test('AC6 the slug detail pages are NOT noindex in each vertical', async ({ page }) => {
  const seed = readSeed();
  const slugUrls = [
    `/events/${createSlugUrl(seed.freeEventTitle, seed.freeEventId)}`,
    `/listings/${createSlugUrl(seed.seoListingTitle, seed.seoListingId)}`,
    `/deals/${createSlugUrl(seed.seoDealTitle, seed.seoDealId)}`,
    `/threads/${createSlugUrl(seed.threadRichTitle, seed.threadRichId)}`,
    `/coupons/${seed.couponCampaignSlug}`,
  ];

  for (const url of slugUrls) {
    await page.goto(url);
    const robots = await robotsContent(page);
    expect(robots === null || !robots.includes('noindex'), `${url} should not be noindex`).toBe(true);
  }
});
