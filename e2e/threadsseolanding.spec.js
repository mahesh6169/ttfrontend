// Plan: featureplans/threads-seo-landing.md - AC1..AC9 (threads signboard + SSR pre-fill).
import { test, expect } from '@playwright/test';

const LANDING_TITLE = 'Indian Community Forum Australia | Ask, Share & Discuss';
const LANDING_DESCRIPTION =
  'Get answers from the Indian community in Australia on visas, careers, money, health and everyday life. Ask a question or join a discussion free.';
const H1_TEXT = 'Indian Community Forum: Ask, Share & Discuss';

// Count the distinct thread detail-card links (/threads/{slug}-{24hex}) in raw HTML.
function countThreadCardLinks(html) {
  const matches = html.match(/href="\/threads\/[^"]*-[0-9a-f]{24}"/g) || [];
  return new Set(matches).size;
}

test('AC1 the served HTML (no JS) contains a thread title and its /threads/{slug}-{id} link', async ({ request }) => {
  const res = await request.get('/threads');
  expect(res.status()).toBe(200);
  const html = await res.text();

  // The seed creates 13 'E2E Landing Thread NN' threads; >=12 are on the default page.
  // Id-agnostic (the fetch is ISR-cached 300s): real title + real link in the server HTML.
  expect(html).toContain('E2E Landing Thread');
  expect(html).toMatch(/\/threads\/e2e-landing-thread-\d{2}-[0-9a-f]{24}/);
});

test('AC2 the served HTML pre-fills the full default first page of 12 cards', async ({ request }) => {
  const res = await request.get('/threads');
  const html = await res.text();
  expect(countThreadCardLinks(html)).toBe(12);
});

test('AC3 document.title is the exact landing title with no brand', async ({ page }) => {
  await page.goto('/threads');
  expect(await page.title()).toBe(LANDING_TITLE);
  expect(await page.title()).not.toContain('Desify');
});

test('AC4 meta description equals the locked landing text', async ({ page }) => {
  await page.goto('/threads');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LANDING_DESCRIPTION);
});

test('AC5 the H1 text is unchanged', async ({ page }) => {
  await page.goto('/threads');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_TEXT);
});

test('AC6 the footer paragraph is the locked text and the discussion phrase links to /threads/new', async ({ page }) => {
  await page.goto('/threads');
  // The paragraph is rendered twice (mobile collapsible + desktop copies), so >=1 link.
  const link = page.locator('a[href="/threads/new"]', { hasText: 'start your own discussion free' });
  expect(await link.count()).toBeGreaterThanOrEqual(1);
  await expect(link.first()).toHaveAttribute('href', '/threads/new');
  await expect(page.locator('body')).toContainText('migration');
  await expect(page.locator('body')).toContainText('devotional');
});

test('AC7 arriving with a filter in the URL is NOT pre-filled with the default page (T7 guard)', async ({ request, page }) => {
  // Served HTML for a filtered arrival carries no pre-filled cards (server did not seed it).
  const res = await request.get('/threads?state=NSW');
  const html = await res.text();
  expect(countThreadCardLinks(html)).toBe(0);

  // And in the browser the filtered view still renders results after hydration.
  await page.goto('/threads?state=NSW');
  await expect(page.locator('a[href^="/threads/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('AC8 filters and pagination still work after hydration', async ({ page }) => {
  await page.goto('/threads');
  await expect(page.locator('a[href^="/threads/"]').first()).toBeVisible({ timeout: 20_000 });

  // Pagination: the seed has 12+ threads, so page 2 exists.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.locator('a[href^="/threads/"]').first()).toBeVisible({ timeout: 20_000 });

  // Filter: open the drawer, pick NSW, apply - the URL reflects the filter.
  await page.goto('/threads');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: 'NSW', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page).toHaveURL(/[?&]state=NSW/);
});

test('AC9 the default view is server-rendered with cards, not a loading skeleton', async ({ request }) => {
  // ThreadsClient renders EITHER a skeleton OR the thread cards - never both. 12 card links
  // in the served HTML proves the grid rendered cards on first paint (no skeleton).
  const res = await request.get('/threads');
  const html = await res.text();
  expect(countThreadCardLinks(html)).toBeGreaterThanOrEqual(12);
});
