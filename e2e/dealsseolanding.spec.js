// Plan: featureplans/deals-seo-landing.md - AC1..AC9 (deals signboard + SSR pre-fill).
import { test, expect } from '@playwright/test';

const LANDING_TITLE = 'Indian Deals, Discounts & Offers in Australia';
const LANDING_DESCRIPTION =
  'Find special offers from businesses serving the Indian community - restaurants, groceries, fashion, jewellery, beauty, entertainment, classes and more.';
const H1_TEXT = 'Discover Indian Deals, Discounts & Special Offers';

// Count the distinct deal detail-card links (/deals/{slug}-{24hex}) in raw HTML.
function countDealCardLinks(html) {
  const matches = html.match(/href="\/deals\/[^"]*-[0-9a-f]{24}"/g) || [];
  return new Set(matches).size;
}

test('AC1 the served HTML (no JS) contains a deal title and its /deals/{slug}-{id} link', async ({ request }) => {
  const res = await request.get('/deals');
  expect(res.status()).toBe(200);
  const html = await res.text();

  // The seed creates 13 'E2E Landing Deal NN' active deals; >=12 are on the default page.
  // Id-agnostic (the fetch is ISR-cached 300s): real title + real link in the server HTML.
  expect(html).toContain('E2E Landing Deal');
  expect(html).toMatch(/\/deals\/e2e-landing-deal-\d{2}-[0-9a-f]{24}/);
});

test('AC2 the served HTML pre-fills the full default first page of 12 cards', async ({ request }) => {
  const res = await request.get('/deals');
  const html = await res.text();
  expect(countDealCardLinks(html)).toBe(12);
});

test('AC3 document.title is the exact landing title with no brand', async ({ page }) => {
  await page.goto('/deals');
  expect(await page.title()).toBe(LANDING_TITLE);
  expect(await page.title()).not.toContain('Desify');
});

test('AC4 meta description equals the locked landing text', async ({ page }) => {
  await page.goto('/deals');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LANDING_DESCRIPTION);
});

test('AC5 the H1 text is unchanged', async ({ page }) => {
  await page.goto('/deals');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_TEXT);
});

test('AC6 the footer paragraph is the locked text and the business phrase links to /users/profile/deals', async ({ page }) => {
  await page.goto('/deals');
  // The paragraph is rendered twice (mobile collapsible + desktop copies), so >=1 link.
  const link = page.locator('a[href="/users/profile/deals"]', { hasText: 'Businesses can post their deals free' });
  expect(await link.count()).toBeGreaterThanOrEqual(1);
  await expect(link.first()).toHaveAttribute('href', '/users/profile/deals');
  await expect(page.locator('body')).toContainText('jewellery');
  await expect(page.locator('body')).toContainText('Adelaide');
});

test('AC7 arriving with a filter in the URL is NOT pre-filled with the default page (D7 guard)', async ({ request, page }) => {
  // Served HTML for a filtered arrival carries no pre-filled cards (server did not seed it).
  const res = await request.get('/deals?state=NSW');
  const html = await res.text();
  expect(countDealCardLinks(html)).toBe(0);

  // And in the browser the filtered view still renders results after hydration.
  await page.goto('/deals?state=NSW');
  await expect(page.locator('a[href^="/deals/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('AC8 filters and pagination still work after hydration', async ({ page }) => {
  await page.goto('/deals');
  await expect(page.locator('a[href^="/deals/"]').first()).toBeVisible({ timeout: 20_000 });

  // Pagination: the seed has 12+ active deals, so page 2 exists.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.locator('a[href^="/deals/"]').first()).toBeVisible({ timeout: 20_000 });

  // Filter: open the drawer, pick NSW, apply - the URL reflects the filter.
  await page.goto('/deals');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: 'NSW', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page).toHaveURL(/[?&]state=NSW/);
});

test('AC9 the default view is server-rendered with cards, not a loading skeleton', async ({ request }) => {
  // DealsGrid renders EITHER its skeleton OR cards - never both. 12 card links in the
  // served HTML proves the grid rendered cards on first paint (no skeleton).
  const res = await request.get('/deals');
  const html = await res.text();
  expect(countDealCardLinks(html)).toBeGreaterThanOrEqual(12);
});
