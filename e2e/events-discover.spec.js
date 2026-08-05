// Acceptance suite for featureplans/events-discover-ui.md (suite: events-discover).
// The /events discover page: a slim hero (location + Filter button, contextual radius,
// secondary Create Event), ALL filters in the Filter drawer (category/month/type/state/
// communities), and Sort in the toolbar row above the grid. Chips scroll in one row with
// Clear pinned left and Sort pinned right; nothing scrolls sideways at 360.
import { test, expect } from '@playwright/test';

const MOBILE = { width: 390, height: 800 };
// A location set via the URL (Google Places autocomplete does not function in the test env).
const SYD = 'loc=Sydney%20NSW&lat=-33.8688&lng=151.2093';

// AC1: on mobile the hero shows only the location field + Filter button (no inline category
// dropdown), and the grid is reachable on load (slim hero, no tall hero to scroll past).
test('AC1 slim hero: location + Filter only, grid reachable', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/events');
  await expect(page.getByPlaceholder('Enter suburb or city').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Filter' }).first()).toBeVisible();
  // The old inline hero category dropdown is gone.
  await expect(page.getByText('Select Category')).toHaveCount(0);
  // Grid reachable without scrolling past a tall hero: a seeded card is in the viewport on load.
  await expect(page.getByText('E2E Free Fest').first()).toBeInViewport({ timeout: 20_000 });
});

// AC2: choosing a Category in the drawer and applying filters the results and shows a chip.
test('AC2 category chosen in the drawer filters and shows a chip', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/events');
  await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Filter' }).first().click();
  // Category is now a custom dropdown (trigger + option buttons), not a native <select>.
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('button', { name: 'Music & Concerts', exact: true }).click();
  await page.getByRole('button', { name: 'Show results' }).click();

  const toolbar = page.locator('[data-testid="events-toolbar"]');
  await expect(toolbar.getByText('Music & Concerts')).toBeVisible();
  // Seeded events are category 'Community' (not this category) - so they are filtered out.
  await expect(page.getByText('E2E Free Fest')).toHaveCount(0, { timeout: 15_000 });
});

// AC3: Month + Event Type + State + a Community applied - each shows a chip and results filter.
test('AC3 month/type/state/community apply and each shows a chip', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/events');
  await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Filter' }).first().click();
  // A community-enabling category reveals the Community checkboxes (custom dropdown).
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('button', { name: 'Community & Social', exact: true }).click();
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

// AC4: with a location set, the radius slider appears in the hero and changing it re-applies.
test('AC4 radius slider appears on location-set and re-applies', async ({ page }) => {
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
});

// AC5: the toolbar Sort switches Date <-> Distance (applies the ordering) with a location set.
test('AC5 toolbar Sort switches Date <-> Distance', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`/events?${SYD}&radius=200`);
  const toolbar = page.locator('[data-testid="events-toolbar"]');
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

// AC6: with many active filters, chips scroll in one row while Clear (left) and Sort (right)
// stay pinned.
test('AC6 chips scroll one row; Clear and Sort pinned', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto(`/events?cat=Music%20%26%20Concerts&state=NSW&eventType=paid&${SYD}&radius=60&communities=punjabi,hindi,tamil`);
  const toolbar = page.locator('[data-testid="events-toolbar"]');
  const clear = toolbar.getByRole('button', { name: 'Clear' });
  const sortBtn = toolbar.getByRole('button', { name: /Sort:/ });
  await expect(clear).toBeVisible({ timeout: 20_000 });
  await expect(sortBtn).toBeVisible();

  const clearBox = await clear.boundingBox();
  const sortBox = await sortBtn.boundingBox();
  expect(clearBox.x).toBeLessThan(sortBox.x);              // Clear left of Sort
  expect(Math.abs(clearBox.y - sortBox.y)).toBeLessThan(8); // same row (no wrap)

  // Chips overflow horizontally in a single scrollable track (never wrapping).
  const track = toolbar.locator('div.overflow-x-auto');
  const overflowing = await track.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflowing).toBeTruthy();
});

// AC7: at the 360px floor with several chips, the page does not scroll sideways.
test('AC7 no horizontal scroll at 360 with many chips', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/events?cat=Music%20%26%20Concerts&state=NSW&eventType=paid&${SYD}&radius=60&communities=punjabi,hindi,tamil,gujarati`);
  await expect(page.locator('[data-testid="events-toolbar"]')).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

// --- events-filter-conform.md: the custom dropdowns for Category + Month ---

// Conform AC2: the custom Month dropdown filters the results to the chosen month.
test('conform Month custom dropdown filters to the chosen month', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/events');
  await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.getByRole('button', { name: 'Month', exact: true }).click();
  // Furthest month (~11 months out): the seeded events (dated ~now+7d) fall outside it.
  await page.getByRole('button', { name: /20\d\d/ }).last().click();
  await page.getByRole('button', { name: 'Show results' }).click();

  const toolbar = page.locator('[data-testid="events-toolbar"]');
  await expect(toolbar.getByText(/20\d\d/)).toBeVisible(); // month chip
  await expect(page.getByText('E2E Free Fest')).toHaveCount(0, { timeout: 15_000 });
});

// Conform AC3: choosing a community-enabling Category in the custom dropdown reveals the
// Community section before "Show results" (the temp-category link works with the new control).
test('conform community section appears when a community category is picked', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/events');
  await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Filter' }).first().click();
  // Not shown for the default (no) category.
  await expect(page.getByText('Community/Language')).toHaveCount(0);

  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('button', { name: 'Community & Social', exact: true }).click();

  // Appears immediately (before Show results), reacting to the pending category.
  await expect(page.getByText('Community/Language')).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
});
