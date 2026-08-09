// Seat count sync when ticket quantity changes mid-flow - see featureplans/fix-events-seatcount-sync.md.
// The seats page must always read the required-seat count from the LIVE reservation (not a value
// captured on first visit), and reconcile held seats when the buyer changes quantity: an increase
// keeps the held seats and allows more; a decrease drops the excess and releases those holds.
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

const addStandard = (page, n) => (async () => {
  for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Add one Standard' }).click();
})();
const removeStandard = (page, n) => (async () => {
  for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Remove one Standard' }).click();
})();
const pickSeats = async (page, seats) => {
  for (const s of seats) {
    await page.getByRole('button', { name: `${s} - Available (tap to select)` }).click();
  }
};
const gotoSeats = async (page, eventId) => {
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
};

test.beforeEach(async ({ page }) => {
  await clearReservation(page, readSeed().seatSyncEventId);
});

// AC1 - increase after holding seats: held seats stay, the extra seat selects, Proceed enables at 6.
test('AC1 raising tickets 5 -> 6 after holding 5 seats lets the 6th seat be selected and Proceed enable', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
  await addStandard(page, 5);
  await expect(page.getByText(/5 tickets selected/)).toBeVisible({ timeout: 20_000 });
  await gotoSeats(page, seed.seatSyncEventId);

  await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5']);
  await expect(page.getByText(/5 of 5 seats selected/)).toBeVisible({ timeout: 15_000 });

  // Back to tickets, raise to 6.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.seatSyncEventId}`), { timeout: 15_000 });
  await addStandard(page, 1);
  await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 15_000 });

  // Return to seats: the 5 held seats stay selected, the count is 5 of 6 (live), and the 6th selects.
  await gotoSeats(page, seed.seatSyncEventId);
  await expect(page.getByText(/5 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'A6 - Available (tap to select)' }).click();
  await expect(page.getByText('You can only select 5 seats')).toHaveCount(0);
  await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
});

// AC2 - decrease after holding seats: held seats reconcile DOWN to the new count and Proceed enables.
test('AC2 lowering tickets 6 -> 4 after holding 6 seats reconciles to 4 and Proceed enables', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
  await addStandard(page, 6);
  await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 20_000 });
  await gotoSeats(page, seed.seatSyncEventId);

  await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
  await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.seatSyncEventId}`), { timeout: 15_000 });
  await removeStandard(page, 2);
  await expect(page.getByText(/4 tickets selected/)).toBeVisible({ timeout: 15_000 });

  // Return to seats: the held seats reconcile to exactly 4 and Proceed enables.
  await gotoSeats(page, seed.seatSyncEventId);
  await expect(page.getByText(/4 of 4 seats selected/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
});

// AC4 - the exact-match Proceed gate reads the live count: 5 of 6 stays disabled, 6 of 6 enables.
test('AC4 with 6 tickets reserved, Proceed is disabled at 5 seats and enables at exactly 6', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
  await addStandard(page, 6);
  await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 20_000 });
  await gotoSeats(page, seed.seatSyncEventId);

  await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5']);
  await expect(page.getByText(/5 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeDisabled();

  await page.getByRole('button', { name: 'A6 - Available (tap to select)' }).click();
  await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
});
