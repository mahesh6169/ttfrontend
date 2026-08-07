// Acceptance suite for featureplans/events-seats-ui.md — the restructured /events/seats page:
// page toolbar, header order (capacity/timer centred -> legend left-aligned -> map), the timer as an
// urgency badge, and the sticky "Proceed to Payment" bar. The seat map itself (selection/socket/zoom)
// is unchanged. Runs as a logged-in member. Each test title starts with its acceptance-criterion number.
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

// Reach the seats page with `qty` Standard tickets held (the zoom-hall event is seated, capacity 400).
const openSeats = async (page, eventId, qty = 1) => {
  await page.goto(`/events/tickets/${eventId}`);
  for (let i = 0; i < qty; i++) {
    await page.getByRole('button', { name: 'Add one Standard' }).click();
  }
  await expect(page.getByText(new RegExp(`${qty} ticket${qty === 1 ? '' : 's'} selected`)))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
};

test.beforeEach(async ({ page }) => {
  await clearReservation(page, readSeed().zoomHallEventId);
});

// AC1 — as the seat count changes on the map, the sticky bar shows "N of M seats selected".
test('AC1 sticky bar shows the live "N of M seats selected" count', async ({ page }) => {
  const id = readSeed().zoomHallEventId;
  await openSeats(page, id, 2);

  const bar = page.getByTestId('seats-cta-bar');
  await expect(bar).toContainText('0 of 2 seats selected', { timeout: 20_000 });

  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(bar).toContainText('1 of 2 seats selected', { timeout: 20_000 });

  await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
  await expect(bar).toContainText('2 of 2 seats selected', { timeout: 20_000 });
});

// AC2 — "Proceed to Payment" is disabled until the required number of seats is selected.
test('AC2 proceed is gated on selecting the required number of seats', async ({ page }) => {
  const id = readSeed().zoomHallEventId;
  await openSeats(page, id, 2);

  const proceed = page.getByRole('button', { name: 'Proceed to Payment' });
  await expect(proceed).toBeDisabled({ timeout: 20_000 });

  await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
  await expect(proceed).toBeDisabled(); // only 1 of 2

  await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
  await expect(proceed).toBeEnabled({ timeout: 20_000 });
});

// AC3 — the Proceed bar stays pinned to the bottom, and on mobile the bottom nav is hidden on the flow.
test('AC3 sticky bar is pinned and the mobile bottom nav is hidden on the flow', async ({ page }) => {
  const id = readSeed().zoomHallEventId;
  await page.setViewportSize({ width: 390, height: 780 });
  await openSeats(page, id, 1);

  const bar = page.getByTestId('seats-cta-bar');
  await expect(bar).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('bottom-nav')).toHaveCount(0);

  const atBottom = async () => {
    const box = await bar.boundingBox();
    const vh = page.viewportSize().height;
    expect(Math.abs((box.y + box.height) - vh)).toBeLessThanOrEqual(2);
  };
  await atBottom();
  await page.evaluate(() => window.scrollBy(0, 500)); // scroll the page, not the map's own wheel-zoom
  await atBottom();
});

// AC4 — three stacked rows above the map: the timer + selected-seats header, then the legend on its
// own row, then the map. The "N of M" count is not duplicated in the header — it lives in the bar.
test('AC4 header order: timer / selected-seats -> legend -> map (three rows)', async ({ page }) => {
  const id = readSeed().zoomHallEventId;
  await page.setViewportSize({ width: 1024, height: 900 });
  await openSeats(page, id, 1);

  const status = await page.getByTestId('seats-status-row').boundingBox();
  const legend = await page.getByTestId('seats-legend').boundingBox();
  const map = await page.getByTestId('seats-map').boundingBox();

  // Stacked, in order: the timer/selected-seats header, then the legend, then the map.
  expect(status.y + status.height).toBeLessThanOrEqual(legend.y + 1);
  expect(legend.y + legend.height).toBeLessThanOrEqual(map.y + 1);

  // The timer renders in the header; the legend renders on its own row above the map.
  await expect(page.getByTestId('reservation-timer')).toBeVisible();
  await expect(page.getByTestId('seats-legend').getByText('Available', { exact: true })).toBeVisible();

  // The count is NOT repeated in the header (it lives only in the sticky bar).
  await expect(page.getByTestId('seats-status-row').getByText(/seats selected/i)).toHaveCount(0);
});

// AC5 — the reservation timer shows as an amber badge, turning red under one minute.
test('AC5 timer is an amber urgency badge, red under one minute', async ({ page }) => {
  const id = readSeed().zoomHallEventId;

  // Default 15-minute hold -> amber badge on load.
  await openSeats(page, id, 1);
  await expect(page.getByTestId('reservation-timer')).toHaveClass(/amber/, { timeout: 20_000 });
});

test('AC5 timer turns red when under one minute remains', async ({ page }) => {
  const id = readSeed().zoomHallEventId;

  // Force the reservation to expire in ~45s (only the GET reservation payload is tweaked) so the same
  // badge renders red, proving the under-one-minute threshold without waiting out a real 15-min hold.
  await page.route(/\/events\/[^/]+\/reservation$/, async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const resp = await route.fetch();
    let body;
    try { body = await resp.json(); } catch { return route.fulfill({ response: resp }); }
    if (body?.reservation) body.reservation.expiresAt = new Date(Date.now() + 45_000).toISOString();
    return route.fulfill({ response: resp, json: body });
  });

  await openSeats(page, id, 1);
  await expect(page.getByTestId('reservation-timer')).toHaveClass(/red/, { timeout: 20_000 });
});

// AC6 — at 360px there is no horizontal page scroll (the seat map pans inside its own box).
test('AC6 no horizontal page scroll at 360px', async ({ page }) => {
  const id = readSeed().zoomHallEventId;
  await page.setViewportSize({ width: 360, height: 780 });
  await openSeats(page, id, 1);

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
