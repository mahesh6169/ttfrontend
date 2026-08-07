// Acceptance suite for featureplans/events-seatbuilder-mobile.md - the seat builder's MOBILE layout:
// tabs -> MAP (primary) -> Row/Seats list, with the per-tab tool in a dismissible bottom sheet; the
// desktop sidebar-left / canvas-right layout is unchanged, and all seat/edit/zoom/save logic is
// untouched. Reached by editing a seeded paid event as the owning organiser (step 3 = Registration).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

const openBuilder = async (page, eventId) => {
  await page.goto(`/events/edit/${eventId}`);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Seat Builder' }).click();
  await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 20_000 });
};

// Build a small hall via the Layout tool (in the sheet on mobile, inline on desktop). Leaves the sheet
// open on mobile - callers dismiss with Done when they need the clean map.
const generate = async (page, r, s) => {
  await page.getByRole('tab', { name: 'Layout' }).click();
  await page.getByLabel('Number Of Rows').fill(String(r));
  await page.getByLabel('Seats Per Row').fill(String(s));
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: `Seat A${s}`, exact: true })).toBeVisible();
};

// AC1 - mobile vertical order: tabs -> map -> Row/Seats list.
test('AC1 mobile order: tabs -> map -> Row/Seats list', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 390, height: 800 });
  await openBuilder(page, seed.builderEmptyEventId);
  await generate(page, 2, 6);
  await page.getByRole('button', { name: 'Done' }).click(); // dismiss the sheet so it does not overlay

  const tabs = await page.getByTestId('builder-sidebar').boundingBox();
  const map = await page.getByTestId('builder-canvas').boundingBox();
  const list = await page.getByTestId('rows-panel').boundingBox();
  expect(tabs.y).toBeLessThan(map.y);  // tabs above the map
  expect(map.y).toBeLessThan(list.y);  // map above the Row/Seats list
});

// AC2 - the per-tab tool is a bottom sheet: not shown inline; opens on a tab tap; Done dismisses it.
test('AC2 the tool opens as a dismissible bottom sheet on tab tap', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 390, height: 800 });
  await openBuilder(page, seed.builderEmptyEventId);

  const sheet = page.getByTestId('tool-panel');
  await expect(sheet).toHaveAttribute('data-open', 'false');
  await expect(sheet).toBeHidden();

  await page.getByRole('tab', { name: 'Aisles' }).click();
  await expect(sheet).toHaveAttribute('data-open', 'true');
  await expect(sheet).toBeVisible();
  await expect(page.getByLabel('Aisle seat number')).toBeVisible(); // the Aisles tool content

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(sheet).toHaveAttribute('data-open', 'false');
  await expect(sheet).toBeHidden();
});

// AC3 - with the sheet dismissed, map editing still works (a seat reserve on the Reservations tab).
test('AC3 map editing works with the sheet dismissed', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 390, height: 800 });
  await openBuilder(page, seed.builderEmptyEventId);
  await generate(page, 2, 6);

  await page.getByRole('tab', { name: 'Reservations' }).click();
  await page.getByRole('button', { name: 'Done' }).click(); // dismiss to tap the map
  await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
  await expect(page.getByTestId('tool-panel')).toHaveAttribute('data-open', 'true'); // reserving pops the sheet open
});

// AC4 - desktop keeps the sidebar-left / canvas-right layout with the tool inline (no sheet).
test('AC4 desktop: tool inline, tabs to the left of the map', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 1280, height: 800 });
  await openBuilder(page, seed.builderEmptyEventId);
  await generate(page, 2, 6);

  await expect(page.getByTestId('tool-panel')).toBeVisible(); // inline, not a hidden sheet
  await expect(page.getByLabel('Number Of Rows')).toBeVisible();        // Layout tool inline

  const tabs = await page.getByTestId('builder-sidebar').boundingBox();
  const map = await page.getByTestId('builder-canvas').boundingBox();
  expect(tabs.x + tabs.width).toBeLessThanOrEqual(map.x + 1); // sidebar sits left of the map
});

// AC5 - 360px: no horizontal scroll and the map opens fitted (stage + last row visible). A wide hall
// (20 seats/row) would overflow if the tabs/map cells did not clamp - so this checks the overlay's own
// scrollWidth, not just the document's, so a page that stretches "the outside page" is caught.
test('AC5 360px: no horizontal scroll, map fits', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 360, height: 780 });
  await openBuilder(page, seed.builderEmptyEventId);
  await generate(page, 3, 20);
  await page.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByTestId('stage-bar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seat C20', exact: true })).toBeVisible(); // last row, fitted

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const ov = document.querySelector('[data-testid="seat-builder-overlay"]');
    const inner = ov ? ov.scrollWidth - ov.clientWidth : 0;
    return Math.max(doc, inner);
  });
  expect(overflow).toBeLessThanOrEqual(1);
});
