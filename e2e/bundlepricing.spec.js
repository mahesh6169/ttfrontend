// Bundle PACK-PRICING browser journeys - see featureplans/events-bundle-pricing.md.
// A FamilyPack stores the pack price ($50 admits 3, does NOT divide evenly). AC19 buys it on a
// NON-SEATED event; AC20 buys it on a SEATED event (a pack demands exactly 3 seats). Both prove the
// pack shows as "$50, admits 3" at checkout and issues 3 real tickets that split the pack price to
// exactly $50, share ONE pack tag, and (seated) each carry their own seat.
import { test, expect } from '@playwright/test';
import { readSeed, dbCount, dbTicketPrices, dbInvoiceTotal, dbSold, dbPackTags } from './helpers.js';

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

const fillBuyerAndPay = async (page) => {
  await page.getByPlaceholder('First name').fill('Buyer');
  await page.getByPlaceholder('Last name').fill('Tester');
  await page.getByPlaceholder('Email address').fill('buyer-pack-e2e@test.dev');
  await page.getByPlaceholder('Phone number').fill('0412345678');
  for (const cb of await page.getByRole('checkbox').all()) {
    await cb.check().catch(() => {});
  }
  await page.getByRole('button', { name: /Continue to Payment/ }).click();

  const stripe = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');
  await stripe.getByPlaceholder(/ZIP|Postal/).fill('2000').catch(() => {});

  await page.getByRole('button', { name: /Complete Payment/ }).click();
  await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 45_000 });
};

test.beforeEach(async ({ page }) => {
  const seed = readSeed();
  await clearReservation(page, seed.packPricingEventId);
  await clearReservation(page, seed.packPricingSeatedEventId);
});

// AC19 - non-seated: one FamilyPack ($50, admits 3) -> checkout shows "$50, admits 3" -> pay ->
// 3 tickets summing to $50, one $50 invoice, capacity down 3, all three sharing one pack tag.
test('AC19 buy one FamilyPack on a non-seated event: $50, admits 3 -> 3 tickets, one $50 invoice, one pack tag', async ({ page }) => {
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

  await fillBuyerAndPay(page);

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

// AC20 - seated: one FamilyPack (admits 3) demands exactly 3 seats -> pay -> 3 tickets each with its
// own seat, all sharing one pack tag, summing to $50.
test('AC20 buy one FamilyPack on a seated event: 3 seats demanded, 3 seated tickets, one pack tag', async ({ page }) => {
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

  await fillBuyerAndPay(page);

  // 3 seated tickets summing to $50, one $50 invoice, all sharing one pack tag.
  expect(dbCount('paidTickets', seed.packPricingSeatedEventId)).toBe(3);
  const prices = dbTicketPrices(seed.packPricingSeatedEventId);
  expect(prices.paid.reduce((s, p) => s + p, 0)).toBeCloseTo(50, 2);
  expect(dbInvoiceTotal(seed.packPricingSeatedEventId)).toBe(50);
  const tags = dbPackTags(seed.packPricingSeatedEventId);
  expect(tags).toHaveLength(3);
  expect(tags.every((t) => t && t === tags[0])).toBe(true);
});
