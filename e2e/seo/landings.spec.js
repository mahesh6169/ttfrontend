// The five vertical landing pages (events, listings, deals, threads, coupons) and the homepage:
// the "signboard" text (title, meta description, H1, footer paragraph) and the server-rendered
// first page of cards (real cards and links in the HTML a crawler gets, no loading skeleton).
// Plans: featureplans/{events,listings,deals,threads,coupons}-seo-landing.md,
// featureplans/shared-homepage-seo.md, featureplans/fix-shared-seo-metadata.md.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';
import { generateSlug } from '../../utils/slugUtils.js';

const SITE = 'http://localhost:3120';

// Count the distinct detail-card links in raw HTML: /{vertical}/{slug}-{24hex} for most verticals.
function countSlugIdCardLinks(html, vertical) {
  const matches = html.match(new RegExp(`href="/${vertical}/[^"]*-[0-9a-f]{24}"`, 'g')) || [];
  return new Set(matches).size;
}

// Coupons campaign cards are id-less: /coupons/{slug}. The /coupons/views/{id} legacy links do
// not match (a slash follows "views").
function countCouponCardLinks(html) {
  const matches = html.match(/href="\/coupons\/[a-z0-9-]+"/g) || [];
  return new Set(matches).size;
}

// The paragraph is rendered twice (mobile collapsible + desktop copies), so >=1 link.
async function expectFooterLink(page, { href, linkText, words }) {
  const link = page.locator(`a[href="${href}"]`, { hasText: linkText });
  expect(await link.count()).toBeGreaterThanOrEqual(1);
  await expect(link.first()).toHaveAttribute('href', href);
  for (const word of words) {
    await expect(page.locator('body')).toContainText(word);
  }
}

// Filters and pagination after hydration, for the URL-driven grids (events, listings, deals, threads).
async function expectUrlDrivenFiltersAndPaging(page, path, state) {
  await page.goto(path);
  await expect(page.locator(`a[href^="${path}/"]`).first()).toBeVisible({ timeout: 20_000 });

  // Pagination: the seed has 12+ items, so page 2 exists.
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page).toHaveURL(/[?&]page=2/);
  await expect(page.locator(`a[href^="${path}/"]`).first()).toBeVisible({ timeout: 20_000 });

  // Filter: open the drawer, pick a state, apply - the URL reflects the filter.
  await page.goto(path);
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: state, exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();
  await expect(page).toHaveURL(new RegExp(`[?&]state=${state}`));
}

const VERTICALS = [
  {
    name: 'events',
    path: '/events',
    countCards: (html) => countSlugIdCardLinks(html, 'events'),
    fullPage: 12,
    // The guaranteed-soonest event is always card #1 of the default page. Id-agnostic: the page's
    // event fetch is ISR-cached (300s), so the exact ids can lag the current seed.
    expectRealCard: (html, seed) => {
      const slug = generateSlug(seed.landingSoonestTitle); // e2e-landing-soonest-fest
      expect(html).toContain(seed.landingSoonestTitle);
      expect(html).toMatch(new RegExp(`/events/${slug}-[0-9a-f]{24}`));
    },
    title: 'Indian Events in Australia | Concerts, Shows & Festivals',
    description:
      "Find what's on for the Indian community across Australia. Browse upcoming events near you, book tickets or RSVP free - new events added every week.",
    h1: 'Discover Indian Events, Concerts & Cultural Shows',
    // The locked festival + city keywords appear in the paragraph (only in the footer block).
    checkFooter: (page) =>
      expectFooterLink(page, { href: '/tickets', linkText: 'Host free RSVP events or sell tickets', words: ['Diwali', 'Adelaide'] }),
    checkFiltersAndPaging: (page) => expectUrlDrivenFiltersAndPaging(page, '/events', 'WA'),
  },
  {
    name: 'listings',
    path: '/listings',
    countCards: (html) => countSlugIdCardLinks(html, 'listings'),
    fullPage: 12,
    // The seed creates 13 'E2E Landing Listing NN' active listings; >=12 are on the default page.
    expectRealCard: (html) => {
      expect(html).toContain('E2E Landing Listing');
      expect(html).toMatch(/\/listings\/e2e-landing-listing-\d{2}-[0-9a-f]{24}/);
    },
    title: 'Indian Classifieds in Australia | Buy & Sell, Jobs, Rentals',
    description:
      'Find rooms, vehicles, home maintenance and professional services from the Indian community near you. New listings added daily.',
    h1: "Australia's Indian Classifieds",
    checkFooter: (page) =>
      expectFooterLink(page, { href: '/listings/add', linkText: 'Post a listing free', words: ['matrimony', 'Adelaide'] }),
    checkFiltersAndPaging: (page) => expectUrlDrivenFiltersAndPaging(page, '/listings', 'NSW'),
  },
  {
    name: 'deals',
    path: '/deals',
    countCards: (html) => countSlugIdCardLinks(html, 'deals'),
    fullPage: 12,
    // The seed creates 13 'E2E Landing Deal NN' active deals; >=12 are on the default page.
    expectRealCard: (html) => {
      expect(html).toContain('E2E Landing Deal');
      expect(html).toMatch(/\/deals\/e2e-landing-deal-\d{2}-[0-9a-f]{24}/);
    },
    title: 'Find Local Deals, Discounts & Offers Near You',
    description:
      'Browse deals from local businesses near you - food, groceries, fashion, jewellery, beauty, classes and more. Find an offer and save today.',
    h1: 'Discover Indian Deals, Discounts & Special Offers',
    checkFooter: (page) =>
      expectFooterLink(page, {
        href: '/users/profile/deals',
        linkText: 'Businesses can post their deals free',
        words: ['jewellery', 'Adelaide'],
      }),
    checkFiltersAndPaging: (page) => expectUrlDrivenFiltersAndPaging(page, '/deals', 'NSW'),
  },
  {
    name: 'threads',
    path: '/threads',
    countCards: (html) => countSlugIdCardLinks(html, 'threads'),
    fullPage: 12,
    // The seed creates 13 'E2E Landing Thread NN' threads; >=12 are on the default page.
    expectRealCard: (html) => {
      expect(html).toContain('E2E Landing Thread');
      expect(html).toMatch(/\/threads\/e2e-landing-thread-\d{2}-[0-9a-f]{24}/);
    },
    title: 'Indian Community Forum Australia | Ask, Share & Discuss',
    description:
      'Get answers from the Indian community in Australia on visas, careers, money, health and everyday life. Ask a question or join a discussion free.',
    h1: 'Indian Community Forum: Ask, Share & Discuss',
    checkFooter: (page) =>
      expectFooterLink(page, {
        href: '/threads/new',
        linkText: 'start your own discussion free',
        words: ['migration', 'devotional'],
      }),
    checkFiltersAndPaging: (page) => expectUrlDrivenFiltersAndPaging(page, '/threads', 'NSW'),
  },
  {
    name: 'coupons',
    path: '/coupons',
    countCards: countCouponCardLinks,
    // Store-paginated 20/page, one campaign per store => a full first page is 20 cards.
    fullPage: 20,
    // 21 'E2E Landing Coupon NN' campaigns seeded; >=19 are on the default (page-1) 20 stores.
    expectRealCard: (html) => {
      expect(html).toContain('E2E Landing Coupon');
      expect(html).toMatch(/\/coupons\/e2e-landing-coupon-\d{2}/);
    },
    title: 'Discover In-Store Coupons From Local Businesses Near You',
    description:
      'Browse coupons from restaurants, grocery stores, fashion, beauty and wellbeing businesses near you. Show the QR code in-store and save.',
    h1: 'Indian Store Coupons & Offers Near You',
    // The footer section carries the locked copy and contains no anchor (store line unlinked).
    checkFooter: async (page) => {
      await expect(page.locator('body')).toContainText('QR code');
      await expect(page.locator('body')).toContainText('Adelaide');
      const footer = page.locator('section', { hasText: 'Desify is a coupons platform for the Indian community' }).last();
      await expect(footer).toContainText('Stores can list their offers free on Desify.');
      expect(await footer.locator('a').count()).toBe(0);
    },
    // The canonical still points at /coupons after the metadata move.
    checkCanonical: async (page) => {
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`${SITE}/coupons`);
    },
    checkFiltersAndPaging: async (page) => {
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
    },
  },
];

for (const v of VERTICALS) {
  test(`${v.name} landing: the server HTML has a full first page of real cards and links, and a filtered URL is not pre-filled`, async ({ request }) => {
    const seed = readSeed();
    const res = await request.get(v.path);
    expect(res.status()).toBe(200);
    const html = await res.text();

    // A real card title and its detail link are in the HTML a crawler gets (no JS).
    v.expectRealCard(html, seed);
    // The full default first page is pre-filled.
    expect(v.countCards(html)).toBe(v.fullPage);
    // The grid renders EITHER its skeleton OR cards - never both. 12+ card links in the served
    // HTML proves it rendered cards on first paint (no loading skeleton).
    expect(v.countCards(html)).toBeGreaterThanOrEqual(12);

    // Arriving with a filter in the URL: the server did not seed the default page.
    const filtered = await request.get(`${v.path}?state=NSW`);
    expect(v.countCards(await filtered.text())).toBe(0);
  });

  test(`${v.name} landing: title, meta description, heading and footer paragraph are the locked text`, async ({ page }) => {
    await page.goto(v.path);
    // Exact landing title, with no brand.
    expect(await page.title()).toBe(v.title);
    expect(await page.title()).not.toContain('Desify');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBe(v.description);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(v.h1);
    await v.checkFooter(page);
    if (v.checkCanonical) await v.checkCanonical(page);

    // A filtered arrival (not pre-filled by the server) still renders results after hydration.
    await page.goto(`${v.path}?state=NSW`);
    await expect(page.locator(`a[href^="${v.path}/"]`).first()).toBeVisible({ timeout: 20_000 });
  });

  test(`${v.name} landing: filters and pagination still work after the page loads`, async ({ page }) => {
    await v.checkFiltersAndPaging(page);
  });
}

// --- Homepage --------------------------------------------------------------------------------

const HOME_H1 = "Australia's Indian Community Platform";
const HOME_DESCRIPTION =
  "Desify is Australia's Indian community platform - discover local classifieds, events and tickets, deals, coupons and community discussions, all in one place.";

test('homepage: one platform heading, locked description and title, unlinked footer paragraph, and real rail items in the server HTML', async ({ page, request }) => {
  await page.goto('/');
  // Exactly one h1, with the platform text.
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(HOME_H1);

  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBe(HOME_DESCRIPTION);

  // The document title is the root default (unchanged).
  expect(await page.title()).toBe(HOME_H1);

  // The footer paragraph is present with no links inside the block.
  const footer = page.locator('section', { hasText: 'Desify brings Australia' }).last();
  await expect(footer).toContainText('event organisers');
  await expect(footer).toContainText('community-driven content');
  expect(await footer.locator('a').count()).toBe(0);

  // The served HTML still contains real rail items (listing + event links).
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toMatch(/\/listings\/[^"]*-[0-9a-f]{24}/);
  expect(html).toMatch(/\/events\/[^"]*-[0-9a-f]{24}/);
});
