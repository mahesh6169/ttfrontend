// Detail-page metadata: titles and meta descriptions per vertical, the events canonical grouping
// for multi-part events, and the organiser page share card.
// Plans: featureplans/events-seo-detail.md, featureplans/fix-shared-seo-metadata.md,
// featureplans/events-seo-canonical.md, featureplans/events-organiser-share-meta.md.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';
import { createSlugUrl } from '../../utils/slugUtils.js';

const SITE = 'http://localhost:3120'; // .env.test NEXT_PUBLIC_WEBSITE_URL / backend WEBSITE_URL
const MAX_DESCRIPTION = 155;

// Simple slug: lowercased words joined by dashes (mirrors generateSlug for ASCII titles).
const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Navigate and read the document title and the meta description.
async function pageMeta(page, path) {
  await page.goto(path);
  const title = await page.title();
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  return { title, description: desc || '' };
}

async function robotsContent(page) {
  const loc = page.locator('meta[name="robots"]');
  if ((await loc.count()) === 0) return null;
  return (await loc.first().getAttribute('content')) || '';
}

// --- Event detail pages ----------------------------------------------------------------------

test('event detail title: the SEO title is used verbatim, otherwise the event title, and never the brand', async ({ page }) => {
  const seed = readSeed();
  const cases = [
    { id: seed.seoFullEventId, expected: seed.seoFullEventTitle }, // has seoTitle: "TAP Vinayaka Pooja in Perth"
    { id: seed.seoFreeEventId, expected: seed.seoFreeEventTitle }, // no seoTitle: "SEO Free Event"
    { id: seed.seoPaidEventId, expected: null },
  ];
  for (const c of cases) {
    const { title } = await pageMeta(page, `/events/${c.id}`);
    if (c.expected !== null) expect(title).toBe(c.expected);
    expect(title, `title "${title}" should not contain the brand`).not.toContain('Desify');
  }
});

test('event detail description: SEO description verbatim, else the body text, else the register prompt, never over 155 chars', async ({ page }) => {
  const seed = readSeed();
  const cases = [
    // Has seoDescription: used verbatim.
    { id: seed.seoFullEventId, expected: seed.seoFullEventDescription },
    // Free and paid events with no seoDescription: the body description (factory default, >= 5 words).
    { id: seed.seoFreeEventId, expected: 'A seeded event for automated tests.' },
    { id: seed.seoPaidEventId, expected: 'A seeded event for automated tests.' },
    // A very long title must still give a description within the cap.
    { id: seed.seoLongEventId, expected: null },
    // No description at all and not paid: the register prompt.
    { id: seed.seoNoDescEventId, expected: 'Register at Desify!!', skipLength: true },
  ];
  for (const c of cases) {
    const { description } = await pageMeta(page, `/events/${c.id}`);
    if (c.expected !== null) expect(description).toBe(c.expected);
    if (!c.skipLength) {
      expect(description.length, `description "${description}" should be <= ${MAX_DESCRIPTION}`).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
  }
});

// --- Other verticals' detail pages -----------------------------------------------------------

test('listing, thread, deal and coupon detail pages have their own title and description with no "| Desify" suffix', async ({ page }) => {
  const seed = readSeed();
  const cases = [
    {
      // The listing title, with no brand at all.
      path: `/listings/${slug(seed.seoListingTitle)}-${seed.seoListingId}`,
      check: ({ title }) => {
        expect(title).toBe(seed.seoListingTitle);
        expect(title).not.toContain('Desify');
      },
    },
    {
      // The thread title; the description comes from the question, not the old call to action.
      path: `/threads/${slug('E2E Legacy Thread')}-${seed.threadLegacyId}`,
      check: ({ title, description }) => {
        expect(title).toBe('E2E Legacy Thread');
        expect(description).not.toBe('Join the conversation now!');
        expect(description.length).toBeGreaterThan(0);
      },
    },
    {
      // The deal title; the description has the expiry and the business name.
      path: `/deals/${slug(seed.seoDealTitle)}-${seed.seoDealId}`,
      check: ({ title, description }) => {
        expect(title).toBe(seed.seoDealTitle);
        expect(description).toContain('Valid until');
        expect(description).toContain('E2E SEO Deals Store');
      },
    },
    {
      // The title names the store; the description has the expiry and the QR prompt.
      path: '/coupons/e2e-coupon-campaign',
      check: ({ title, description }) => {
        expect(title).toContain('E2E Coupon Store');
        expect(description).toContain('Valid until');
        expect(description).toContain('Show QR code');
      },
    },
  ];
  for (const c of cases) {
    const meta = await pageMeta(page, c.path);
    c.check(meta);
    expect(meta.title, `page ${c.path} title "${meta.title}" contains "| Desify"`).not.toContain('| Desify');
  }
});

// --- Events canonical grouping ---------------------------------------------------------------

// Indexability itself is environment-driven (featureplans/fix-shared-environment-indexing.md) -
// the shared test server noindexes every page by design. The guard here is narrower:
// canonicalisation must not layer an EXTRA noindex onto the day page, so its robots state must
// match the hero page's own, not a hardcoded "always indexable" expectation.
test('a multi-part event day page points its canonical at the hero page, which is self-canonical, and adds no extra noindex', async ({ page }) => {
  const seed = readSeed();
  const heroPath = `/events/${createSlugUrl(seed.seoCanonHeroTitle, seed.seoCanonHeroId)}`;

  // The hero page canonical is its own URL.
  await page.goto(heroPath);
  const heroCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(heroCanonical).toBe(`${SITE}${heroPath}`);
  const heroRobots = await robotsContent(page);

  // The day page canonical is the hero URL, not its own.
  await page.goto(`/events/${seed.seoCanonDayId}`);
  const dayCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(dayCanonical).toBe(`${SITE}${heroPath}`);
  const dayRobots = await robotsContent(page);
  expect(dayRobots, 'day page robots should match the hero page robots').toBe(heroRobots);
});

// --- Organiser page share card ---------------------------------------------------------------

// The site default OG image, made absolute against the test site URL (.env.test:
// NEXT_PUBLIC_WEBSITE_URL=http://localhost:3120, META_DEFAULTS.defaultImage=/desify-og-default.jpg).
const DEFAULT_OG_IMAGE = 'http://localhost:3120/desify-og-default.jpg';

const ogContent = (page, property) =>
  page.locator(`meta[property="${property}"]`).getAttribute('content');

test('an organiser with no share fields gets the default share card', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);

  expect(await ogContent(page, 'og:title')).toBe(`Events by ${seed.orgPageName}`);
  expect(await ogContent(page, 'og:description')).toBe(`Book upcoming events by ${seed.orgPageName} on Desify!!`);
  expect(await ogContent(page, 'og:image')).toBe(DEFAULT_OG_IMAGE);
});

test('an organiser with custom share fields uses them in the share card and the page heading', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgShareSlug}`);

  expect(await ogContent(page, 'og:title')).toBe(seed.orgShareTitle);
  expect(await ogContent(page, 'og:description')).toBe(seed.orgShareDescription);
  expect(await ogContent(page, 'og:image')).toBe(seed.orgShareImage);

  // The share title wins over the event's own organiser name, so the on-screen heading reads it.
  await expect(page.getByRole('heading', { name: `Events by ${seed.orgShareTitle}` })).toBeVisible({ timeout: 20_000 });
});
