// Activity-based edit locking - see featureplans/events-edit-locking.md.
// The edit form disables what the server locks (courtesy over the wall). Driven in EDIT mode on
// seeded events owned by the known-credential organiser. Test titles carry the AC numbers.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

const openEdit = async (page, id) => {
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });
};
const next = (page) => page.getByRole('button', { name: 'Next' }).click();

// Reach Step 3 (Registration) of a seeded event in edit mode (Steps 1 + 2 are valid on the seed).
const gotoStep3 = async (page, id) => {
  await openEdit(page, id);
  await next(page);
  await next(page);
};

test('AC6 a sold ticket type is disabled with a "tickets have sold" reason; an unsold one is editable', async ({ page }) => {
  await gotoStep3(page, readSeed().editLockSoldEventId);

  // Two collapsed types: "Sold" (hasSold) then "Open". Open the sold one (first edit button).
  await expect(page.getByRole('button', { name: 'Edit ticket type' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Edit ticket type' }).first().click();

  // Its name + price are disabled and the reason shows.
  await expect(page.getByPlaceholder('Early Bird')).toBeDisabled();
  await expect(page.getByPlaceholder('0.00')).toBeDisabled();
  await expect(page.getByText(/tickets have sold/i)).toBeVisible();

  // Now open the unsold "Open" type (the remaining edit button) - its name is editable.
  await page.getByRole('button', { name: 'Edit ticket type' }).click();
  await expect(page.getByPlaceholder('Early Bird')).toBeEnabled();
});

test('AC10 the capacity field floors at the committed count and shows an inline reason below it', async ({ page }) => {
  await gotoStep3(page, readSeed().editLockCapacityEventId); // 5 confirmed tickets -> floor is 5

  const capacity = page.getByPlaceholder('0 = unlimited');
  await expect(capacity).toHaveAttribute('min', '5');

  await capacity.fill('3'); // below the 5 committed
  await expect(page.getByText(/can't be lower than the 5 people already registered/i)).toBeVisible();

  await capacity.fill('50'); // back above the floor - reason clears
  await expect(page.getByText(/already registered/i)).toHaveCount(0);
});

test('AC19 a general-admission event with sales does not offer the seat builder', async ({ page }) => {
  await gotoStep3(page, readSeed().editLockCapacityEventId); // non-seated paid event with 5 sold tickets
  await expect(page.getByTestId('seating-locked-out')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seat Builder' })).toHaveCount(0);
});

test('AC18 stopping the only ticket type blocks Next - at least one must be on sale', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId); // a paid event with one 'Standard' type
  await page.getByRole('button', { name: 'Edit ticket type' }).click();
  await page.getByRole('switch', { name: 'On sale' }).click(); // stop the only type
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText(/at least one ticket type must be on sale/i)).toBeVisible();
});

test('AC16 on an active event the always-editable fields stay open (title; a sold type keeps note + sale dates)', async ({ page }) => {
  await openEdit(page, readSeed().editLockSoldEventId); // has activity + a sold type
  // Step 1: the title stays editable after activity.
  await expect(page.getByPlaceholder('Enter event title')).toBeEnabled();

  await next(page);
  await next(page);
  await expect(page.getByPlaceholder('Max per order')).toBeVisible({ timeout: 15_000 });

  // Open the sold type: its name is locked (AC6) but its note and sale dates remain editable (D13).
  await page.getByRole('button', { name: 'Edit ticket type' }).first().click();
  await expect(page.getByPlaceholder('Early Bird')).toBeDisabled();
  await expect(page.getByPlaceholder('e.g. Includes dinner, 18+ only')).toBeEnabled();
  await expect(page.locator('input[type="date"]').first()).toBeEnabled();
});

test('AC15 once a seat sells the whole layout freezes; only reserving a free seat stays live', async ({ page }) => {
  await gotoStep3(page, readSeed().builderSoldEventId); // row A has a sold seat A-3
  await page.getByRole('button', { name: 'Seat Builder' }).click();
  const overlay = page.getByTestId('seat-builder-overlay');
  await expect(overlay).toBeVisible({ timeout: 15_000 });

  // The sold seat is frozen and the "some seats sold" notice shows.
  await expect(page.getByTestId('builder-locked')).toBeVisible();
  await expect(overlay.getByRole('button', { name: 'Seat A3', exact: true })).toBeDisabled();

  // The whole layout is frozen - bulk tool off, every row's label + count locked.
  await expect(overlay.getByLabel('Number Of Rows')).toBeDisabled();
  await expect(overlay.getByLabel('Row 1 label')).toBeDisabled();
  await expect(overlay.getByLabel('Row 2 label')).toBeDisabled();
  await expect(overlay.getByLabel('Row 2 seat count')).toBeDisabled();

  // The one live action: reserve a still-free seat. Switch to the Reservations tab and click one.
  await overlay.getByRole('tab', { name: /Reservations/i }).click();
  const freeSeat = overlay.getByRole('button', { name: 'Seat B1', exact: true });
  await expect(freeSeat).toBeEnabled();
  await freeSeat.click();
  await expect(freeSeat).toHaveAttribute('data-status', 'reserved');
});

test('AC12 a free event question with answers is label-safe editable (not frozen); a new required question warns', async ({ page }) => {
  await gotoStep3(page, readSeed().editLockQuestionEventId);

  // A free event with answers no longer freezes its questions (events-rsvp-question-editing.md): the
  // existing question shows an Edit control (label-safe editing) - no "locked" note, no Delete.
  await expect(page.getByText('Dietary needs')).toBeVisible();
  await expect(page.getByText(/attendees registered - locked/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit question' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Delete question' })).toHaveCount(0);

  // Adding a new question is allowed; marking it required warns it only covers future registrants.
  // One "Add question" button adds a text question by default; the toggle reads "Required to register".
  await page.getByRole('button', { name: 'Add question' }).click();
  await page.getByLabel('Required to register').check();
  await expect(page.getByText(/only applies to people who register from now on/i)).toBeVisible();
});
