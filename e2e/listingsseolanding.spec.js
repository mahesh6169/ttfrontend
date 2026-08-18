// Plan: featureplans/listings-seo-landing.md - AC1..AC9 (listings signboard + SSR pre-fill).
import { test, expect } from '@playwright/test';

const LANDING_TITLE = 'Indian Classifieds in Australia | Buy & Sell, Jobs, Rentals';
const LANDING_DESCRIPTION =
  'Find rooms, vehicles, home maintenance and professional services from the Indian community near you. New listings added daily.';
const H1_TEXT = "Australia's Indian Classifieds";

// Count the distinct listing detail-card links (/listings/{slug}-{24hex}) in raw HTML.
function countListingCardLinks(html) {
  const matches = html.match(/href="\/listings\/[^"]*-[0-9a-f]{24}"/g) || [];
  return new Set(matches).size;
}

test('AC1 the served HTML (no JS) contains a listing title and its /listings/{slug}-{id} link', async ({ request }) => {
  const res = await request.get('/listings');
  expect(res.status()).toBe(200);
  const html = await res.text();

  // The seed creates 13 'E2E Landing Listing NN' active listings; >=12 are on the default
  // page. Id-agnostic (the fetch is ISR-cached 300s): the mechanism - real title + real
  // link in the server HTML - is what matters.
  expect(html).toContain('E2E Landing Listing');
  expect(html).toMatch(/\/listings\/e2e-landing-listing-\d{2}-[0-9a-f]{24}/);
});

test('AC2 the served HTML pre-fills the full default first page of 12 cards', async ({ request }) => {
  const res = await request.get('/listings');
  const html = await res.text();
  expect(countListingCardLinks(html)).toBe(12);
});

test('AC3 document.title is the exact landing title with no brand', async ({ page }) => {
  await page.goto('/listings');
  expect(await page.title()).toBe(LANDING_TITLE);
  expect(await page.title()).not.toContain('Desify');
});

test('AC4 meta description equals the locked landing text', async ({ page }) => {
  await page.goto('/listings');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LANDING_DESCRIPTION);
});

test('AC5 the H1 text is unchanged', async ({ page }) => {
  await page.goto('/listings');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_TEXT);
});

test('AC6 the footer paragraph is the locked text and the poster phrase links to /listings/add', async ({ page }) => {
  await page.goto('/listings');
  // The paragraph is rendered twice (mobile collapsible + desktop copies), so >=1 link.
  const link = page.locator('a[href="/listings/add"]', { hasText: 'Post a listing free' });
  expect(await link.count()).toBeGreaterThanOrEqual(1);
  await expect(link.first()).toHaveAttribute('href', '/listings/add');
  await expect(page.locator('body')).toContainText('matrimony');
  await expect(page.locator('body')).toContainText('Adelaide');
});

test('AC7 arriving with a filter in the URL is NOT pre-filled with the default page (L7 guard)', async ({ request, page }) => {
  // Served HTML for a filtered arrival carries no pre-filled cards (server did not seed it).
  const res = await request.get('/listings?state=NSW');
  const html = await res.text();
  expect(countListingCardLinks(html)).toBe(0);

  // And in the browser the filtered view still renders results after hydration.
  await page.goto('/listings?state=NSW');
  await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('AC8 filters and pagination still work after hydration', async ({ page }) => {
  await page.goto('/listings');
  await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible({ timeout: 20_000 });

  // Pagination: the seed has 12+ active listings, so page 2 exists.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible({ timeout: 20_000 });

  // Filter: open the drawer, pick NSW, apply - the URL reflects the filter.
  await page.goto('/listings');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: 'NSW', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page).toHaveURL(/[?&]state=NSW/);
});

test('AC9 the default view is server-rendered with cards, not a loading skeleton', async ({ request }) => {
  // AdvertList renders EITHER its skeleton OR cards - never both. 12 card links in the
  // served HTML proves the grid rendered cards on first paint (no skeleton).
  const res = await request.get('/listings');
  const html = await res.text();
  expect(countListingCardLinks(html)).toBeGreaterThanOrEqual(12);
});
