// Seat configuration locks on first sale, free before it - see featureplans/fix-events-seatmap-salelock.md.
// The builder is fully editable on an existing UNSOLD event; on a SOLD event the whole builder is
// read-only with a plain lock message. Reached by editing a seeded event as the owning organiser.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

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

test('AC5 an existing UNSOLD event is fully editable: calculator + row list edit, and numbers rebuild the hall', async ({ page }) => {
  const seed = readSeed();
  // builderParityEvent has a layout (A,B) with an organiser-RESERVED seat but no SALE - not a lock reason.
  await gotoStep3(page, seed.builderParityEventId);
  await openBuilder(page);

  await expect(page.getByTestId('builder-locked')).toHaveCount(0); // not locked
  await expect(page.getByLabel('Number Of Rows')).toBeEnabled();             // calculator editable
  await expect(page.getByLabel('Row 1 label')).toBeEnabled();      // row list editable (no frozen rows)

  // The calculator works on an existing event: Clear the current hall, then Add a fresh one.
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByLabel('Number Of Rows').fill('3');
  await page.getByLabel('Seats Per Row').fill('6');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Seat C6', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seat C7', exact: true })).toHaveCount(0);
});

// events-edit-locking.md (revised): once a seat sells the whole layout freezes (the hall is a fixed
// room); only reserving/releasing the still-free seats stays live. The builder is not fully read-only.
test('AC6 an event with a SOLD seat freezes the whole layout; the sold seat is frozen', async ({ page }) => {
  const seed = readSeed();
  // builderSoldEvent has a booked seat (A-3).
  await gotoStep3(page, seed.builderSoldEventId);
  await openBuilder(page);

  await expect(page.getByTestId('builder-locked')).toBeVisible();
  await expect(page.getByTestId('builder-locked')).toContainText(/sold/i);
  await expect(page.getByLabel('Number Of Rows')).toBeDisabled();                 // bulk calculator off
  await expect(page.getByLabel('Row 1 label')).toBeDisabled();                    // row labels frozen
  await expect(page.getByLabel('Row 2 label')).toBeDisabled();                    // every row frozen, not just booked ones
  await expect(page.getByRole('button', { name: 'Seat A3', exact: true })).toBeDisabled(); // sold seat frozen
});
