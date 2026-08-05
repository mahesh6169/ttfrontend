// Acceptance suite for featureplans/events-checkout-ui.md — the two-step checkout: conformed stepper,
// C+D order summary (scroll middle / pinned total / seat chips), callouts, forms, buttons. Payment
// behaviour is preserved (AC5 is the flagship end-to-end purchase with Stripe's 4242 test card, zero
// real money). Runs as a logged-in member. Each test title starts with its acceptance-criterion number.
import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from './helpers.js';

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

// Reach the checkout of a NON-seated paid event with `qty` Standard tickets.
const gotoCheckoutNonSeated = async (page, eventId, qty = 1) => {
  await page.goto(`/events/tickets/${eventId}`);
  for (let i = 0; i < qty; i++) {
    await page.getByRole('button', { name: 'Add one Standard' }).click();
  }
  await expect(page.getByText(new RegExp(`${qty} ticket${qty === 1 ? '' : 's'} selected`))).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${eventId}`), { timeout: 15_000 });
};

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

const fillBuyer = async (page) => {
  await page.getByPlaceholder('First name').fill('Buyer');
  await page.getByPlaceholder('Last name').fill('Tester');
  await page.getByPlaceholder('Email address').fill('buyer-e2e@test.dev');
  await page.getByPlaceholder('Phone number').fill('0412345678');
  for (const cb of await page.getByRole('checkbox').all()) {
    await cb.check().catch(() => {});
  }
};

test.beforeEach(async ({ page }) => {
  const seed = readSeed();
  await clearReservation(page, seed.paidEventId);
  await clearReservation(page, seed.discountEventId);
  await clearReservation(page, seed.zoomHallEventId);
});

// AC1 — the stepper shows Details active on load; after Continue, Details is done and Payment active.
test('AC1 stepper advances from Details to Payment', async ({ page }) => {
  const seed = readSeed();
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  await expect(page.getByTestId('step-details')).toHaveAttribute('data-state', 'current');
  await expect(page.getByTestId('step-payment')).toHaveAttribute('data-state', 'upcoming');

  await fillBuyer(page);
  await page.getByRole('button', { name: 'Continue to Payment' }).click();

  await expect(page.getByTestId('step-details')).toHaveAttribute('data-state', 'done', { timeout: 15_000 });
  await expect(page.getByTestId('step-payment')).toHaveAttribute('data-state', 'current');
});

// AC2 — a valid discount updates the summary total; an invalid one shows an error and leaves it unchanged.
test('AC2 discount updates the total; invalid code errors and leaves it unchanged', async ({ page }) => {
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

// AC3 — Continue to Payment is disabled until required buyer fields and consents are met.
test('AC3 Continue is gated on required buyer fields + consent', async ({ page }) => {
  const seed = readSeed();
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  const continueBtn = page.getByRole('button', { name: 'Continue to Payment' });
  await expect(continueBtn).toBeDisabled();

  await fillBuyer(page);
  await expect(continueBtn).toBeEnabled();
});

// AC4 — the order summary shows seats as chips, and the Total stays pinned outside the scrollable middle.
test('AC4 order summary: seat chips + pinned total over a scrollable middle', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 1280, height: 700 });
  await gotoCheckoutSeated(page, seed.zoomHallEventId, ['C40', 'C41', 'C42']);

  const summary = page.getByTestId('order-summary');
  await expect(summary.getByTestId('summary-seat-chip')).toHaveCount(3, { timeout: 15_000 });
  await expect(summary.getByTestId('order-summary-total')).toBeVisible();

  // Total is pinned (outside the scroll region), and the middle is independently scrollable.
  const structure = await page.evaluate(() => {
    const scope = document.querySelector('[data-testid="order-summary"]');
    const scroll = scope.querySelector('[data-testid="order-summary-scroll"]');
    const total = scope.querySelector('[data-testid="order-summary-total"]');
    return { totalPinned: !scroll.contains(total), overflowY: getComputedStyle(scroll).overflowY };
  });
  expect(structure.totalPinned).toBe(true);
  expect(structure.overflowY).toBe('auto');
});

// AC5 (flagship) — member buys a paid ticket end to end with the 4242 test card; DB has the artefacts.
test('AC5 member buys a paid ticket end to end (4242 test card)', async ({ page }) => {
  const seed = readSeed();
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  await fillBuyer(page);
  await page.getByRole('button', { name: /Continue to Payment/ }).click();

  // Stripe CardElement (single iframe). Fill the 4242 test card.
  const stripe = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');
  await stripe.getByPlaceholder(/ZIP|Postal/).fill('2000').catch(() => {});

  await page.getByRole('button', { name: /Complete Payment/ }).click();
  await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 45_000 });

  expect(dbCount('paidTickets', seed.paidEventId)).toBeGreaterThanOrEqual(1);
  expect(dbCount('invoices', seed.paidEventId)).toBeGreaterThanOrEqual(1);
});

// AC6 — at 360px there is no horizontal scroll and the summary is a collapsible bar at the top.
test('AC6 no horizontal scroll and a collapsible summary bar at 360px', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 360, height: 780 });
  await gotoCheckoutNonSeated(page, seed.paidEventId, 1);

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The mobile collapsible summary bar is the summary at this width; the desktop sidebar is hidden.
  await expect(page.getByTestId('mobile-order-summary-toggle')).toBeVisible();
  await expect(page.getByTestId('order-summary')).toBeHidden();
});
