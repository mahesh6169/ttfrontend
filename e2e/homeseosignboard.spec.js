// Plan: featureplans/shared-homepage-seo.md - AC1..AC6 (homepage H1, description, footer).
import { test, expect } from '@playwright/test';

const H1_TEXT = "Australia's Indian Community Platform";
const HOME_DESCRIPTION =
  "Desify is Australia's Indian community platform - discover local classifieds, events and tickets, deals, coupons and community discussions, all in one place.";
const LISTINGS_DESCRIPTION =
  'Find rooms, vehicles, home maintenance and professional services from the Indian community near you. New listings added daily.';

test('AC1 the homepage has exactly one h1 with the platform text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(H1_TEXT);
});

test('AC2 the homepage meta description equals the locked text', async ({ page }) => {
  await page.goto('/');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(HOME_DESCRIPTION);
});

test('AC3 another page keeps its own description (root default not edited)', async ({ page }) => {
  await page.goto('/listings');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(LISTINGS_DESCRIPTION);
});

test('AC4 the homepage document.title is unchanged (root default)', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe(H1_TEXT);
});

test('AC5 the footer paragraph is present with no links inside the block', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('section', { hasText: 'Desify brings Australia' }).last();
  await expect(footer).toContainText('event organisers');
  await expect(footer).toContainText('community-driven content');
  expect(await footer.locator('a').count()).toBe(0);
});

test('AC6 the served HTML still contains real rail items (listing + event links)', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/\/listings\/[^"]*-[0-9a-f]{24}/);
  expect(html).toMatch(/\/events\/[^"]*-[0-9a-f]{24}/);
});
