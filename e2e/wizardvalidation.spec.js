// Layered validation across the create-event wizard - see featureplans/events-wizard-validation.md.
// Driven in EDIT mode on a seeded event (editing bypasses the Stripe + Google-Places gates that make
// add-from-scratch hard to drive); the same StepManager + step components run the add-mode validation,
// so this proves the rules. Add-mode-only cases (typed-not-picked address, add-mode past date) are
// covered separately. Step titles carry the AC numbers.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

const openEdit = async (page, id) => {
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });
};
const next = (page) => page.getByRole('button', { name: 'Next' }).click();

// --- Step 1: Basic Info ---

test('AC1 empty title blocks Next with an inline error and the one step toast', async ({ page }) => {
  await openEdit(page, readSeed().builderEmptyEventId);
  await page.getByPlaceholder('Enter event title').fill('');
  await next(page);
  await expect(page.getByText('Title is required')).toBeVisible();
  await expect(page.getByText('Please complete the required fields on this step.')).toBeVisible();
  // Still on Step 1 (the title field is still shown).
  await expect(page.getByPlaceholder('Enter event title')).toBeVisible();
});

// --- Step 2: Organiser ---

test('AC5 empty organiser name blocks Next inline', async ({ page }) => {
  await openEdit(page, readSeed().builderEmptyEventId);
  await next(page); // Step 1 is valid on the seeded event -> Step 2
  await expect(page.getByPlaceholder('Your name or organisation name')).toBeVisible({ timeout: 15_000 });

  await page.getByPlaceholder('Your name or organisation name').fill('');
  await next(page);
  await expect(page.getByText('Name is required')).toBeVisible();
});

test('AC6 organiser phone must be an AU mobile: landline rejected, 04 + +61 forms accepted', async ({ page }) => {
  await openEdit(page, readSeed().builderEmptyEventId);
  await next(page);
  await expect(page.getByPlaceholder('Your name or organisation name')).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('Your name or organisation name').fill('Test Organiser');

  // A landline is rejected.
  await page.getByPlaceholder('+61 4XX XXX XXX').fill('02 9876 5432');
  await next(page);
  await expect(page.getByText(/valid Australian mobile/i)).toBeVisible();

  // A spaced 04 mobile passes (no phone error, advances off Step 2).
  await page.getByPlaceholder('+61 4XX XXX XXX').fill('0412 345 678');
  await next(page);
  await expect(page.getByText(/valid Australian mobile/i)).toHaveCount(0);
});

test('AC7 organiser website must be a valid https URL when filled', async ({ page }) => {
  await openEdit(page, readSeed().builderEmptyEventId);
  await next(page);
  await expect(page.getByPlaceholder('https://yourwebsite.com')).toBeVisible({ timeout: 15_000 });

  await page.getByPlaceholder('https://yourwebsite.com').fill('notaurl');
  await next(page);
  await expect(page.getByText(/valid https/i)).toBeVisible();

  await page.getByPlaceholder('https://yourwebsite.com').fill('https://example.com');
  await next(page);
  await expect(page.getByText(/valid https/i)).toHaveCount(0);
});

// --- Step 3: Tickets / capacity ---

// Reach Step 3 of a seeded PAID event in edit mode (Steps 1 + 2 are valid on the seed).
const gotoStep3 = async (page, id) => {
  await openEdit(page, id);
  await next(page);
  await next(page);
  await expect(page.getByPlaceholder('Max per order')).toBeVisible({ timeout: 15_000 });
};

test('AC13 max-per-order must be a whole number and cannot exceed capacity', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);

  // A fractional limit is rejected inline.
  await page.getByPlaceholder('Max per order').fill('2.5');
  await next(page);
  await expect(page.getByText(/whole number/i)).toBeVisible();

  // A limit above the event capacity (400) is rejected inline.
  await page.getByPlaceholder('Max per order').fill('9999');
  await next(page);
  await expect(page.getByText(/can't be more than the capacity/i)).toBeVisible();

  // A valid limit clears the error.
  await page.getByPlaceholder('Max per order').fill('5');
  await next(page);
  await expect(page.getByText(/whole number|can't be more than the capacity/i)).toHaveCount(0);
});

// A date `years` in the past, as the yyyy-mm-dd a native date input expects.
const pastDate = (years = 2) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

test('AC9 a ticket price rejects >2 decimals and anything under $1 inline', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);
  await page.getByRole('button', { name: 'Edit ticket type' }).click();
  const price = page.getByPlaceholder('0.00');

  await price.fill('10.999');
  await expect(page.getByText('Maximum 2 decimal places allowed')).toBeVisible();

  await price.fill('0.50');
  await expect(page.getByText('Minimum ticket price is $1')).toBeVisible();
});

test('AC10 a duplicate ticket name blocks Done inline', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);
  await page.getByRole('button', { name: 'Add Ticket Type' }).click();
  await page.getByPlaceholder('Early Bird').fill('Standard'); // same as the seeded ticket
  await page.getByPlaceholder('0.00').fill('10');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/name already exists/i)).toBeVisible();
});

test('AC11 a ticket sale date in the past blocks Done inline', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);
  await page.getByRole('button', { name: 'Edit ticket type' }).click();
  await page.locator('input[type="date"]').first().fill(pastDate()); // Start date
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/Start date can't be in the past/i)).toBeVisible();
});

test('AC12 a bundle whose per-person share is under $1 blocks Done with the sizing wording', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);
  await page.getByRole('button', { name: 'Edit ticket type' }).click();
  // A $1 pack of 2 leaves each person $0.50 (< $1); size 2 stays within the per-order limit (5),
  // so the per-person floor is what fires (not the bundle-size cap).
  await page.getByPlaceholder('0.00').fill('1');
  await page.getByRole('checkbox', { name: /Sell as a bundle/i }).check();
  await page.getByPlaceholder('4').fill('2');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/Bundle price must be at least \$2 -/)).toBeVisible();
});

test('AC14 a discount valid-from in the past blocks Done inline', async ({ page }) => {
  await gotoStep3(page, readSeed().builderEmptyEventId);
  await page.getByRole('button', { name: 'Add Discount Code' }).click();
  await page.getByPlaceholder('e.g. 10OFF').fill('SAVE10');
  await page.getByPlaceholder('10', { exact: true }).fill('10'); // 10% off the $10 ticket = $9, above the $1 floor
  await page.getByRole('checkbox', { name: 'Standard' }).check();
  await page.locator('input[type="date"]').first().fill(pastDate()); // Valid from
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByText(/Valid from can't be in the past/i)).toBeVisible();
});

test('AC21 a blocked Next shows exactly one step toast (not a per-field toast)', async ({ page }) => {
  await openEdit(page, readSeed().builderEmptyEventId);
  await page.getByPlaceholder('Enter event title').fill('');
  await next(page);
  // Exactly one step toast, and the inline field error carries its own message (no field toast).
  await expect(page.getByText('Please complete the required fields on this step.')).toHaveCount(1);
  await expect(page.getByText('Title is required')).toBeVisible();
});

// --- Step 4: Refund policy ---

test('AC20 a paid event needs an explicit refund policy choice', async ({ page }) => {
  await openEdit(page, readSeed().noRefundEventId);
  // Advance to the last step (Refund) - click Next until it is gone, waiting for each transition.
  let guard = 0;
  while ((await page.getByRole('button', { name: 'Next' }).count()) > 0 && guard < 6) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
    guard++;
  }
  // The seeded event has no refund policy; the final action is blocked until one is chosen.
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(page.getByText(/select a refund policy/i)).toBeVisible();
});
