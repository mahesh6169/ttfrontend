// Seat map pan-and-zoom - see featureplans/events-seatmap-zoom.md.
// The attendee map opens fitted. A tap selects at ANY zoom (no zoom-gate) - selection is visible and
// reversible. Zoom (pinch/wheel/+/-) is an optional aid. A central seat (C40) is used for selection so
// it stays in view when zooming toward the centre.
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

test('AC2 at the fitted view a seat tap selects immediately (no zoom-gate, no hint)', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('zoom-hint')).toHaveCount(0); // the zoom-gate hint is gone
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
});

test('AC3 selection is visible and reversible - a second tap deselects', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'C40 - Selected by you' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Available (tap to select)' })).toBeVisible({ timeout: 15_000 });
});

test('AC4 Fit returns to the fitted view and a tap still selects there (no gate at the floor)', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  await page.getByLabel('Fit view').click();
  // Back at the fitted view, a tap still selects (selection is never gated by zoom).
  await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C41 - Selected by you' })).toBeVisible({ timeout: 15_000 });
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

test('AC8 (mobile) a seat tap selects at the fitted view on load; chrome visible', async ({ page }) => {
  // The map fits on load at a phone viewport and a tap selects right away - no zoom-gate.
  await page.setViewportSize({ width: 390, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  await expect(page.getByTestId('zoom-hint')).toHaveCount(0); // no gate hint
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Sold', { exact: true })).toBeVisible(); // chrome visible on mobile
});

test('Z-AC7 (mobile) tapping a seat does BOTH - selects it and reveals the Row/Seat card, which fades after ~2s', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openSeats(page, readSeed().zoomHallEventId);
  await zoomInPastThreshold(page);
  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  // BOTH: the seat becomes selected AND its card is shown
  const selected = page.getByRole('button', { name: 'C40 - Selected by you' });
  await expect(selected).toBeVisible({ timeout: 15_000 });
  const card = selected.locator('xpath=..').getByTestId('seat-hover-card');
  await expect(card).toContainText('40');
  await expect(card).toHaveCSS('opacity', '1');
  // move off the seat so no lingering hover keeps it open, then it auto-dismisses within ~2s
  await page.mouse.move(5, 5);
  await expect(card).toHaveCSS('opacity', '0', { timeout: 4000 });
});

// A REAL touch device (hover:none, pointer:coarse) - this is where the sticky-hover bug lived: the card's
// group-hover was pinning it open past the 2s timer, and the hover styling made the first tap only reveal
// the card instead of selecting. Hover styling is now gated to [@media(hover:hover)] so on touch the card
// is driven purely by the tap + timer. Here we assert the card fades WITHOUT moving any cursor away.
test.describe('touch device (hover:none) - mobile card + tap fixes', () => {
  // isMobile+hasTouch make Chromium report `hover: none` / `pointer: coarse` (a real phone), which is what
  // the [@media(hover:hover)] gate keys off. defaultBrowserType is intentionally NOT spread (not allowed here).
  test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, storageState: 'e2e/.auth/member.json' });

  test('Z-AC8 (touch) one tap selects AND shows the card, which auto-dismisses in ~2s with no cursor to move away', async ({ page }) => {
    await clearReservation(page, readSeed().zoomHallEventId);
    await openSeats(page, readSeed().zoomHallEventId);
    await zoomInPastThreshold(page);
    await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).tap();
    const selected = page.getByRole('button', { name: 'C40 - Selected by you' });
    await expect(selected).toBeVisible({ timeout: 15_000 }); // selected on the tap
    const card = selected.locator('xpath=..').getByTestId('seat-hover-card');
    await expect(card).toHaveCSS('opacity', '1');            // card shown by the tap
    // No mouse.move here - on a touch device there is no hover to clear. The timer alone must hide it.
    await expect(card).toHaveCSS('opacity', '0', { timeout: 4000 });
  });
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

test('P-AC4 the +/-/Fit controls sit outside the map, above its top-right corner', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  for (const name of ['Zoom in', 'Zoom out', 'Fit view']) {
    const b = await page.getByLabel(name).boundingBox();
    // above the map (fully clears the map's top edge)
    expect(b.y + b.height).toBeLessThanOrEqual(vp.y + 1);
    // within the map's horizontal span, hugging the right edge (top-right corner)
    expect(b.x).toBeGreaterThanOrEqual(vp.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(vp.x + vp.width + 1);
  }
  // the rightmost control (Fit) is right-aligned to the map's right edge
  const fit = await page.getByLabel('Fit view').boundingBox();
  expect(fit.x + fit.width).toBeGreaterThanOrEqual(vp.x + vp.width - 60);
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

test('P-AC21 (item 21) the map box hugs the fitted hall (no wasted space), stage top-aligned', async ({ page }) => {
  for (const vpSize of [{ width: 390, height: 800 }, { width: 1280, height: 800 }]) {
    await clearReservation(page, readSeed().zoomHallEventId);
    await page.setViewportSize(vpSize);
    await openSeats(page, readSeed().zoomHallEventId);
    const box = await page.getByTestId('seat-map-viewport').boundingBox();
    const cap = Math.round(vpSize.height * (vpSize.width < 640 ? 0.6 : 0.7));
    expect(box.height).toBeLessThanOrEqual(cap + 1);        // never exceeds the cap
    expect(box.height / vpSize.height).toBeLessThan(0.62);  // shrunk - NOT the old fixed ~65vh for a short hall
    const stage = await page.getByTestId('stage-bar').boundingBox();
    expect(stage.y - box.y).toBeLessThan(80);               // stage top-aligned, no dead field above
    const lastRow = await page.getByRole('button', { name: /^E1 -/ }).boundingBox();
    expect(lastRow.y + lastRow.height).toBeLessThanOrEqual(box.y + box.height + 1); // whole hall inside the box
    const gapBelow = (box.y + box.height) - (lastRow.y + lastRow.height);
    expect(gapBelow).toBeGreaterThan(8);                    // generous padding below (not flush against the last row)
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
  await expect(card).toContainText('40');            // seat number prominent
  await expect(card).not.toContainText('Available'); // no status word - the colour + legend convey it
  expect(await card.innerText()).not.toContain('$'); // no pricing on this platform
});

// --- Zoom parity (attendee side) - see featureplans/events-seatmap-zoom-parity.md ---
const scaleOf = async (page) => parseFloat(await page.getByTestId('seat-map-viewport').getAttribute('data-scale'));

test('Z-AC1 the attendee wheel zooms a fixed ~10% per notch toward the cursor, no velocity sensitivity', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  for (let i = 0; i < 3; i++) await page.getByLabel('Zoom in').click(); // grow seats so ratios are measurable
  const seat = page.getByRole('button', { name: /^C40 -/ });
  const b0 = await seat.boundingBox();
  const cx = b0.x + b0.width / 2, cy = b0.y + b0.height / 2;
  await page.mouse.move(cx, cy);
  const s0 = await scaleOf(page);
  await page.mouse.wheel(0, -100);
  const s1 = await scaleOf(page);
  await page.mouse.wheel(0, -100);
  const s2 = await scaleOf(page);
  expect(s1 / s0).toBeGreaterThan(1.05);
  expect(s1 / s0).toBeLessThan(1.16);                          // ~1.1 per notch
  expect(Math.abs((s2 / s1) - (s1 / s0))).toBeLessThan(0.03);  // equal ratio each notch
  const s2b = await scaleOf(page);
  await page.mouse.wheel(0, -1000);                            // 10x the delta = still one 10% step
  const s3 = await scaleOf(page);
  expect(Math.abs((s3 / s2b) - 1.1)).toBeLessThan(0.04);       // magnitude ignored (no velocity sensitivity)
  // the point under the cursor stays ~fixed while zooming
  const b1 = await seat.boundingBox();
  expect(Math.abs((b1.x + b1.width / 2) - cx)).toBeLessThan(24);
  expect(Math.abs((b1.y + b1.height / 2) - cy)).toBeLessThan(24);
});

test('Z-AC2 the attendee wheel/buttons never go below the fitted view nor above 4.0', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const fit = await scaleOf(page);
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  await page.mouse.move(vp.x + vp.width / 2, vp.y + vp.height / 2);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 100);   // wheel out
  for (let i = 0; i < 4; i++) await page.getByLabel('Zoom out').click(); // button out
  expect(await scaleOf(page)).toBeGreaterThanOrEqual(fit - 0.001);
  expect(await scaleOf(page)).toBeLessThan(fit + 0.02);         // never below (nor drifts above) the fitted floor
  const vp2 = await page.getByTestId('seat-map-viewport').boundingBox();
  await page.mouse.move(vp2.x + vp2.width / 2, vp2.y + vp2.height / 2);
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -100); // way past max
  expect(await scaleOf(page)).toBeLessThanOrEqual(4.001);       // capped at 4.0
  expect(await scaleOf(page)).toBeGreaterThan(3.5);
});

test('Z-AC3 (attendee) the +/- buttons change scale by 0.3', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  const a = await scaleOf(page);
  await page.getByLabel('Zoom in').click();
  const b = await scaleOf(page);
  expect(b - a).toBeCloseTo(0.3, 1);
  await page.getByLabel('Zoom out').click();
  expect(await scaleOf(page)).toBeCloseTo(a, 1);
});

test('Z-AC4 (attendee) Fit returns to the fitted view: hall ~96% wide, stage top-aligned, at the floor scale', async ({ page }) => {
  await openSeats(page, readSeed().zoomHallEventId);
  for (let i = 0; i < 4; i++) await page.getByLabel('Zoom in').click(); // zoom away
  await page.getByLabel('Fit view').click();
  const vp = await page.getByTestId('seat-map-viewport').boundingBox();
  const stage = await page.getByTestId('stage-bar').boundingBox();
  expect(stage.width / vp.width).toBeGreaterThan(0.9);   // ~96% of the width
  expect(stage.y - vp.y).toBeLessThan(80);               // stage top-aligned
  const fit = await scaleOf(page);
  await page.getByLabel('Zoom out').click();             // cannot go below the fitted floor
  expect(await scaleOf(page)).toBeCloseTo(fit, 2);
});
