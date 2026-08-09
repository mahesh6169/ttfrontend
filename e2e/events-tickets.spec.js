// Acceptance suite for featureplans/events-tickets-ui.md — the restructured /events/tickets page:
// aggregate sticky CTA, bundle "(N People)" name, note-before-discount, status badges, required-field
// gate, and the mobile bottom-nav exemption. Runs as a logged-in member (selecting tickets needs a
// session). Each test title starts with its acceptance-criterion number.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };

// Start each test from a clean slate (no leftover reservation from a prior test/spec).
const clearReservation = async (page, eventId) => {
  const res = await page.request.get(`${API}/events/${eventId}/reservation`, { headers: KEY });
  if (res.ok()) {
    const body = await res.json();
    if (body?.reservation?._id) {
      await page.request.delete(`${API}/events/${eventId}/reservation/${body.reservation._id}`, { headers: KEY });
    }
  }
};

test.beforeEach(async ({ page }) => {
  const seed = readSeed();
  await clearReservation(page, seed.ticketsUiEventId);
  await clearReservation(page, seed.bundleClampEventId);
});

// AC1 — the sticky bar shows the aggregate "N tickets - $subtotal" reflecting the totals.
test('AC1 sticky bar shows the aggregate ticket count and subtotal', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

  const bar = page.getByTestId('tickets-cta-bar');
  await page.getByRole('button', { name: 'Add one General' }).click();
  await expect(bar).toContainText('1 ticket - $20.00', { timeout: 20_000 });

  await page.getByRole('button', { name: 'Add one General' }).click();
  await expect(bar).toContainText('2 tickets - $40.00', { timeout: 20_000 });
});

// AC2 — a bundle ticket shows "<name> (N People)" with N = bundleSize, and the stepper moves in
// whole packs (one +/- step = bundleSize admissions).
test('AC2 bundle name shows "(N People)" and the stepper moves in whole packs', async ({ page }) => {
  const seed = readSeed();
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

// AC3 — with a note and a discount code on the same ticket, the note renders BEFORE the discount.
test('AC3 the note renders before the discount badge', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

  // The General row carries both the note and the DRINK5 hint.
  const generalRow = page.locator('div.px-4.py-3', {
    has: page.getByRole('heading', { name: 'General', exact: true }),
  });
  await expect(generalRow).toContainText('Includes welcome drink', { timeout: 20_000 });
  await expect(generalRow).toContainText('DRINK5');

  const rowText = await generalRow.innerText();
  expect(rowText.indexOf('Includes welcome drink')).toBeLessThan(rowText.indexOf('DRINK5'));
});

// AC4 — at 360px there is no horizontal scroll and the ticket text does not overlap the
// price/stepper column.
test('AC4 no horizontal scroll and no text/stepper overlap at 360px', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

  const name = page.getByRole('heading', { name: 'General', exact: true });
  const add = page.getByRole('button', { name: 'Add one General' });
  await expect(name).toBeVisible({ timeout: 20_000 });

  // No sideways scroll at the floor.
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The text column ends before the price/stepper column begins (no overlap).
  const nameBox = await name.boundingBox();
  const addBox = await add.boundingBox();
  expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(addBox.x + 1);
});

// AC5 — the sticky bar stays pinned to the bottom, and on mobile it does not sit under a bottom nav
// (the nav is hidden on the booking flow).
test('AC5 sticky bar is pinned and the mobile bottom nav is hidden on the flow', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 390, height: 780 });
  await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);
  await page.getByRole('button', { name: 'Add one General' }).click();

  const bar = page.getByTestId('tickets-cta-bar');
  await expect(bar).toBeVisible({ timeout: 20_000 });

  // The booking flow hides the bottom nav so the CTA owns the bottom edge.
  await expect(page.getByTestId('bottom-nav')).toHaveCount(0);

  // Pinned to the bottom edge, and stays there after scrolling.
  const atBottom = async () => {
    const box = await bar.boundingBox();
    const vh = page.viewportSize().height;
    expect(Math.abs((box.y + box.height) - vh)).toBeLessThanOrEqual(2);
  };
  await atBottom();
  await page.mouse.wheel(0, 600);
  await atBottom();
});

// AC6 — with a required attendee field empty the proceed button is disabled; filling it enables it.
test('AC6 required attendee field gates the proceed button', async ({ page }) => {
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

// AC7 — an expiring-soon ticket shows the amber "X days left" badge; an expired ticket shows the red
// "Sales closed" badge.
test('AC7 sale-status badges: amber days-left and red closed', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.ticketsUiEventId}`);

  const daysLeft = page.getByText('3 days left');
  await expect(daysLeft).toBeVisible({ timeout: 20_000 });
  await expect(daysLeft).toHaveClass(/amber/);

  const closed = page.getByText('Sales closed');
  await expect(closed).toBeVisible();
  await expect(closed).toHaveClass(/red/);
});

// A STOPPED ticket type (active === false) is retired - it must not appear on the buy page
// (events-edit-locking.md stop-selling extension). Guards against showing a type buyers can't buy.
test('a stopped ticket type is hidden from the buy page; on-sale types still show', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.editLockStoppedEventId}`);

  await expect(page.getByText('OpenPass', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('ClosedPass', { exact: true })).toHaveCount(0);
});
