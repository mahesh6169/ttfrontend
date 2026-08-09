// Disabled/blocked controls read as disabled on every device - see featureplans/events-disabled-field-styling.md.
// The signal is the greyed FILL (bg-slate-100) + muted text (slate-500), not a hover cursor - so it holds
// on a mobile viewport. Titles carry the AC numbers.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const MOBILE = { width: 390, height: 844 };
const GREY_BG = 'rgb(241, 245, 249)'; // slate-100
const MUTED = 'rgb(100, 116, 139)';   // slate-500
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

test.describe('paid flow - member, mobile viewport', () => {
  test.use({ storageState: 'e2e/.auth/member.json', viewport: MOBILE });

  test('AC1 a disabled paid proceed button renders greyed (fill + muted text), not merely a cursor', async ({ page }) => {
    const seed = readSeed();
    // ticketsUiEvent has a REQUIRED attendee field, so selecting a ticket without filling it leaves the
    // proceed button disabled and visible - a real disabled state to check.
    await clearReservation(page, seed.ticketsUiEventId);
    await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);
    await page.getByRole('button', { name: 'Add one General' }).click();

    const proceed = page.getByTestId('tickets-proceed');
    await expect(proceed).toBeVisible({ timeout: 20_000 });
    await expect(proceed).toBeDisabled();
    await expect(proceed).toHaveCSS('background-color', GREY_BG);
    await expect(proceed).toHaveCSS('color', MUTED);
  });
});

test.describe('edit wizard - organiser, mobile viewport', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json', viewport: MOBILE });

  test('AC1 a locked field in the edit wizard renders greyed (fill + muted text)', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/edit/${seed.editLockSoldEventId}`);
    await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Edit ticket type' }).first().click(); // the sold type

    const name = page.getByPlaceholder('Early Bird');
    await expect(name).toBeDisabled();
    await expect(name).toHaveCSS('background-color', GREY_BG);
    await expect(name).toHaveCSS('color', MUTED);
  });

  test('AC2 an active (enabled) control is not greyed', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/edit/${seed.editLockSoldEventId}`);
    const title = page.getByPlaceholder('Enter event title');
    await expect(title).toBeEnabled();
    await expect(title).not.toHaveCSS('background-color', GREY_BG); // a usable input is not greyed
  });
});
