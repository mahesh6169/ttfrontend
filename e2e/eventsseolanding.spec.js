// Plan: featureplans/events-seo-landing.md - AC1..AC9 (landing signboard + SSR pre-fill).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';
import { generateSlug } from '../utils/slugUtils.js';

const LANDING_TITLE = 'Indian Events in Australia | Concerts, Shows & Festivals';
const LANDING_DESCRIPTION =
  "Find what's on for the Indian community across Australia. Browse upcoming events near you, book tickets or RSVP free - new events added every week.";
const H1_TEXT = 'Discover Indian Events, Concerts & Cultural Shows';

// Count the distinct event detail-card links (/events/{slug}-{24hex}) in raw HTML.
function countEventCardLinks(html) {
  const matches = html.match(/href="\/events\/[^"]*-[0-9a-f]{24}"/g) || [];
  return new Set(matches).size;
}

test('AC1 the served HTML (no JS) contains an upcoming event title and its /events/{slug}-{id} link', async ({ request }) => {
  const seed = readSeed();
  const res = await request.get('/events');
  expect(res.status()).toBe(200);
  const html = await res.text();

  // The guaranteed-soonest event is always card #1 of the default page. Assert its title
  // AND a title-derived detail link. Id-agnostic: the page's event fetch is ISR-cached
  // (300s), so the exact ids can lag the current seed - the mechanism (real cards + real
  // links in the server HTML) is what matters.
  const slug = generateSlug(seed.landingSoonestTitle); // e2e-landing-soonest-fest
  expect(html).toContain(seed.landingSoonestTitle);
  expect(html).toMatch(new RegExp(`/events/${slug}-[0-9a-f]{24}`));
});

test('AC2 the served HTML pre-fills the full default first page of 12 cards', async ({ request }) => {
  const res = await request.get('/events');
  const html = await res.text();
  expect(countEventCardLinks(html)).toBe(12);
});

test('AC3 document.title is the exact landing title with no brand', async ({ page }) => {
  await page.goto('/events');
  expect(await page.title()).toBe(LANDING_TITLE);
  expect(await page.title()).not.toContain('Desify');
});

test('AC4 meta description equals the locked landing text', async ({ page }) => {
  await page.goto('/events');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LANDING_DESCRIPTION);
});

test('AC5 the H1 text is unchanged', async ({ page }) => {
  await page.goto('/events');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(H1_TEXT);
});

test('AC6 the footer paragraph is the locked text and the organiser phrase links to /tickets', async ({ page }) => {
  await page.goto('/events');
  // The paragraph is rendered twice (mobile collapsible + desktop copies), so >=1 link.
  const link = page.locator('a[href="/tickets"]', { hasText: 'Host free RSVP events or sell tickets' });
  expect(await link.count()).toBeGreaterThanOrEqual(1);
  await expect(link.first()).toHaveAttribute('href', '/tickets');
  // The locked festival + city keywords appear in the paragraph (only in the footer block).
  await expect(page.locator('body')).toContainText('Diwali');
  await expect(page.locator('body')).toContainText('Adelaide');
});

test('AC7 arriving with a filter in the URL is NOT pre-filled with the default 12 (L7 guard)', async ({ request, page }) => {
  // Served HTML for a filtered arrival carries no pre-filled cards (server did not seed it).
  const res = await request.get('/events?state=NSW');
  const html = await res.text();
  expect(countEventCardLinks(html)).toBe(0);

  // And in the browser the filtered view still renders results after hydration.
  await page.goto('/events?state=NSW');
  await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('AC8 filters and pagination still work after hydration', async ({ page }) => {
  await page.goto('/events');
  await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20_000 });

  // Pagination: the seed has 12+ upcoming events, so page 2 exists.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.locator('a[href^="/events/"]').first()).toBeVisible({ timeout: 20_000 });

  // Filter: open the drawer, pick WA, apply - the WA chip appears and the URL updates.
  await page.goto('/events');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: 'WA', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page).toHaveURL(/[?&]state=WA/);
});

test('AC9 the default view is server-rendered with cards, not a loading skeleton', async ({ request }) => {
  // EventsGrid renders EITHER its skeleton OR cards - never both. 12 card links in the
  // served HTML proves the grid rendered cards on first paint (no skeleton).
  const res = await request.get('/events');
  const html = await res.text();
  expect(countEventCardLinks(html)).toBeGreaterThanOrEqual(12);
});
