import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from './helpers.js';

// Flagship paid journey: member buys a ticket end to end with Stripe's 4242 test card, then the DB
// is checked for the issued ticket and invoice. Zero real money (test mode).
test.use({ storageState: 'e2e/.auth/member.json' });

test('member buys a paid ticket end to end (4242 test card)', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.paidEventId}`);
  await page.waitForLoadState('networkidle');

  // Detail -> tickets page.
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.paidEventId}`), { timeout: 15_000 });

  // Bump quantity to 1 (the + button is labelled "Add one <ticket type>").
  await page.getByRole('button', { name: 'Add one Standard' }).click();

  // Proceed to checkout.
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${seed.paidEventId}`), { timeout: 15_000 });

  // Buyer details (fill even if prefilled from the member account).
  await page.getByPlaceholder('First name').fill('Buyer');
  await page.getByPlaceholder('Last name').fill('Tester');
  await page.getByPlaceholder('Email address').fill('buyer-e2e@test.dev');
  await page.getByPlaceholder('Phone number').fill('0412345678');
  for (const cb of await page.getByRole('checkbox').all()) {
    await cb.check().catch(() => {});
  }
  await page.getByRole('button', { name: /Continue to Payment/ }).click();

  // Stripe CardElement (single iframe). Fill the 4242 test card.
  const stripe = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');
  await stripe.getByPlaceholder(/ZIP|Postal/).fill('2000').catch(() => {});

  await page.getByRole('button', { name: /Complete Payment/ }).click();

  // Success.
  await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 45_000 });

  // Verify the money artefacts exist in the test DB.
  expect(dbCount('paidTickets', seed.paidEventId)).toBeGreaterThanOrEqual(1);
  expect(dbCount('invoices', seed.paidEventId)).toBeGreaterThanOrEqual(1);
});
