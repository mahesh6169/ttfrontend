// The two-step checkout (Details -> Payment): stepper, discount codes, buyer gating, order summary,
// terms & conditions, and real end-to-end purchases with Stripe's 4242 test card (zero real money),
// verified in the test DB. Runs as the member.
import { test, expect } from '@playwright/test';
import {
  readSeed, dbCount, dbEditFlags, dbTicketPrices, dbInvoiceTotal, dbSold, dbPackTags,
  clearReservation, gotoCheckoutNonSeated, fillBuyer, payWith4242,
} from '../helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const T_AND_C = 'E2E TERMS: no outside food or drink; entry subject to venue conditions.';

// Reach the checkout of a SEATED event: buy one Standard per seat, pick the given seats, proceed.
const gotoCheckoutSeated = async (page, eventId, seatNames) => {
  await page.goto(`/events/tickets/${eventId}`);
  for (let i = 0; i < seatNames.length; i++) {
    await page.getByRole('button', { name: 'Add one Standard' }).click();
  }
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
  for (const s of seatNames) {
    await page.getByRole('button', { name: `${s} - Available (tap to select)` }).click();
  }
  await page.getByRole('button', { name: 'Proceed to Payment' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${eventId}`), { timeout: 15_000 });
};

test.beforeEach(async ({ page }) => {
  const seed = readSeed();
  await clearReservation(page, seed.paidEventId);
  await clearReservation(page, seed.discountEventId);
  await clearReservation(page, seed.zoomHallEventId);
  await clearReservation(page, seed.packPricingEventId);
  await clearReservation(page, seed.packPricingSeatedEventId);
});

test('Continue is disabled until the buyer details and consents are filled, then the stepper moves from Details to Payment', async ({ page }) => {
  const seed = readSeed();
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  await expect(page.getByTestId('step-details')).toHaveAttribute('data-state', 'current');
  await expect(page.getByTestId('step-payment')).toHaveAttribute('data-state', 'upcoming');

  const continueBtn = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueBtn).toBeDisabled();

  await fillBuyer(page);
  await expect(continueBtn).toBeEnabled();
  await continueBtn.click();

  await expect(page.getByTestId('step-details')).toHaveAttribute('data-state', 'done', { timeout: 15_000 });
  await expect(page.getByTestId('step-payment')).toHaveAttribute('data-state', 'current');
});

test('a valid discount code lowers the total; an invalid one shows an error and leaves it unchanged', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoCheckoutNonSeated(page, seed.discountEventId, 1);

  const total = page.getByTestId('order-summary').getByTestId('order-summary-total');
  await expect(total).toContainText('$10.00', { timeout: 15_000 });

  // Valid code LIVE10 (10% off Standard $10 -> $9.00).
  await page.getByPlaceholder('Enter code').fill('LIVE10');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(total).toContainText('$9.00', { timeout: 15_000 });

  // Remove, then an invalid code errors and the total returns to $10.00 unchanged.
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(total).toContainText('$10.00');
  await page.getByPlaceholder('Enter code').fill('NOPECODE');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByTestId('discount-error')).toBeVisible({ timeout: 15_000 });
  await expect(total).toContainText('$10.00');
});

test('the order summary lists the chosen seats as chips with the total', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 1280, height: 700 });
  await gotoCheckoutSeated(page, seed.zoomHallEventId, ['C40', 'C41', 'C42']);

  const summary = page.getByTestId('order-summary');
  await expect(summary.getByTestId('summary-seat-chip')).toHaveCount(3, { timeout: 15_000 });
  await expect(summary.getByTestId('order-summary-total')).toBeVisible();
});

test('a member buys a paid ticket end to end with the 4242 test card and the sale is recorded', async ({ page }) => {
  const seed = readSeed();
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  await fillBuyer(page);
  await page.getByRole('button', { name: /Continue to Payment/ }).click();
  await payWith4242(page);

  expect(dbCount('paidTickets', seed.paidEventId)).toBeGreaterThanOrEqual(1);
  expect(dbCount('invoices', seed.paidEventId)).toBeGreaterThanOrEqual(1);

  // A real first sale flips the event's hasActivity and the purchased ticket type's hasSold - the
  // signals the edit form reads to lock the sold type.
  const flags = dbEditFlags(seed.paidEventId);
  expect(flags.hasActivity).toBe(true);
  expect(flags.hasSold).toBe(true);
});

// A FamilyPack stores the pack price ($50 admits 3, does NOT divide evenly).
test('buying one $50 pack of 3 on a general-admission event issues 3 tickets, one $50 invoice and one pack tag', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.packPricingEventId}`);
  await page.waitForLoadState('networkidle');

  // One pack = three admissions. The row name carries "(3 People)".
  await page.getByRole('button', { name: 'Add one FamilyPack pack' }).click();
  await expect(page.getByText(/3 tickets selected/)).toBeVisible({ timeout: 20_000 });
  // Sticky bar subtotal is packPrice x packs ($50), never packPrice x people ($150).
  await expect(page.getByTestId('tickets-cta-bar')).toContainText('$50.00', { timeout: 10_000 });

  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${seed.packPricingEventId}`), { timeout: 15_000 });

  // Checkout shows the pack as ONE line "FamilyPack (admits 3)" at $50 - not three $16.67 lines.
  await expect(page.getByText(/admits 3/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('$50.00').first()).toBeAttached();

  await fillBuyer(page, 'buyer-pack-e2e@test.dev');
  await page.getByRole('button', { name: /Continue to Payment/ }).click();
  await payWith4242(page);

  // 3 tickets whose stored prices sum to exactly $50 (16.67 + 16.67 + 16.66).
  expect(dbCount('paidTickets', seed.packPricingEventId)).toBe(3);
  const prices = dbTicketPrices(seed.packPricingEventId);
  expect(prices.paid).toHaveLength(3);
  expect(prices.paid.reduce((s, p) => s + p, 0)).toBeCloseTo(50, 2);
  expect(dbCount('invoices', seed.packPricingEventId)).toBe(1);
  expect(dbInvoiceTotal(seed.packPricingEventId)).toBe(50);

  // Capacity fell by the 3 admissions, not by 1.
  expect(dbSold(seed.packPricingEventId)).toBe(3);

  // The three tickets share ONE non-empty pack tag.
  const tags = dbPackTags(seed.packPricingEventId);
  expect(tags).toHaveLength(3);
  expect(tags.every((t) => t && t === tags[0])).toBe(true);
});

test('buying one pack of 3 on a seated event demands exactly 3 seats and issues 3 seated tickets with one pack tag', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.packPricingSeatedEventId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Add one FamilyPack pack' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.packPricingSeatedEventId}`), { timeout: 15_000 });
  await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });

  // The pack demands exactly 3 seats: Proceed enables only once 3 are picked.
  const proceed = page.getByRole('button', { name: 'Proceed to Payment' });
  await page.getByRole('button', { name: 'A1 - Available (tap to select)' }).click();
  await expect(proceed).toBeDisabled();
  await page.getByRole('button', { name: 'A2 - Available (tap to select)' }).click();
  await page.getByRole('button', { name: 'A3 - Available (tap to select)' }).click();
  await expect(proceed).toBeEnabled();

  await proceed.click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${seed.packPricingSeatedEventId}`), { timeout: 15_000 });

  await expect(page.getByText(/admits 3/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('$50.00').first()).toBeAttached();

  await fillBuyer(page, 'buyer-pack-e2e@test.dev');
  await page.getByRole('button', { name: /Continue to Payment/ }).click();
  await payWith4242(page);

  // 3 seated tickets summing to $50, one $50 invoice, all sharing one pack tag.
  expect(dbCount('paidTickets', seed.packPricingSeatedEventId)).toBe(3);
  const prices = dbTicketPrices(seed.packPricingSeatedEventId);
  expect(prices.paid.reduce((s, p) => s + p, 0)).toBeCloseTo(50, 2);
  expect(dbInvoiceTotal(seed.packPricingSeatedEventId)).toBe(50);
  const tags = dbPackTags(seed.packPricingSeatedEventId);
  expect(tags).toHaveLength(3);
  expect(tags.every((t) => t && t === tags[0])).toBe(true);
});

test('checkout shows the organiser terms after the refund policy when set, and nothing extra when not', async ({ page }) => {
  // An event WITH organiser T&C.
  await clearReservation(page, readSeed().termsEventId);
  await gotoCheckoutNonSeated(page, readSeed().termsEventId);

  // The refund-policy display shows the refund policy AND the organiser T&C.
  await expect(page.getByText(/Refund Policy/i).first()).toBeVisible();
  await expect(page.getByText(T_AND_C)).toBeVisible();

  // The organiser acceptance covers both; the platform terms checkbox is separate and unchanged.
  await expect(page.getByText(/refund policy and terms & conditions/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible(); // platform terms link, unchanged
  // Both acceptances are present (required to proceed).
  expect(await page.getByRole('checkbox').count()).toBeGreaterThanOrEqual(2);

  // An event with NO T&C renders nothing extra.
  await clearReservation(page, readSeed().paidEventId);
  await gotoCheckoutNonSeated(page, readSeed().paidEventId);
  await expect(page.getByText(T_AND_C)).toHaveCount(0);
  await expect(page.getByText('Terms & Conditions:')).toHaveCount(0);
  // The platform terms checkbox (with its "Terms" link) is still there - that acceptance is unchanged.
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
});
