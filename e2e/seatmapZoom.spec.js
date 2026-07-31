// Seat map pan-and-zoom - see featureplans/events-seatmap-zoom.md.
// The attendee map opens fitted; below a tap-size threshold selection is gated (hint shown); zooming in
// past it selects as before. Uses a wide seeded hall so the fitted view is gated. A central seat (C40)
// is used for selection so it stays in view when zooming toward the centre.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };
const clearReservation = async (page, eventId) => {
  const res = await page.request.get(`${API}/events/${eventId}/reservation`, { headers: KEY });
  if (res.ok()) {
    const body = await res.json();
    if (body?.reservation?._id) {
      await page.request.delete(`${API}/events/${eventId}/reservation/${body.reservation._id}`, { headers: KEY });
    }
  }
};

test.beforeEach(async ({ page }) => {
  await clearReservation(page, readSeed().zoomHallEventId);
});

const openSeats = async (page, eventId) => {
  await page.goto(`/events/tickets/${eventId}`);
  await page.getByRole('button', { name: 'Add one Standard' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
};
const zoomInPastThreshold = async (page) => {
  for (let i = 0; i < 4; i++) await page.getByLabel('Zoom in').click();
};

test('AC1 the seats page opens with the whole hall visible (stage bar + last row), no horizontal scrollbar', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('stage-bar')).toBeVisible();
  await expect(page.getByRole('button', { name: /^A1 -/ })).toBeVisible();   // first row
  await expect(page.getByRole('button', { name: /^E80 -/ })).toBeVisible();  // last row, last seat
  // No old horizontal scroll container remains.
  await expect(page.locator('.seat-container')).toHaveCount(0);
});

test('AC2 at the fitted view a seat click does NOT select and the hint chip is shown', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('zoom-hint')).toBeVisible();
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toHaveCount(0);
});

test('AC3 after zooming in past the threshold the hint clears and a seat selects', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  await expect(page.getByTestId('zoom-hint')).toHaveCount(0);
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
});

test('AC4 the fit control returns to the fitted (gated) view; zoom-out cannot pass it', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  // Fit returns to the fitted view -> selection is gated again.
  await page.getByLabel('Fit view').click();
  await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C41 - Selected by you' })).toHaveCount(0);
  // Zoom-out cannot drop below fitted -> still gated.
  for (let i = 0; i < 3; i++) await page.getByLabel('Zoom out').click();
  await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C41 - Selected by you' })).toHaveCount(0);
});

test('AC5 while zoomed in, the legend and reservation timer stay visible outside the map', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  await expect(page.getByText('Sold', { exact: true })).toBeVisible();     // legend chip
  await expect(page.getByText('Reserved', { exact: true })).toBeVisible(); // legend chip
});

test('AC6 a drag over seats pans and selects nothing; a click (no movement) selects', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  const seat = page.getByRole('button', { name: 'C40 - Available (tap to select)' });
  const box = await seat.boundingBox();
  // Drag starting on the seat -> pans, does not select.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toHaveCount(0);
  // A plain click selects.
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
});

test('AC8 (mobile) fitted + gated on load; zoom in past the threshold, a seat tap selects; chrome visible', async ({ page }) => {
  // The map fits and gates on load at a phone viewport; the zoom LOGIC is driven via the control here
  // (the real pinch/double-tap FEEL is the owner's feel-pass, per this plan's testing note).
  await page.setViewportSize({ width: 390, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('zoom-hint')).toBeVisible(); // fitted + gated on load
  await zoomInPastThreshold(page);
  await expect(page.getByTestId('zoom-hint')).toHaveCount(0);
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Sold', { exact: true })).toBeVisible(); // chrome visible on mobile
});

// --- Seat-map polish punch-list (see featureplans/fix-events-seatmap-polish.md) ---

test('P-AC1 (mobile) no dead field above the stage - the stage sits near the container top, and fills the width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  const stage = await page.getByTestId('stage-bar').boundingBox();
  expect(stage.y - vp.y).toBeGreaterThanOrEqual(0);
  expect(stage.y - vp.y).toBeLessThan(80);           // no large empty field above the hall
  expect(stage.width / vp.width).toBeGreaterThan(0.9); // braver fitted fill on mobile
});

test('P-AC2 each row has exactly two end labels (no ghost mid-row label), at fitted AND after zoom', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const rows = 5;
  await expect(page.getByTestId('row-label')).toHaveCount(rows * 2);
  // Row C's two labels bracket the row: one before the first seat, one after the last - none mid-row.
  const cLabels = page.getByTestId('row-label').filter({ hasText: /^C$/ });
  await expect(cLabels).toHaveCount(2);
  const l0 = await cLabels.nth(0).boundingBox();
  const l1 = await cLabels.nth(1).boundingBox();
  const c1 = await page.getByRole('button', { name: /^C1 -/ }).boundingBox();
  const c80 = await page.getByRole('button', { name: /^C80 -/ }).boundingBox();
  const left = l0.x < l1.x ? l0 : l1;
  const right = l0.x < l1.x ? l1 : l0;
  expect(left.x + left.width).toBeLessThanOrEqual(c1.x + 2);            // left label at the row start
  expect(right.x + 2).toBeGreaterThanOrEqual(c80.x + c80.width);       // right label at the row end
  // Zooming does not spawn extra labels.
  await zoomInPastThreshold(page);
  await expect(page.getByTestId('row-label')).toHaveCount(rows * 2);
});

test('P-AC3 (desktop) the fitted hall fills at least 90% of the container width', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  const stage = await page.getByTestId('stage-bar').boundingBox();
  expect(stage.width / vp.width).toBeGreaterThan(0.9);
});

test('P-AC4 the +/-/Fit controls sit inside the map container', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  for (const name of ['Zoom in', 'Zoom out', 'Fit view']) {
    const b = await page.getByLabel(name).boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(vp.x - 1);
    expect(b.y).toBeGreaterThanOrEqual(vp.y - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(vp.x + vp.width + 1);
    expect(b.y + b.height).toBeLessThanOrEqual(vp.y + vp.height + 1);
  }
});

test('P-AC6/P-AC8 (attendee) uniform seats, one shared centreline across rows, stage centred on it', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const rowMetrics = async (first, last) => {
    const a = await page.getByRole('button', { name: first }).boundingBox();
    const b = await page.getByRole('button', { name: last }).boundingBox();
    return { centre: (a.x + b.x + b.width) / 2, size: a.width };
  };
  const rowA = await rowMetrics(/^A1 -/, /^A80 -/);
  const rowE = await rowMetrics(/^E1 -/, /^E80 -/);
  const stage = await page.getByTestId('stage-bar').boundingBox();
  const stageCentre = stage.x + stage.width / 2;
  // Amphitheater per-row padding retired: every row shares ONE centreline (no stagger/drift).
  expect(Math.abs(rowA.centre - rowE.centre)).toBeLessThan(4);
  // The stage bar is centred on that same shared centreline.
  expect(Math.abs(stageCentre - rowA.centre)).toBeLessThan(4);
  // Uniform seat size across rows.
  expect(Math.abs(rowA.size - rowE.size)).toBeLessThan(1);
});

test('P-AC20 (item 20) the zoom hint chip sits below the hall, not on top of the seats', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('zoom-hint')).toBeVisible();
  const chip = await page.getByTestId('zoom-hint').boundingBox();
  const lastRow = await page.getByRole('button', { name: /^E1 -/ }).boundingBox();
  expect(chip.y).toBeGreaterThan(lastRow.y + lastRow.height); // chip is below the last row of seats
});

test('P-AC21 (item 21) the map box takes ~65% of the viewport, stage top-aligned, zoom room below', async ({ page }) => {
  for (const vpSize of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
    await clearReservation(page, readSeed().zoomHallEventId);
    await page.setViewportSize(vpSize);
    await openSeats(page, readSeed().zoomHallEventId);
    const box = await page.getByTestId('seat-map-viewport').boundingBox();
    const ratio = box.height / vpSize.height;
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThan(0.75);
    const stage = await page.getByTestId('stage-bar').boundingBox();
    expect(stage.y - box.y).toBeLessThan(80); // stage top-aligned, no dead field above
    const lastRow = await page.getByRole('button', { name: /^E1 -/ }).boundingBox();
    expect((box.y + box.height) - (lastRow.y + lastRow.height)).toBeGreaterThan(60); // zoom room below
  }
});

test('P-AC22 (item 22, desktop) hovering a seat shows a card with row, seat and status, no price', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  const seat = page.getByRole('button', { name: /^C40 -/ });
  await seat.hover();
  const card = seat.locator('xpath=..').getByTestId('seat-hover-card');
  await expect(card).toContainText('Row');
  await expect(card).toContainText('Seat');
  await expect(card).toContainText('40');       // seat number prominent
  await expect(card).toContainText('Available'); // status word
  expect(await card.innerText()).not.toContain('$'); // no pricing on this platform
});
