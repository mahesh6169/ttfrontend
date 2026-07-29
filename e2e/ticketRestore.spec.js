// Tickets page restores the active reservation on EVERY arrival — see featureplans/fix-events-ticketpage-restore.md.
// Reproduces the owner's return-navigation journey (not just browser refresh, which the bundle AC16 covers).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };

// Each test starts from a clean slate (no leftover reservation from a prior test/spec).
const clearReservation = async (page, eventId) => {
  const res = await page.request.get(`${API}/events/${eventId}/reservation`, { headers: KEY });
  if (res.ok()) {
    const body = await res.json();
    if (body?.reservation?._id) {
      await page.request.delete(`${API}/events/${eventId}/reservation/${body.reservation._id}`, { headers: KEY });
    }
  }
};

// The bundleRestore event has FamilyFour (pack of 4) + General (single) — exactly "1 pack + 1 single".
const ffQty = (page) =>
  page.getByRole('button', { name: 'Add one FamilyFour pack' }).locator('xpath=preceding-sibling::span[1]');
const genQty = (page) =>
  page.getByRole('button', { name: 'Add one General' }).locator('xpath=preceding-sibling::span[1]');

test.beforeEach(async ({ page }) => {
  const seed = readSeed();
  await clearReservation(page, seed.bundleRestoreEventId);
  await clearReservation(page, seed.bundleRestoreSeatedEventId);
});

// Reusable return-navigation restore check for a given event id.
async function returnNavRestore(page, eventId) {
  await page.goto(`/events/views/${eventId}`);
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

  await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();
  await expect(ffQty(page)).toHaveText('1');
  await page.getByRole('button', { name: 'Add one General' }).click();
  await expect(genQty(page)).toHaveText('1');
  await expect(page.getByText(/5 tickets selected/)).toBeVisible();

  await page.goto('/events');
  await page.goto(`/events/views/${eventId}`);
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

  await expect(page.getByText(/5 tickets selected/)).toBeVisible({ timeout: 15_000 });
  await expect(ffQty(page)).toHaveText('1', { timeout: 15_000 });
  await expect(genQty(page)).toHaveText('1');
}

test('AC1b return-navigation restore on a SEATED event (arms the clear-stale effect)', async ({ page }) => {
  await returnNavRestore(page, readSeed().bundleRestoreSeatedEventId);
});

test('AC1 the held reservation restores its steppers after return-navigation', async ({ page }) => {
  const eventId = readSeed().bundleRestoreEventId;

  await page.goto(`/events/views/${eventId}`);
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

  await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();
  await expect(ffQty(page)).toHaveText('1');
  await page.getByRole('button', { name: 'Add one General' }).click();
  await expect(genQty(page)).toHaveText('1');
  await expect(page.getByText(/5 tickets selected/)).toBeVisible();

  // Leave the tickets page entirely (fully tears it down — no bfcache), then return via the event
  // page and re-enter through Purchase Tickets, exactly like the owner's journey.
  await page.goto('/events');
  await page.goto(`/events/views/${eventId}`);
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

  // Steppers must agree with the banner: pack 1, single 1, banner still 5.
  await expect(page.getByText(/5 tickets selected/)).toBeVisible({ timeout: 15_000 });
  await expect(ffQty(page)).toHaveText('1', { timeout: 15_000 });
  await expect(genQty(page)).toHaveText('1');
});

test('AC2 the restored selection is live — adjusting after return updates the reservation', async ({ page }) => {
  const eventId = readSeed().bundleRestoreEventId;

  await page.goto(`/events/views/${eventId}`);
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });
  await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();
  await page.getByRole('button', { name: 'Add one General' }).click();
  await expect(page.getByText(/5 tickets selected/)).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(genQty(page)).toHaveText('1', { timeout: 15_000 });

  // Remove the single -> reservation drops to the pack's 4, banner follows.
  await page.getByRole('button', { name: 'Remove one General' }).click();
  await expect(page.getByText(/4 tickets selected/)).toBeVisible({ timeout: 15_000 });
  await expect(ffQty(page)).toHaveText('1');
});
