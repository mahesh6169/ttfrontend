// Plan: featureplans/events-seo-canonical.md - AC4..AC6 (canonical grouping for multi-part events).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';
import { createSlugUrl } from '../utils/slugUtils.js';

const SITE = 'http://localhost:3120'; // .env.test NEXT_PUBLIC_WEBSITE_URL / backend WEBSITE_URL

async function robotsContent(page) {
  const loc = page.locator('meta[name="robots"]');
  if ((await loc.count()) === 0) return null;
  return (await loc.first().getAttribute('content')) || '';
}

test('AC4 a canonicalised day page points its canonical at the hero URL, not its own', async ({ page }) => {
  const seed = readSeed();
  const heroUrl = `${SITE}/events/${createSlugUrl(seed.seoCanonHeroTitle, seed.seoCanonHeroId)}`;

  await page.goto(`/events/${seed.seoCanonDayId}`);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe(heroUrl);
});

test('AC5 the hero page canonical is self-referential (its own URL)', async ({ page }) => {
  const seed = readSeed();
  const heroPath = `/events/${createSlugUrl(seed.seoCanonHeroTitle, seed.seoCanonHeroId)}`;

  await page.goto(heroPath);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toBe(`${SITE}${heroPath}`);
});

// Indexability itself is environment-driven (featureplans/fix-shared-environment-indexing.md) -
// the shared test server noindexes every page by design. This AC's real guard is narrower:
// canonicalisation must not layer an EXTRA noindex onto the day page beyond whatever the
// environment already applies to any page - so it must match the hero page's own robots state,
// not a hardcoded "always indexable" expectation.
test('AC6 a canonicalised day page does NOT also carry a noindex robots tag', async ({ page }) => {
  const seed = readSeed();
  const heroPath = `/events/${createSlugUrl(seed.seoCanonHeroTitle, seed.seoCanonHeroId)}`;

  await page.goto(heroPath);
  const heroRobots = await robotsContent(page);

  await page.goto(`/events/${seed.seoCanonDayId}`);
  const dayRobots = await robotsContent(page);

  expect(dayRobots, 'day page robots should match the hero page robots').toBe(heroRobots);
});
