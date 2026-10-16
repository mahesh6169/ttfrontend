// Browsing events: the /events discover page (filters, radius, sort), the public organiser page,
// the Past events strip and blocked-event pages. All anonymous except the organiser manage-list check.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

const MOBILE = { width: 390, height: 800 };
// A location set via the URL (Google Places autocomplete does not function in the test env).
const SYD = 'loc=Sydney%20NSW&lat=-33.8688&lng=151.2093';
const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };

test.describe('events discover page', () => {
  test('the slim mobile hero shows the seeded event, which opens its detail page', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/events');
    await expect(page.getByPlaceholder('Enter suburb or city').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Filter' }).first()).toBeVisible();
    // The old inline hero category dropdown is gone.
    await expect(page.getByText('Select Category')).toHaveCount(0);
    // Grid reachable without scrolling past a tall hero: a seeded card is in the viewport on load.
    const card = page.getByText('E2E Free Fest', { exact: false }).first();
    await expect(card).toBeInViewport({ timeout: 20_000 });

    await card.click();
    await expect(page).toHaveURL(/\/events\//);
    await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 15_000 });
  });

  test('a category or a month chosen in the filter drawer filters the results and shows a chip', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/events');
    await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Filter' }).first().click();
    // Category is a custom dropdown (trigger + option buttons), not a native <select>.
    await page.getByRole('button', { name: 'Category', exact: true }).click();
    await page.getByRole('button', { name: 'Music & Concerts', exact: true }).click();
    await page.getByRole('button', { name: 'Show results' }).click();

    const toolbar = page.locator('[data-testid="events-toolbar"]');
    await expect(toolbar.getByText('Music & Concerts')).toBeVisible();
    // Seeded events are category 'Community' (not this category) - so they are filtered out.
    await expect(page.getByText('E2E Free Fest')).toHaveCount(0, { timeout: 15_000 });

    // Month on its own: the custom Month dropdown filters to the chosen month.
    await page.goto('/events');
    await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Filter' }).first().click();
    await page.getByRole('button', { name: 'Month', exact: true }).click();
    // Furthest month (~11 months out): the seeded events (dated ~now+7d) fall outside it.
    await page.getByRole('button', { name: /20\d\d/ }).last().click();
    await page.getByRole('button', { name: 'Show results' }).click();
    await expect(toolbar.getByText(/20\d\d/)).toBeVisible(); // month chip
    await expect(page.getByText('E2E Free Fest')).toHaveCount(0, { timeout: 15_000 });
  });

  test('month, type, state and a community apply together and each shows a chip', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/events');
    await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Filter' }).first().click();
    // The Community section is not shown for the default (no) category.
    await expect(page.getByText('Community/Language')).toHaveCount(0);
    // A community-enabling category reveals the Community checkboxes (custom dropdown).
    await page.getByRole('button', { name: 'Category', exact: true }).click();
    await page.getByRole('button', { name: 'Community & Social', exact: true }).click();
    // Appears immediately (before Show results), reacting to the pending category.
    await expect(page.getByText('Community/Language')).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeVisible();
    // Month via the custom dropdown - first real month option.
    await page.getByRole('button', { name: 'Month', exact: true }).click();
    await page.getByRole('button', { name: /20\d\d/ }).first().click();
    await page.getByRole('button', { name: 'Paid', exact: true }).click();
    await page.getByRole('button', { name: 'NSW', exact: true }).click();
    await page.getByRole('checkbox').first().check(); // first community (Punjabi)
    await page.getByRole('button', { name: 'Show results' }).click();

    const toolbar = page.locator('[data-testid="events-toolbar"]');
    await expect(toolbar.getByText('NSW')).toBeVisible();
    await expect(toolbar.getByText('Paid')).toBeVisible();
    await expect(toolbar.getByText('Punjabi')).toBeVisible();
    await expect(toolbar.getByText(/20\d\d/)).toBeVisible(); // month chip (Month YYYY)
    // A community filter excludes the seeded events (they have no community) - results filtered.
    await expect(page.getByText('E2E Free Fest')).toHaveCount(0, { timeout: 15_000 });
  });

  test('with a location set the radius slider appears and re-applies, and Sort switches between date and distance', async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto('/events');
    await expect(page.locator('input[type="range"]')).toHaveCount(0); // no slider without a location

    await page.goto(`/events?${SYD}&radius=60`);
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: 20_000 });

    const toolbar = page.locator('[data-testid="events-toolbar"]');
    await expect(toolbar.getByText(/60km/)).toBeVisible();
    await slider.fill('120');
    await expect(toolbar.getByText(/120km/)).toBeVisible({ timeout: 15_000 }); // radius re-applied

    // Sort in the toolbar: Date <-> Distance.
    await page.goto(`/events?${SYD}&radius=200`);
    const sortTrigger = toolbar.getByRole('button', { name: /Sort:/ });
    await expect(sortTrigger).toBeVisible({ timeout: 20_000 });
    await expect(toolbar.getByText('Sort: Date')).toBeVisible();

    await sortTrigger.click();
    await page.getByRole('button', { name: 'Distance (nearest first)' }).click();
    await expect(toolbar.getByText('Sort: Distance')).toBeVisible();

    await sortTrigger.click();
    await page.getByRole('button', { name: 'Date (soonest first)' }).click();
    await expect(toolbar.getByText('Sort: Date')).toBeVisible();
  });
});

test.describe('public organiser page', () => {
  // Reading the clipboard back needs these permissions; localhost is a secure context so the copy works.
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('the organiser page lists their events with no filters, and Back from an event returns to it', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/by/${seed.orgPageSlug}`);

    await expect(page.getByRole('heading', { name: `Events by ${seed.orgPageName}` })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Org Page Free Fest')).toBeVisible();
    await expect(page.getByText('Org Page Paid Fest')).toBeVisible();
    // No filter section on this page.
    await expect(page.getByRole('button', { name: 'Filter' })).toHaveCount(0);

    // Open the event, then use the detail page's Back control.
    await page.getByText('Org Page Free Fest').click();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Back' }).click();

    // Lands back on the organiser page, not the generic /events grid.
    await expect(page).toHaveURL(new RegExp(`/events/by/${seed.orgPageSlug}`));
  });

  test('an organiser with no events says so, and an unknown organiser reads not found', async ({ page }) => {
    const seed = readSeed();

    await page.goto(`/events/by/${seed.orgEmptySlug}`);
    await expect(page.getByRole('heading', { name: 'No upcoming events' })).toBeVisible({ timeout: 20_000 });

    await page.goto('/events/by/no-such-organiser-xyz');
    await expect(page.getByRole('heading', { name: 'Organiser not found' })).toBeVisible({ timeout: 20_000 });
  });

  test('Share on the organiser page opens the popover and Copy puts the clean organiser URL on the clipboard', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/by/${seed.orgPageSlug}`);
    await expect(page.getByRole('heading', { name: `Events by ${seed.orgPageName}` })).toBeVisible({ timeout: 20_000 });

    const shareBtn = page.getByRole('button', { name: 'Share' });
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // The shared ShareIcons controls appear in the popover.
    await expect(page.getByTitle('Copy link')).toBeVisible();
    await expect(page.getByTitle('Share on WhatsApp')).toBeVisible();

    await page.getByTitle('Copy link').click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    // It shares the page's own /events/by/{slug} URL (project rule: share the clean slug URL), not /views/[id].
    expect(copied).toContain(`/events/by/${seed.orgPageSlug}`);
    expect(copied).not.toContain('/views/');
  });
});

test.describe('past events', () => {
  test('/events shows a scrollable Past events strip below the grid with featured ended events, including offline ones', async ({ page }) => {
    await page.goto('/events');

    const section = page.getByTestId('past-events');
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(section.getByRole('heading', { name: 'Past events' })).toBeVisible();
    await expect(section.getByText('E2E Past Ended Fest')).toBeVisible();
    // A finished OFFLINE event is included too.
    await expect(section.getByText('E2E Past Offline Fest')).toBeVisible();
    await expect(section.getByText('Ended').first()).toBeVisible();
    // Admin curation: a past event that is NOT featured does not appear.
    await expect(section.getByText('E2E Past Unfeatured Fest')).toHaveCount(0);

    // The strip is a horizontally scrollable container (overflow-x-auto).
    const scroll = page.getByTestId('past-events-scroll');
    await expect(scroll).toBeVisible();
    const overflowX = await scroll.evaluate((el) => getComputedStyle(el).overflowX);
    expect(['auto', 'scroll']).toContain(overflowX);

    // It sits BELOW the upcoming grid.
    const gridBox = await page.locator('#EventGrid').boundingBox();
    const sectionBox = await section.boundingBox();
    expect(sectionBox.y).toBeGreaterThan(gridBox.y);
  });

  test.describe('as the organiser', () => {
    test.use({ storageState: 'e2e/.auth/organiser.json' });

    test('a soft-deleted past event still shows in Past events but not in the organiser manage list', async ({ page }) => {
      // Public Past section shows the deleted past event, with a card image.
      await page.goto('/events');
      const section = page.getByTestId('past-events');
      await expect(section.getByText('E2E Past Ended Fest')).toBeVisible({ timeout: 20_000 });
      await expect(section.locator('img').first()).toBeVisible();

      // The organiser's manage list (/events/mine, the manage-events page's source) excludes it.
      const res = await page.request.get(`${API}/events/mine`, { headers: KEY });
      expect(res.ok()).toBeTruthy();
      const mine = await res.json();
      const titles = (Array.isArray(mine) ? mine : []).map((e) => e.title);
      expect(titles.length).toBeGreaterThan(0); // the organiser owns other events (list loaded)
      expect(titles).not.toContain('E2E Past Ended Fest');
    });
  });
});

test('the public page of a blocked event reads unavailable, with no Register or Purchase action', async ({ page }) => {
  const seed = readSeed();
  // The canonical /events/{slug} route (extractIdFromSlug also accepts a bare id).
  await page.goto(`/events/${seed.blockedDetailEventId}`);
  await expect(page.getByText('Event not found')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Register for Event' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Purchase Tickets' })).toHaveCount(0);
});
