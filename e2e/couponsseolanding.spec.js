// Plan: featureplans/coupons-seo-landing.md - AC1..AC10 (coupons signboard + server split + SSR).
import { test, expect } from '@playwright/test';

const LANDING_TITLE = 'Indian Store Coupons & Offers in Australia';
const LANDING_DESCRIPTION =
  'Save in-store with coupon offers from Indian grocery stores, food and dining, fashion, and health and wellbeing businesses near you. Show the QR code and redeem.';
const H1_TEXT = 'Indian Store Coupons & Offers Near You';
const SITE = 'http://localhost:3120';

// Count the distinct campaign detail-card links (/coupons/{slug}, id-less) in raw HTML.
// The /coupons/views/{id} legacy links do not match (a slash follows "views").
function countCouponCardLinks(html) {
  const matches = html.match(/href="\/coupons\/[a-z0-9-]+"/g) || [];
  return new Set(matches).size;
}

test('AC1 the served HTML (no JS) contains a campaign text and its /coupons/{slug} link', async ({ request }) => {
  const res = await request.get('/coupons');
  expect(res.status()).toBe(200);
  const html = await res.text();

  // 21 'E2E Landing Coupon NN' campaigns seeded; >=19 are on the default (page-1) 20 stores.
  expect(html).toContain('E2E Landing Coupon');
  expect(html).toMatch(/\/coupons\/e2e-landing-coupon-\d{2}/);
});

test('AC2 the served HTML pre-fills the full default first page of campaign cards', async ({ request }) => {
  const res = await request.get('/coupons');
  const html = await res.text();
  // Store-paginated 20/page, one campaign per store => a full first page is 20 cards.
  expect(countCouponCardLinks(html)).toBe(20);
});

test('AC3 document.title is the exact landing title with no brand', async ({ page }) => {
  await page.goto('/coupons');
  expect(await page.title()).toBe(LANDING_TITLE);
  expect(await page.title()).not.toContain('Desify');
});

test('AC4 meta description equals the locked landing text', async ({ page }) => {
  await page.goto('/coupons');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LANDING_DESCRIPTION);
});

test('AC5 the H1 text is the changed wording', async ({ page }) => {
  await page.goto('/coupons');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_TEXT);
});

test('AC6 the footer paragraph is the locked text and its store line has NO link', async ({ page }) => {
  await page.goto('/coupons');
  await expect(page.locator('body')).toContainText('QR code');
  await expect(page.locator('body')).toContainText('Adelaide');
  // The footer section carries the locked copy and contains no anchor (store line unlinked).
  const footer = page.locator('section', { hasText: 'Desify is a coupons platform for the Indian community' }).last();
  await expect(footer).toContainText('Stores can list their offers free on Desify.');
  expect(await footer.locator('a').count()).toBe(0);
});

test('AC7 arriving with a filter in the URL is NOT pre-filled with the default page (C8 guard)', async ({ request, page }) => {
  // Served HTML for a filtered arrival carries no pre-filled cards (server did not seed it).
  const res = await request.get('/coupons?state=NSW');
  const html = await res.text();
  expect(countCouponCardLinks(html)).toBe(0);

  // And in the browser the page still renders campaigns after hydration (today's client fetch).
  await page.goto('/coupons?state=NSW');
  await expect(page.locator('a[href^="/coupons/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('AC8 filters and pagination still work after hydration', async ({ page }) => {
  await page.goto('/coupons');
  const firstCard = page.locator('a[href^="/coupons/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });
  const page1Href = await firstCard.getAttribute('href');

  // Pagination (Redux-driven, no URL param): page 2 shows a different set of campaigns.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect
    .poll(async () => page.locator('a[href^="/coupons/"]').first().getAttribute('href'), { timeout: 20_000 })
    .not.toBe(page1Href);

  // Filter: open the drawer, pick VIC (no VIC stores seeded), apply - the chip shows it applied.
  await page.goto('/coupons');
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.getByRole('button', { name: 'VIC', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page.getByText('State: VIC')).toBeVisible({ timeout: 20_000 });
});

test('AC9 the default view is server-rendered with cards, not a loading skeleton', async ({ request }) => {
  const res = await request.get('/coupons');
  const html = await res.text();
  expect(countCouponCardLinks(html)).toBeGreaterThanOrEqual(12);
});

test('AC10 the canonical still points at /coupons after the metadata move', async ({ page }) => {
  await page.goto('/coupons');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe(`${SITE}/coupons`);
});
