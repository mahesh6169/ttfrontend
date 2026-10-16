// The create/edit event wizard: its frame and steps, step-by-step validation, the Refund & Terms
// step, and activity-based edit locking. Driven in EDIT mode on seeded events as the owning organiser
// (editing bypasses the Stripe gate + Google Places); the same StepManager + step components run the
// add-mode validation, so this proves the rules.
import { test, expect } from '@playwright/test';
import { readSeed, openEdit } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

const next = (page) => page.getByRole('button', { name: 'Next' }).click();

// Reach Step 3 (Registration) of a seeded event in edit mode (Steps 1 + 2 are valid on the seed).
const gotoStep3 = async (page, id) => {
  await openEdit(page, id);
  await next(page);
  await next(page);
};
// Step 3 of a seeded PAID event, waiting for the tickets form.
const gotoTicketsStep = async (page, id) => {
  await gotoStep3(page, id);
  await expect(page.getByPlaceholder('Max per order')).toBeVisible({ timeout: 15_000 });
};
// Click Next until it is gone (the last step), waiting for each transition.
const gotoLastStep = async (page) => {
  let guard = 0;
  while ((await page.getByRole('button', { name: 'Next' }).count()) > 0 && guard < 6) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
    guard++;
  }
};
// A date `years` in the past, as the yyyy-mm-dd a native date input expects.
const pastDate = (years = 2) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

test.describe('wizard steps', () => {
  test('walking the steps keeps the title, swaps Cancel for Previous, and ends on Update (Add Event when creating)', async ({ page }) => {
    const id = readSeed().builderEmptyEventId;
    await page.goto(`/events/edit/${id}`);
    await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible({ timeout: 20_000 });

    // Step 1: the only Cancel is in the bottom toolbar.
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(1);

    // Step 2: Previous replaces Cancel and the title is still there.
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);

    // Last step: the primary button reads Update, not Next.
    await gotoLastStep(page);
    await expect(page.getByRole('button', { name: 'Update', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);

    // Create mode shows "Add Event".
    await page.goto('/events/add');
    await expect(page.getByRole('heading', { name: 'Add Event' })).toBeVisible({ timeout: 20_000 });
  });

  test('the last step is Refund & Terms with an optional Terms and Conditions box after Additional Refund Policy', async ({ page }) => {
    const T_AND_C = 'E2E TERMS: no outside food or drink; entry subject to venue conditions.';
    await page.goto(`/events/edit/${readSeed().termsEventId}`);
    await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });

    await gotoLastStep(page);

    // The step is titled "Refund & Terms" (the stepper label).
    await expect(page.getByText('Refund & Terms').first()).toBeVisible();

    // A "Terms and Conditions" textarea, optional, capped at 2000, sits after "Additional Refund Policy".
    await expect(page.getByText('Additional Refund Policy')).toBeVisible();
    const tcBox = page.getByPlaceholder(/venue conditions/i);
    await expect(page.getByText('Terms and Conditions')).toBeVisible();
    await expect(tcBox).toHaveAttribute('maxlength', '2000');
    const arpY = (await page.getByText('Additional Refund Policy').boundingBox()).y;
    const tcY = (await page.getByText('Terms and Conditions').boundingBox()).y;
    expect(tcY).toBeGreaterThan(arpY);
    // The seeded value loads (editable, no requirement).
    await expect(tcBox).toHaveValue(T_AND_C);
  });
});

test.describe('validation', () => {
  test('an empty title blocks Next with an inline error and exactly one step toast', async ({ page }) => {
    await openEdit(page, readSeed().builderEmptyEventId);
    await page.getByPlaceholder('Enter event title').fill('');
    await next(page);
    await expect(page.getByText('Title is required')).toBeVisible();
    // Exactly one step toast, and the inline field error carries its own message (no field toast).
    await expect(page.getByText('Please complete the required fields on this step.')).toBeVisible();
    await expect(page.getByText('Please complete the required fields on this step.')).toHaveCount(1);
    // Still on Step 1 (the title field is still shown).
    await expect(page.getByPlaceholder('Enter event title')).toBeVisible();
  });

  test('the organiser step needs a name, an Australian mobile and a valid https website', async ({ page }) => {
    await openEdit(page, readSeed().builderEmptyEventId);
    await next(page); // Step 1 is valid on the seeded event -> Step 2
    await expect(page.getByPlaceholder('Your name or organisation name')).toBeVisible({ timeout: 15_000 });

    // An empty organiser name blocks Next inline.
    await page.getByPlaceholder('Your name or organisation name').fill('');
    await next(page);
    await expect(page.getByText('Name is required')).toBeVisible();
    await page.getByPlaceholder('Your name or organisation name').fill('Test Organiser');

    // A landline is rejected.
    await page.getByPlaceholder('+61 4XX XXX XXX').fill('02 9876 5432');
    await next(page);
    await expect(page.getByText(/valid Australian mobile/i)).toBeVisible();

    // A spaced 04 mobile passes (no phone error, advances off Step 2).
    await page.getByPlaceholder('+61 4XX XXX XXX').fill('0412 345 678');
    await next(page);
    await expect(page.getByText(/valid Australian mobile/i)).toHaveCount(0);

    // Website: back on a fresh Step 2, a non-URL is rejected and an https URL passes.
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

  test('the tickets step shows inline errors for max per order, price, duplicate name, past dates and a too-cheap bundle', async ({ page }) => {
    test.setTimeout(180_000); // six fresh trips to Step 3
    const id = readSeed().builderEmptyEventId;

    // Max per order must be a whole number and cannot exceed capacity (400).
    await gotoTicketsStep(page, id);
    await page.getByPlaceholder('Max per order').fill('2.5');
    await next(page);
    await expect(page.getByText(/whole number/i)).toBeVisible();
    await page.getByPlaceholder('Max per order').fill('9999');
    await next(page);
    await expect(page.getByText(/can't be more than the capacity/i)).toBeVisible();
    await page.getByPlaceholder('Max per order').fill('5');
    await next(page);
    await expect(page.getByText(/whole number|can't be more than the capacity/i)).toHaveCount(0);

    // A ticket price rejects >2 decimals and anything under $1.
    await gotoTicketsStep(page, id);
    await page.getByRole('button', { name: 'Edit ticket type' }).click();
    const price = page.getByPlaceholder('0.00');
    await price.fill('10.999');
    await expect(page.getByText('Maximum 2 decimal places allowed')).toBeVisible();
    await price.fill('0.50');
    await expect(page.getByText('Minimum ticket price is $1')).toBeVisible();

    // A duplicate ticket name blocks Done.
    await gotoTicketsStep(page, id);
    await page.getByRole('button', { name: 'Add Ticket Type' }).click();
    await page.getByPlaceholder('Early Bird').fill('Standard'); // same as the seeded ticket
    await page.getByPlaceholder('0.00').fill('10');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(/name already exists/i)).toBeVisible();

    // A ticket sale start date in the past blocks Done.
    await gotoTicketsStep(page, id);
    await page.getByRole('button', { name: 'Edit ticket type' }).click();
    await page.locator('input[type="date"]').first().fill(pastDate()); // Start date
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(/Start date can't be in the past/i)).toBeVisible();

    // A bundle whose per-person share is under $1 blocks Done with the sizing wording. A $1 pack of 2
    // leaves each person $0.50; size 2 stays within the per-order limit (5), so the floor is what fires.
    await gotoTicketsStep(page, id);
    await page.getByRole('button', { name: 'Edit ticket type' }).click();
    await page.getByPlaceholder('0.00').fill('1');
    await page.getByRole('checkbox', { name: /Sell as a bundle/i }).check();
    await page.getByPlaceholder('4').fill('2');
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(/Bundle price must be at least \$2 -/)).toBeVisible();

    // A discount valid-from date in the past blocks Done.
    await gotoTicketsStep(page, id);
    await page.getByRole('button', { name: 'Add Discount Code' }).click();
    await page.getByPlaceholder('e.g. 10OFF').fill('SAVE10');
    await page.getByPlaceholder('10', { exact: true }).fill('10'); // 10% off the $10 ticket = $9, above the $1 floor
    await page.getByRole('checkbox', { name: 'Standard' }).check();
    await page.locator('input[type="date"]').first().fill(pastDate()); // Valid from
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText(/Valid from can't be in the past/i)).toBeVisible();
  });

  test('a paid event needs an explicit refund policy choice before it can be saved', async ({ page }) => {
    await openEdit(page, readSeed().noRefundEventId);
    await gotoLastStep(page);
    // The seeded event has no refund policy; the final action is blocked until one is chosen.
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page.getByText(/select a refund policy/i)).toBeVisible();
  });
});

// The edit form disables what the server locks once an event has activity (courtesy over the wall).
test.describe('edit locking after sales', () => {
  test('a sold ticket type is locked with a "tickets have sold" reason while an unsold one stays editable', async ({ page }) => {
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

  test('capacity cannot go below the people already registered, with an inline reason', async ({ page }) => {
    await gotoStep3(page, readSeed().editLockCapacityEventId); // 5 confirmed tickets -> floor is 5

    const capacity = page.getByPlaceholder('0 = unlimited');
    await expect(capacity).toHaveAttribute('min', '5');

    await capacity.fill('3'); // below the 5 committed
    await expect(page.getByText(/can't be lower than the 5 people already registered/i)).toBeVisible();

    await capacity.fill('50'); // back above the floor - reason clears
    await expect(page.getByText(/already registered/i)).toHaveCount(0);
  });

  test('on an active event the title, and a sold type\'s note and sale dates, stay editable', async ({ page }) => {
    await openEdit(page, readSeed().editLockSoldEventId); // has activity + a sold type
    // Step 1: the title stays editable after activity.
    await expect(page.getByPlaceholder('Enter event title')).toBeEnabled();

    await next(page);
    await next(page);
    await expect(page.getByPlaceholder('Max per order')).toBeVisible({ timeout: 15_000 });

    // Open the sold type: its name is locked but its note and sale dates remain editable.
    await page.getByRole('button', { name: 'Edit ticket type' }).first().click();
    await expect(page.getByPlaceholder('Early Bird')).toBeDisabled();
    await expect(page.getByPlaceholder('e.g. Includes dinner, 18+ only')).toBeEnabled();
    await expect(page.locator('input[type="date"]').first()).toBeEnabled();
  });

  test('stopping the only ticket type blocks Next - at least one must stay on sale', async ({ page }) => {
    await gotoStep3(page, readSeed().builderEmptyEventId); // a paid event with one 'Standard' type
    await page.getByRole('button', { name: 'Edit ticket type' }).click();
    await page.getByRole('switch', { name: 'On sale' }).click(); // stop the only type
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText(/at least one ticket type must be on sale/i)).toBeVisible();
  });

  test('a general-admission event with sales does not offer the seat builder', async ({ page }) => {
    await gotoStep3(page, readSeed().editLockCapacityEventId); // non-seated paid event with 5 sold tickets
    await expect(page.getByTestId('seating-locked-out')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat Builder' })).toHaveCount(0);
  });
});
