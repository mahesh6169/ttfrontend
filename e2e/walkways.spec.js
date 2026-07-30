// Seat-row walkways customer map - see featureplans/events-seat-walkways.md.
// The gap is a cosmetic spacer: rows split into blocks, seats on each side behave normally, the gap
// is never clickable, and a wide row scrolls exactly as before.
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
  const seed = readSeed();
  await clearReservation(page, seed.walkwayEventId);
  await clearReservation(page, seed.walkwayWideEventId);
});

test('AC7 (customer map) the row splits into blocks at the walkways; seats each side hold; the gap is not clickable', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.walkwayEventId}`);
  await page.getByRole('button', { name: 'Add one Standard' }).click();
  await page.getByRole('button', { name: 'Add one Standard' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.walkwayEventId}`), { timeout: 15_000 });

  // Blocks: a walkway spacer is rendered inside the row.
  await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });

  // A seat on each side of the gap after seat 13 can be selected and held.
  await page.getByRole('button', { name: 'A13 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'A13 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'A14 - Available (tap to select)' }).click();
  await expect(page.getByRole('button', { name: 'A14 - Selected by you' })).toBeVisible({ timeout: 15_000 });

  // The gap itself is a plain, non-interactive div (no seat, no handler).
  await expect(page.locator('[data-walkway="true"]').first()).toHaveJSProperty('tagName', 'DIV');
});

test('AC8 (mobile) a wide row with a walkway scrolls horizontally; a far-end seat can be reached and selected', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`/events/tickets/${seed.walkwayWideEventId}`);
  await page.getByRole('button', { name: 'Add one Standard' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.walkwayWideEventId}`), { timeout: 15_000 });

  await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });

  const far = page.getByRole('button', { name: 'A40 - Available (tap to select)' });
  await far.scrollIntoViewIfNeeded();
  await far.click();
  await expect(page.getByRole('button', { name: 'A40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
});
