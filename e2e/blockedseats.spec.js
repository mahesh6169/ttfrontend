// events-blocked-seats.md - not-for-sale (blocked) seats. AC1: the seat builder gains a "Not for sale"
// tab after Reservations; marking a seat by click and by typed range (two-way synced like Reservations)
// persists and re-derives to the blocked status on save, and Matches still passes. AC2: the attendee map
// renders a blocked seat greyed with an X and unclickable. AC6: the shared legend shows "Not for sale"
// on both the builder and the attendee seats page.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.describe('blocked seats - builder (organiser edit)', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const gotoStep3 = async (page, eventId) => {
    await page.goto(`/events/edit/${eventId}`);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Seat Builder' })).toBeVisible({ timeout: 20_000 });
  };
  const openBuilder = async (page) => {
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 15_000 });
  };
  const selectStep = async (page, name) => {
    await page.getByRole('tab', { name }).click();
  };
  const generate = async (page, rows, seats) => {
    await page.getByLabel('Number Of Rows').fill(String(rows));
    await page.getByLabel('Seats Per Row').fill(String(seats));
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('button', { name: `Seat A${seats}`, exact: true })).toBeVisible();
  };

  test('AC1 the Not for sale tab (after Reservations) marks seats by click + typed range, syncs, and persists', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // The four tabs, in order: Layout / Aisles / Reservations / Not for sale (each tab also carries a
    // number badge at desktop width, so match by substring).
    await expect(
      page.getByRole('tablist', { name: 'Seating steps' }).getByRole('tab')
    ).toHaveText([/Layout/, /Aisles/, /Reservations/, /Not for sale/]);

    await generate(page, 10, 40); // 400 = capacity, so the final Save is allowed (Matches passes)
    await selectStep(page, 'Not for sale');

    // Click a seat -> not for sale (grey/X).
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked');

    // Bulk Not for sale merges a range and clears the box (one-time entry), two-way synced with the map.
    await page.getByLabel('Bulk not for sale seats').fill('A4-A6');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByLabel('Bulk not for sale seats')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'blocked');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked'); // merge, not replace

    // Save is allowed (Matches passed with 400 seats even though some are not-for-sale), then reopen
    // -> the not-for-sale list round-trips through the builder (persists like the reserved list).
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await selectStep(page, 'Not for sale');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'blocked');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked');
  });

  test('AC6 (builder) the map legend shows a Not for sale entry', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 5);
    await expect(page.getByTestId('map-legend')).toContainText('Not for sale');
  });
});

test.describe('blocked seats - attendee map (member)', () => {
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
  const openSeats = async (page, eventId) => {
    await page.goto(`/events/tickets/${eventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
    await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
  };

  test.beforeEach(async ({ page }) => {
    await clearReservation(page, readSeed().blockedSeatEventId);
  });

  test('AC2 the attendee map renders a blocked seat greyed with an X and unclickable', async ({ page }) => {
    await openSeats(page, readSeed().blockedSeatEventId);
    // A-1 is not for sale: its accessible name says so and the button is disabled (unclickable).
    const blocked = page.getByRole('button', { name: 'A1 - Not for sale' });
    await expect(blocked).toBeVisible();
    await expect(blocked).toBeDisabled();
    // A normal seat is still selectable, proving the map itself works.
    await expect(page.getByRole('button', { name: 'A2 - Available (tap to select)' })).toBeVisible();
  });

  test('AC6 (attendee) the shared seat legend shows a Not for sale entry', async ({ page }) => {
    await openSeats(page, readSeed().blockedSeatEventId);
    await expect(page.getByTestId('seats-legend')).toContainText('Not for sale');
  });
});
