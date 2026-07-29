// Bundle ticket price — browser journeys. See featureplans/events-bundle-ticket.md.
// The flagship purchase runs on a NON-SEATED bundle event: the seats page is deliberately untouched
// by bundles (seat demand already counts tickets), so a non-seated checkout proves the new pack ->
// $72 -> 4 tickets -> one $72 invoice -> capacity-4 path reliably (see the [IA] note in the plan).
import { test, expect } from '@playwright/test';
import { readSeed, dbCount, dbTicketPrices, dbInvoiceTotal, dbSold } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

// AC17 — the event detail Tickets list shows "FamilyFour ... $72 (admits 4)".
test('AC17 event detail Tickets list shows the bundle price and admits line', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.bundleClampEventId}`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('FamilyFour', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('(admits 4)').first()).toBeVisible();
  await expect(page.getByText('$72', { exact: false }).first()).toBeVisible();
});

// AC16 — clamps: packs step by 4, a third pack won't fit the per-order limit, and a refresh shows
// the stepper in packs (not raw tickets).
test('AC16 pack stepper, per-order clamp, and refresh-in-packs', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.bundleClampEventId}`);
  await page.waitForLoadState('networkidle');

  const ffAdd = page.getByRole('button', { name: 'Add one FamilyFour pack' });
  // The quantity shown for the FamilyFour row is the span immediately before its + button.
  const ffQty = ffAdd.locator('xpath=preceding-sibling::span[1]');

  // One pack -> the stepper reads 1 (pack), not 4 (tickets).
  await ffAdd.click();
  await expect(ffQty).toHaveText('1');

  // Two packs -> reads 2, and the availability header counts 8 tickets.
  await ffAdd.click();
  await expect(ffQty).toHaveText('2');
  await expect(page.getByText(/8 tickets selected/)).toBeVisible();

  // A third pack (12) exceeds the per-order limit of 10 -> the pack + is disabled, pack-aware msg.
  await expect(ffAdd).toBeDisabled();
  await expect(page.getByText(/up to 10 tickets per order/)).toBeVisible();

  // A normal type still has room for the remaining 2 within the per-order limit.
  await expect(page.getByRole('button', { name: 'Add one General' })).toBeEnabled();

  // Refresh mid-selection -> the reservation restores and the stepper still reads packs (2), not 8.
  // (The tickets page polls capacity on an interval, so the network never idles — wait on the element.)
  await page.reload();
  await expect(page.getByRole('button', { name: 'Add one FamilyFour pack' })
    .locator('xpath=preceding-sibling::span[1]')).toHaveText('2', { timeout: 20_000 });
});

// AC16 — with fewer spots left than a pack, the row disables with a pack-aware message (never the
// single-ticket wording).
test('AC16 a pack that cannot fit the remaining capacity disables with a pack-aware message', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.bundleTightEventId}`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('button', { name: 'Add one FamilyFour pack' })).toBeDisabled();
  await expect(page.getByText('Not enough remaining for another FamilyFour')).toBeVisible();
  // Never the single-ticket wording.
  await expect(page.getByText(/only 1 more/i)).toHaveCount(0);
});

// AC15 (flagship) + AC12 (issuance) + AC14 (capacity): buy one FamilyFour pack end to end.
test('AC15 buy one FamilyFour pack -> $72 -> 4 tickets @ $18, one $72 invoice, capacity down 4', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.bundleEventId}`);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.bundleEventId}`), { timeout: 15_000 });

  // One pack = four admissions.
  await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();

  await page.getByRole('button', { name: 'Purchase Tickets' }).click();
  await expect(page).toHaveURL(new RegExp(`/events/checkout/${seed.bundleEventId}`), { timeout: 15_000 });

  // Checkout renders the bundle price as the total (the exact amount is DB-verified below).
  await expect(page.getByText('$72.00').first()).toBeAttached({ timeout: 15_000 });

  // Buyer details.
  await page.getByPlaceholder('First name').fill('Buyer');
  await page.getByPlaceholder('Last name').fill('Tester');
  await page.getByPlaceholder('Email address').fill('buyer-bundle-e2e@test.dev');
  await page.getByPlaceholder('Phone number').fill('0412345678');
  for (const cb of await page.getByRole('checkbox').all()) {
    await cb.check().catch(() => {});
  }
  await page.getByRole('button', { name: /Continue to Payment/ }).click();

  // Stripe 4242 test card.
  const stripe = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await stripe.getByPlaceholder('Card number').fill('4242 4242 4242 4242');
  await stripe.getByPlaceholder('MM / YY').fill('12 / 34');
  await stripe.getByPlaceholder('CVC').fill('123');
  await stripe.getByPlaceholder(/ZIP|Postal/).fill('2000').catch(() => {});

  await page.getByRole('button', { name: /Complete Payment/ }).click();
  await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 45_000 });

  // AC12: exactly 4 tickets, each priced $18 (refund maximum = basePrice = $18), one $72 invoice.
  expect(dbCount('paidTickets', seed.bundleEventId)).toBe(4);
  const prices = dbTicketPrices(seed.bundleEventId);
  expect(prices.base).toEqual([18, 18, 18, 18]);
  expect(prices.paid).toEqual([18, 18, 18, 18]);
  expect(dbCount('invoices', seed.bundleEventId)).toBe(1);
  expect(dbInvoiceTotal(seed.bundleEventId)).toBe(72);

  // AC14: the pack consumed 4 admissions, not 1.
  expect(dbSold(seed.bundleEventId)).toBe(4);
});
