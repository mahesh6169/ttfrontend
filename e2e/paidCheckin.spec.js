// Browser journeys for featureplans/events-paid-checkin-redesign.md - the two new checkinpaid pages
// (J1 the event LIST, J2 the per-event view). Titles carry the AC numbers. Runs as the
// known-credential organiser (organiser.json). NOTE: AC10's cancelled-greyed-in-sheet clause is
// parked (planneragentsignoff.md Q1) - the endpoint never returns cancelled tickets, so a partially
// cancelled order's cancelled rows cannot be shown; that one clause is not asserted here.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const LIST_URL = '/users/profile/checkin-paid';

test.describe('J1 paid list page', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC7 the list splits Active / Past and tapping a card opens the view', async ({ page }) => {
    const seed = readSeed();
    await page.goto(LIST_URL);
    const active = page.getByTestId('checkinpaid-active');
    const past = page.getByTestId('checkinpaid-past');
    await expect(active.getByText('E2E Paid Checkin Active')).toBeVisible({ timeout: 20_000 });
    await expect(past.getByText('E2E Paid Checkin Past')).toBeVisible();

    await page.getByTestId('checkinpaid-event-card').filter({ hasText: 'E2E Paid Checkin Active' })
      .getByText('E2E Paid Checkin Active').click();
    await expect(page).toHaveURL(new RegExp(`${LIST_URL}/${seed.checkinPaidActiveEventId}`));
  });
});

test.describe('J2 paid per-event view', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const row = (page, inv) => page.getByTestId('checkinpaid-row').filter({ hasText: inv });
  const gotoView = async (page) => {
    await page.goto(`${LIST_URL}/${readSeed().checkinPaidActiveEventId}`);
    await expect(row(page, 'INV-PAID-1')).toBeVisible({ timeout: 20_000 });
    // The page defaults to "Not checked in"; switch to All so a test sees every invoice and
    // in-row check-ins don't drop the row off the default worklist.
    await page.getByTestId('checkinpaid-tabs').getByRole('button', { name: 'All' }).click();
  };

  test('the tabs read Not checked in / Checked in / All and default to Not checked in', async ({ page }) => {
    await page.goto(`${LIST_URL}/${readSeed().checkinPaidActiveEventId}`);
    const tabs = page.getByTestId('checkinpaid-tabs');
    await expect(tabs.getByRole('button', { name: 'Not checked in', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
    // A fully-checked order (INV-PAID-3) is hidden by default (it lives under "Checked in").
    await expect(page.getByTestId('checkinpaid-row').filter({ hasText: 'INV-PAID-3' })).toHaveCount(0);
  });

  test('AC8 stats show Total Tickets / Checked In / Cancelled and no revenue or export', async ({ page }) => {
    await gotoView(page);
    const stats = page.getByTestId('checkinpaid-stats');
    await expect(stats.getByText('Total Tickets')).toBeVisible();
    await expect(stats.getByText('Checked In')).toBeVisible();
    await expect(stats.getByText('Cancelled')).toBeVisible();
    await expect(stats.getByText(/revenue/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /save.*pdf/i })).toHaveCount(0);
  });

  test('AC9 invoice rows are one continuous scroll; 1-ticket checks in from the row, 2+ opens the sheet', async ({ page }) => {
    await gotoView(page);
    // No pagination buttons.
    await expect(page.getByRole('button', { name: /^(Next|Previous|Page \d+)$/ })).toHaveCount(0);

    // 1-ticket invoice: direct toggle on the row (then toggle back so state is left as seeded).
    const single = row(page, 'INV-PAID-1');
    await single.getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Checked in', exact: true })).toBeVisible();
    await single.getByRole('button', { name: 'Checked in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Check in', exact: true })).toBeVisible();

    // 2+ invoice: opens the check-in sheet.
    await row(page, 'INV-PAID-2').getByRole('button', { name: /Check in order/ }).click();
    await expect(page.getByTestId('checkinpaid-sheet')).toBeVisible();
  });

  test('AC10 in the sheet, ticking a ticket and "Check in all" check the order in and update the counter', async ({ page }) => {
    await gotoView(page);
    const party = row(page, 'INV-PAID-2');
    await party.getByRole('button', { name: /Check in order/ }).click();
    const sheet = page.getByTestId('checkinpaid-sheet');
    await expect(sheet).toBeVisible();

    // Tick the first (not-yet-checked-in) ticket, then it flips.
    await sheet.getByRole('button', { name: /not checked in/ }).first().click();
    await expect(sheet.getByRole('button', { name: /, checked in/ }).first()).toBeVisible();
    // Check in all completes the order.
    await sheet.getByRole('button', { name: 'Check in all' }).click();
    await expect(sheet.getByRole('button', { name: 'All checked in' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(party.getByText('2/2')).toBeVisible();
  });

  test('AC11 Not checked in / Checked in tabs filter, and search matches ticket / invoice / buyer / email', async ({ page }) => {
    await gotoView(page);
    const tabs = page.getByTestId('checkinpaid-tabs');
    const rows = page.getByTestId('checkinpaid-row');

    await tabs.getByRole('button', { name: 'Not checked in', exact: true }).click();
    await expect(rows.filter({ hasText: 'INV-PAID-1' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'INV-PAID-3' })).toHaveCount(0); // fully checked -> not in this list

    await tabs.getByRole('button', { name: 'Checked in', exact: true }).click();
    await expect(rows.filter({ hasText: 'INV-PAID-3' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'INV-PAID-1' })).toHaveCount(0);

    await tabs.getByRole('button', { name: 'All' }).click();
    const searchBox = page.getByPlaceholder('Ticket No, Invoice No, Name, Email');
    await searchBox.fill('Zara'); // buyer name -> INV-PAID-2
    await expect(rows.filter({ hasText: 'INV-PAID-2' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'INV-PAID-1' })).toHaveCount(0);

    await searchBox.fill('TKT-P1A'); // ticket number -> INV-PAID-1
    await expect(rows.filter({ hasText: 'INV-PAID-1' })).toHaveCount(1);
  });

  test('AC12 the info icon appears only for orders with answers and opens the Attendee Info sheet', async ({ page }) => {
    await gotoView(page);
    await row(page, 'INV-PAID-4').getByRole('button', { name: 'View attendee information' }).click();
    const sheet = page.getByTestId('checkinpaid-info-sheet');
    await expect(sheet.getByRole('heading', { name: 'Attendee Info' })).toBeVisible();
    await expect(sheet.getByText('Dietary requirements')).toBeVisible();
    await expect(sheet.getByText('Vegan; no nuts')).toBeVisible();
    await page.keyboard.press('Escape');
    // No answers -> no info icon.
    await expect(row(page, 'INV-PAID-1').getByRole('button', { name: 'View attendee information' })).toHaveCount(0);
  });

  test('AC13 a fully-cancelled invoice is hidden and its ticket shows in the Cancelled stat', async ({ page }) => {
    await gotoView(page);
    await expect(page.getByTestId('checkinpaid-row').filter({ hasText: 'INV-PAID-CANCELLED' })).toHaveCount(0);
    await expect(page.getByTestId('checkinpaid-stat-cancelled')).toHaveText('1');
  });

  test('AC14 the Scan QR button opens the scanner surface with a working close', async ({ page }) => {
    await gotoView(page);
    await page.getByTestId('checkinpaid-scan').click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toHaveCount(0);
  });

  test('the scanner auto-closes back to the list after 60s idle (no scans)', async ({ page }) => {
    await gotoView(page);
    await page.clock.install(); // control timers set from here on (the scanner's idle countdown)
    await page.getByTestId('checkinpaid-scan').click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toBeVisible({ timeout: 20_000 });
    // Fast-forward past 60s of no scans -> the scanner closes and we're back on the list/table.
    await page.clock.fastForward(61_000);
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toHaveCount(0);
    await expect(page.getByTestId('checkinpaid-scan')).toBeVisible();
  });

  // AC15 (visual, asserted): worst-case order - longest invoice number, long buyer, 8 tickets -
  // renders with the invoice number never clipped and no sideways scroll across the three tiers.
  test('AC15 worst-case data: invoice number never clips, no sideways scroll at 360 / 768 / 1024', async ({ page }) => {
    const url = `${LIST_URL}/${readSeed().checkinPaidActiveEventId}`;
    const LONG = 'INV-PAID-VERYLONGINVOICENUMBER-000001';
    for (const width of [360, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(url);
      const rowTid = width >= 768 ? 'checkinpaid-row' : 'checkinpaid-row-m';
      const rowLoc = page.getByTestId(rowTid).filter({ hasText: LONG });
      await expect(rowLoc).toBeVisible({ timeout: 20_000 });
      const invFits = await rowLoc.getByTestId('checkinpaid-invoiceno').evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(invFits, `invoice not clipped at ${width}px`).toBe(true);
      await expect(rowLoc.getByRole('button', { name: /Check in order/ })).toBeInViewport();
      const noH = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      expect(noH, `no sideways scroll at ${width}px`).toBe(true);
    }
  });
});
