// The /events/tickets page (choose tickets): sticky bar, bundles/packs, required fields, sale-status
// badges, restoring a held reservation, sales closed, and the discount hint. Runs as the member
// (selecting tickets needs a session) except the discount hint, which is the owner's view.
import { test, expect } from '@playwright/test';
import { readSeed, clearReservation } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

test.describe('choosing tickets', () => {
  // Start each test from a clean slate (no leftover reservation from a prior test/spec).
  test.beforeEach(async ({ page }) => {
    const seed = readSeed();
    await clearReservation(page, seed.ticketsUiEventId);
    await clearReservation(page, seed.bundleClampEventId);
  });

  test('the sticky bar shows the running ticket count and subtotal', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

    const bar = page.getByTestId('tickets-cta-bar');
    await page.getByRole('button', { name: 'Add one General' }).click();
    await expect(bar).toContainText('1 ticket - $20.00', { timeout: 20_000 });

    await page.getByRole('button', { name: 'Add one General' }).click();
    await expect(bar).toContainText('2 tickets - $40.00', { timeout: 20_000 });
  });

  test('a bundle shows its pack price on the event page, and "(N People)" with a stepper in whole packs on the tickets page', async ({ page }) => {
    const seed = readSeed();
    // The event detail Tickets list shows "FamilyFour ... $72 (admits 4)".
    await page.goto(`/events/views/${seed.bundleClampEventId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('FamilyFour', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('(admits 4)').first()).toBeVisible();
    await expect(page.getByText('$72', { exact: false }).first()).toBeVisible();

    await page.goto(`/events/tickets/${seed.bundleClampEventId}`);
    // Name carries the pack size (FamilyFour = bundleSize 4).
    await expect(page.getByRole('heading', { name: 'FamilyFour (4 People)' })).toBeVisible({ timeout: 20_000 });

    const ffAdd = page.getByRole('button', { name: 'Add one FamilyFour pack' });
    const ffQty = ffAdd.locator('xpath=preceding-sibling::span[1]');

    // One pack -> stepper reads 1 (pack), availability counts 4 admissions.
    await ffAdd.click();
    await expect(ffQty).toHaveText('1');
    await expect(page.getByText(/4 tickets selected/)).toBeVisible({ timeout: 20_000 });
  });

  test('packs are clamped to the per-order limit and to the remaining capacity, and a refresh keeps the pack count', async ({ page }) => {
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
    // (The tickets page polls capacity on an interval, so the network never idles - wait on the element.)
    await page.reload();
    await expect(page.getByRole('button', { name: 'Add one FamilyFour pack' })
      .locator('xpath=preceding-sibling::span[1]')).toHaveText('2', { timeout: 20_000 });

    // With fewer spots left than a pack, the row disables with a pack-aware message.
    await page.goto(`/events/tickets/${seed.bundleTightEventId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Add one FamilyFour pack' })).toBeDisabled();
    await expect(page.getByText('Not enough remaining for another FamilyFour')).toBeVisible();
    // Never the single-ticket wording.
    await expect(page.getByText(/only 1 more/i)).toHaveCount(0);
  });

  test('an empty required attendee field keeps the proceed button disabled until it is filled', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);
    await page.getByRole('button', { name: 'Add one General' }).click();

    // While the required "Full Name" field is empty the proceed button reads "Fill Required Info"
    // and is disabled.
    await expect(page.getByRole('button', { name: 'Fill Required Info' })).toBeDisabled({ timeout: 20_000 });

    // Filling it flips the button to the enabled "Purchase Tickets" (general admission) action.
    await page.getByPlaceholder('Enter requested details').fill('Jane Doe');
    await expect(page.getByRole('button', { name: 'Purchase Tickets' })).toBeEnabled();
  });

  test('ticket types show an amber "days left" badge when ending soon and a red "Sales closed" badge when over', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

    const daysLeft = page.getByText('3 days left');
    await expect(daysLeft).toBeVisible({ timeout: 20_000 });
    await expect(daysLeft).toHaveClass(/amber/);

    const closed = page.getByText('Sales closed');
    await expect(closed).toBeVisible();
    await expect(closed).toHaveClass(/red/);
  });

  // A STOPPED ticket type (active === false) is retired - it must not appear on the buy page.
  test('a stopped ticket type is hidden from the buy page while on-sale types still show', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.editLockStoppedEventId}`);

    await expect(page.getByText('OpenPass', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('ClosedPass', { exact: true })).toHaveCount(0);
  });
});

test.describe('returning to the tickets page', () => {
  // The bundleRestore events have FamilyFour (pack of 4) + General (single) - exactly "1 pack + 1 single".
  const ffQty = (page) =>
    page.getByRole('button', { name: 'Add one FamilyFour pack' }).locator('xpath=preceding-sibling::span[1]');
  const genQty = (page) =>
    page.getByRole('button', { name: 'Add one General' }).locator('xpath=preceding-sibling::span[1]');

  test.beforeEach(async ({ page }) => {
    const seed = readSeed();
    await clearReservation(page, seed.bundleRestoreEventId);
    await clearReservation(page, seed.bundleRestoreSeatedEventId);
  });

  for (const [label, key] of [
    ['a general-admission', 'bundleRestoreEventId'],
    ['a seated', 'bundleRestoreSeatedEventId'],
  ]) {
    test(`the held reservation restores its steppers after leaving and coming back, on ${label} event`, async ({ page }) => {
      const eventId = readSeed()[key];

      await page.goto(`/events/views/${eventId}`);
      await page.getByRole('button', { name: 'Purchase Tickets' }).click();
      await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

      await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();
      await expect(ffQty(page)).toHaveText('1');
      await page.getByRole('button', { name: 'Add one General' }).click();
      await expect(genQty(page)).toHaveText('1');
      await expect(page.getByText(/5 tickets selected/)).toBeVisible();

      // Leave the tickets page entirely (fully tears it down - no bfcache), then return via the event
      // page and re-enter through Purchase Tickets, exactly like the owner's journey.
      await page.goto('/events');
      await page.goto(`/events/views/${eventId}`);
      await page.getByRole('button', { name: 'Purchase Tickets' }).click();
      await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });

      // Steppers must agree with the banner: pack 1, single 1, banner still 5.
      await expect(page.getByText(/5 tickets selected/)).toBeVisible({ timeout: 15_000 });
      await expect(ffQty(page)).toHaveText('1', { timeout: 15_000 });
      await expect(genQty(page)).toHaveText('1');
    });
  }

  test('the restored selection is live - removing a ticket after returning updates the reservation', async ({ page }) => {
    const eventId = readSeed().bundleRestoreEventId;

    await page.goto(`/events/views/${eventId}`);
    await page.getByRole('button', { name: 'Purchase Tickets' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/tickets/${eventId}`), { timeout: 15_000 });
    await page.getByRole('button', { name: 'Add one FamilyFour pack' }).click();
    await page.getByRole('button', { name: 'Add one General' }).click();
    await expect(page.getByText(/5 tickets selected/)).toBeVisible();

    await page.goBack();
    await page.getByRole('button', { name: 'Purchase Tickets' }).click();
    await expect(genQty(page)).toHaveText('1', { timeout: 15_000 });

    // Remove the single -> reservation drops to the pack's 4, banner follows.
    await page.getByRole('button', { name: 'Remove one General' }).click();
    await expect(page.getByText(/4 tickets selected/)).toBeVisible({ timeout: 15_000 });
    await expect(ffQty(page)).toHaveText('1');
  });
});

test.describe('sales closed', () => {
  // SKIPPED 2026-10-26 with the owner's OK: failed twice in CI on feature 1009 (unrelated to it, near midnight Sydney); see Delivery/backlog.md
  test.skip('an event whose sales have closed shows a disabled Sales Closed button and a dimmed ticket list, also when opened from the Past strip', async ({ page }) => {
    const seed = readSeed();

    await page.goto(`/events/views/${seed.salesCutoffEventId}`);
    await page.waitForLoadState('networkidle');

    // The "Sales Closed" button must be visible and disabled.
    const salesClosedBtn = page.getByRole('button', { name: 'Sales Closed' });
    await expect(salesClosedBtn).toBeVisible({ timeout: 15_000 });
    await expect(salesClosedBtn).toBeDisabled();

    // The "Purchase Tickets" active button must NOT be visible.
    await expect(page.getByRole('button', { name: 'Purchase Tickets' })).not.toBeVisible();

    // The ticket list container must have the dim class (opacity-50).
    const ticketList = page.locator('.divide-y.divide-slate-100');
    await expect(ticketList.first()).toHaveClass(/opacity-50/);

    // A finished PAID event opened from the Past events strip shows the same disabled Sales Closed.
    await page.goto('/events');
    const section = page.getByTestId('past-events');
    await expect(section.getByText('E2E Past Featured Paid Fest')).toBeVisible({ timeout: 20_000 });
    await section.getByText('E2E Past Featured Paid Fest').click();
    await expect(page.getByRole('heading', { name: 'E2E Past Featured Paid Fest' })).toBeVisible({ timeout: 20_000 });
    const closedButton = page.getByRole('button', { name: 'Sales Closed' });
    // The button renders once the client has loaded the event's sales state, after the heading.
    await expect(closedButton).toBeVisible({ timeout: 15_000 });
    await expect(closedButton).toBeDisabled();
  });

  test('an open paid event shows an active Purchase Tickets button', async ({ page }) => {
    const seed = readSeed();

    await page.goto(`/events/views/${seed.paidEventId}`);
    await page.waitForLoadState('networkidle');

    const purchaseBtn = page.getByRole('button', { name: 'Purchase Tickets' });
    await expect(purchaseBtn).toBeVisible({ timeout: 15_000 });
    await expect(purchaseBtn).not.toBeDisabled();

    await expect(page.getByRole('button', { name: 'Sales Closed' })).not.toBeVisible();
  });

  test('the tickets page of a closed event shows the closed message and a disabled Sales Closed proceed', async ({ page }) => {
    const seed = readSeed();

    // Deep-link directly to the tickets page for the closed event.
    await page.goto(`/events/tickets/${seed.salesCutoffEventId}`);
    await page.waitForLoadState('networkidle');

    // The message appears in the ticket area and the sticky bar; either one is sufficient.
    await expect(page.getByText('Ticket sales for this event have closed.').first()).toBeVisible({ timeout: 15_000 });

    const ctaBar = page.locator('[data-testid="tickets-cta-bar"]');
    await expect(ctaBar).toBeVisible({ timeout: 10_000 });

    const proceedBtn = page.locator('[data-testid="tickets-proceed"]');
    await expect(proceedBtn).toBeVisible();
    await expect(proceedBtn).toBeDisabled();
    await expect(proceedBtn).toHaveText(/Sales Closed/);
  });
});

// Only a USABLE discount code is shown as a redeemable hint. The event OWNER is sent the full,
// unfiltered codes array (for the edit wizard), so on the owner's own preview the client filter
// (utils/events/discountCodes.js) is what must hide a dead code.
test.describe('discount hint (owner view)', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('the discount hint shows a live code and hides a used-up one', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.discountEventId}`);
    // LIVE10 renders in both the mobile and desktop ticket markups, so assert it is present in the
    // DOM (first match attached) rather than a single visible node; DEAD10 must be absent entirely.
    await expect(page.getByText('LIVE10').first()).toBeAttached({ timeout: 20_000 }); // remainingUses 5 -> shown
    await expect(page.getByText('DEAD10')).toHaveCount(0);                            // remainingUses 0 -> hidden
  });
});
