// featureplans/fix-shared-seo-metadata.md
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// AC1-AC5, AC10: fetch via request (SSR HTML); AC6-AC9: browser page navigation.

// ---- helpers ----

// Simple slug: lowercased words joined by dashes (mirrors generateSlug for ASCII titles).
const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Read <title> and meta description from raw SSR HTML.
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

async function rawMeta(request, path) {
  const res = await request.get(path);
  expect(res.status()).toBe(200);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  return {
    title: titleMatch ? decodeEntities(titleMatch[1]) : '',
    description: descMatch ? decodeEntities(descMatch[1]) : '',
  };
}

// Navigate and read via page object (needed for client-rendered title updates).
async function pageMeta(page, path) {
  await page.goto(path);
  const title = await page.title();
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  return { title, description: desc || '' };
}

// ---- AC1: events detail has no "| Desify" ----
test('AC1 events detail title has no "| Desify" double-brand', async ({ page }) => {
  const seed = readSeed();
  const { title } = await pageMeta(page, `/events/${seed.seoFreeEventId}`);
  expect(title).not.toContain('| Desify');
  expect(title).not.toContain('- Desify - Desify');
});

// ---- AC2: listings detail title = listing title, no brand ----
test('AC2 listings detail title equals the listing title with no brand suffix', async ({ page }) => {
  const seed = readSeed();
  const url = `/listings/${slug(seed.seoListingTitle)}-${seed.seoListingId}`;
  const { title } = await pageMeta(page, url);
  expect(title).toBe(seed.seoListingTitle);
  expect(title).not.toContain('Desify');
});

// ---- AC3: threads detail title = thread title, description from question ----
test('AC3 threads detail title equals the thread title; description from question not the old CTA', async ({ page }) => {
  const seed = readSeed();
  const url = `/threads/${slug('E2E Legacy Thread')}-${seed.threadLegacyId}`;
  const { title, description } = await pageMeta(page, url);
  expect(title).toBe('E2E Legacy Thread');
  expect(description).not.toBe('Join the conversation now!');
  expect(description.length).toBeGreaterThan(0);
});

// ---- AC4: deals detail title = deal title; description contains "Valid until" ----
test('AC4 deals detail title equals the deal title; description contains "Valid until" and business name', async ({ page }) => {
  const seed = readSeed();
  const url = `/deals/${slug(seed.seoDealTitle)}-${seed.seoDealId}`;
  const { title, description } = await pageMeta(page, url);
  expect(title).toBe(seed.seoDealTitle);
  expect(description).toContain('Valid until');
  expect(description).toContain('E2E SEO Deals Store');
});

// ---- AC5: coupons detail title contains storeName (M3); description contains "Valid until" and "Show QR code" ----
test('AC5 coupons detail title contains storeName; description contains "Valid until" and "Show QR code"', async ({ page }) => {
  const { title, description } = await pageMeta(page, '/coupons/e2e-coupon-campaign');
  expect(title).toContain('E2E Coupon Store');
  expect(description).toContain('Valid until');
  expect(description).toContain('Show QR code');
});

// ---- AC6: events detail with body description >= 5 words uses body, not CTA ----
test('AC6 events detail with body description uses it, not the Free-RSVP/Get-tickets CTA', async ({ page }) => {
  const seed = readSeed();
  // seoFreeEvent has factory description "A seeded event for automated tests." (7 words)
  const { description } = await pageMeta(page, `/events/${seed.seoFreeEventId}`);
  expect(description).not.toContain('Free RSVP');
  expect(description).not.toContain('Get tickets');
  expect(description.length).toBeGreaterThan(0);
});

// ---- AC7: events detail with no description and isPaid=false -> Level 3 CTA ----
test('AC7 events detail with no description and isPaid=false gives "Register at Desify!!"', async ({ page }) => {
  const seed = readSeed();
  const { description } = await pageMeta(page, `/events/${seed.seoNoDescEventId}`);
  expect(description).toBe('Register at Desify!!');
});

// ---- AC8: /deals landing title and description match M11 ----
test('AC8 /deals landing title and description match M11 values', async ({ request }) => {
  const { title, description } = await rawMeta(request, '/deals');
  expect(title).toBe('Find Local Deals, Discounts & Offers Near You');
  expect(description).toBe(
    'Browse deals from local businesses near you - food, groceries, fashion, jewellery, beauty, classes and more. Find an offer and save today.'
  );
});

// ---- AC9: /coupons landing title and description match M12 ----
test('AC9 /coupons landing title and description match M12 values', async ({ request }) => {
  const { title, description } = await rawMeta(request, '/coupons');
  expect(title).toBe('Discover In-Store Coupons From Local Businesses Near You');
  expect(description).toBe(
    'Browse coupons from restaurants, grocery stores, fashion, beauty and wellbeing businesses near you. Show the QR code in-store and save.'
  );
});

// ---- AC10: all five detail pages have no "| Desify" in title ----
test('AC10 detail pages for all five verticals have no "| Desify" in title', async ({ page }) => {
  const seed = readSeed();
  const urls = [
    `/events/${seed.seoFreeEventId}`,
    `/listings/${slug(seed.seoListingTitle)}-${seed.seoListingId}`,
    `/threads/${slug('E2E Legacy Thread')}-${seed.threadLegacyId}`,
    `/deals/${slug(seed.seoDealTitle)}-${seed.seoDealId}`,
    `/coupons/e2e-coupon-campaign`,
  ];
  for (const url of urls) {
    const { title } = await pageMeta(page, url);
    expect(title, `page ${url} title "${title}" contains "| Desify"`).not.toContain('| Desify');
  }
});
