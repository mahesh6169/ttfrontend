// Organiser check-in: the free-RSVP check-in pages (/users/profile/checkinrsvp - event list and
// per-event screen, CSV export and answers) and the paid check-in pages (/users/profile/checkin-paid).
// Runs as the known-credential organiser, except the empty state (the plain member owns no events).
// Several tests change check-in state on seeded bookings, so the order inside each block matters.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { readSeed } from '../helpers.js';

const RSVP_URL = '/users/profile/checkinrsvp';
const PAID_URL = '/users/profile/checkin-paid';

test.describe('RSVP check-in list', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('upcoming events sit under Active and past ones under Past, and tapping a card opens its check-in screen', async ({ page }) => {
    const seed = readSeed();
    await page.goto(RSVP_URL);

    const active = page.getByTestId('checkinrsvp-active');
    const past = page.getByTestId('checkinrsvp-past');
    await expect(active.getByText('E2E RSVP Checkin Active')).toBeVisible({ timeout: 20_000 });
    await expect(past.getByText('E2E RSVP Checkin Past')).toBeVisible();

    // Tap the card body (not its Save PDF) -> routes to the per-event screen.
    await page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E RSVP Checkin Active' })
      .getByText('E2E RSVP Checkin Active').click();
    await expect(page).toHaveURL(new RegExp(`/users/profile/checkinrsvp/${seed.rsvpCheckinActiveEventId}`));
  });

  test('Save PDF on a card downloads the attendee list without leaving the page', async ({ page }) => {
    await page.goto(RSVP_URL);
    const card = page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E RSVP Checkin Active' });
    await expect(card).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Save PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    // No navigation occurred - still on the list.
    await expect(page).toHaveURL(new RegExp(`${RSVP_URL}$`));
  });

  test('Download CSV gives one row per registration with a column per question, friendly dates and oldest first', async ({ page }) => {
    await page.goto(RSVP_URL);
    const card = page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E QTypes CSV' });
    await expect(card).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Download CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    const raw = fs.readFileSync(await download.path(), 'utf8');
    // UTF-8 BOM for Excel.
    expect(raw.charCodeAt(0)).toBe(0xfeff);
    const lines = raw.replace(/^\uFEFF/, '').split('\r\n'); // CRLF line ends
    const header = lines[0].split(',');
    // Columns: reg number, mobile, attendees, then one per question in builder order.
    expect(header.slice(0, 3)).toEqual(['Registration Number', 'Mobile', 'Attendees']);
    expect(header.slice(3)).toEqual(['Dietary needs', 'Workshops', 'T-shirt size', 'Arrival']);

    // The pick-many cell joins with "; " and the leading-zero mobile is preserved.
    const row1 = lines.find((l) => l.includes('RC-CSV-01'));
    expect(row1).toContain('Painting; Music');
    expect(row1).toContain('0412345678');
    // The date+time answer is rendered friendly with AM/PM, not the raw 24-hour ISO string.
    expect(row1).toContain('20 Aug 2026, 2:30 PM');
    expect(row1).not.toContain('2026-08-20T14:30');

    // Oldest registration on top: RC-CSV-01 (seeded first) comes before RC-CSV-02.
    const idx1 = lines.findIndex((l) => l.includes('RC-CSV-01'));
    const idx2 = lines.findIndex((l) => l.includes('RC-CSV-02'));
    expect(idx1).toBeGreaterThan(0);
    expect(idx1).toBeLessThan(idx2);
  });
});

test.describe('RSVP check-in list, member with no events', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('someone with no free events sees a friendly empty state and no cards', async ({ page }) => {
    await page.goto(RSVP_URL);
    await expect(page.getByRole('heading', { name: 'No RSVP events yet' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('checkinrsvp-event-card')).toHaveCount(0);
  });
});

test.describe('RSVP check-in screen', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const row = (page, reg) => page.getByTestId('checkinrsvp-row').filter({ hasText: reg });
  // Select the "All" tab so a test sees every row (the page defaults to "Not checked in"); a
  // checked-in booking would otherwise drop off the default worklist mid-test.
  const showAll = (page) => page.getByTestId('checkinrsvp-tabs').getByRole('button', { name: 'All' }).click();
  const gotoActive = async (page) => {
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinActiveEventId}`);
    await expect(row(page, 'RC-A04')).toBeVisible({ timeout: 20_000 });
    await showAll(page);
  };
  const gotoInteract = async (page) => {
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinInteractEventId}`);
    await expect(row(page, 'RC-I-SINGLE')).toBeVisible({ timeout: 20_000 });
    await showAll(page);
  };

  test('the tabs default to Not checked in and filter by check-in state, and search narrows the rows', async ({ page }) => {
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinActiveEventId}`);
    const tabs = page.getByTestId('checkinrsvp-tabs');
    await expect(tabs.getByRole('button', { name: 'Not checked in', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
    // A fully-checked booking is hidden by default (it lives under "Checked in").
    await expect(page.getByTestId('checkinrsvp-row').filter({ hasText: 'RC-A01' })).toHaveCount(0);

    // Search: RC-A04's attendee is "Zara Searchtarget" - it stays, the fillers drop out of the list.
    await gotoActive(page);
    const rows = page.getByTestId('checkinrsvp-row');
    await page.getByPlaceholder('Reg No, Name, Email').fill('Zara');
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A05' })).toHaveCount(0);

    // Tabs, on a fresh load.
    await gotoActive(page);
    // Not checked in: partly-checked (RC-A03) and un-checked (RC-A04) show; fully-checked (RC-A01) hidden.
    await tabs.getByRole('button', { name: 'Not checked in', exact: true }).click();
    await expect(rows.filter({ hasText: 'RC-A03' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(0);

    // Checked in: only fully-checked (RC-A01); partly + un-checked hidden.
    await tabs.getByRole('button', { name: 'Checked in', exact: true }).click();
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A03' })).toHaveCount(0);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(0);

    // All: everything is back.
    await tabs.getByRole('button', { name: 'All' }).click();
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
  });

  test('the header shows the summary and stats with Back to the list, and on a phone search and tabs stay pinned', async ({ page }) => {
    await gotoActive(page);

    await expect(page.getByTestId('checkinrsvp-summary').getByText('E2E RSVP Checkin Active')).toBeVisible();
    const stats = page.getByTestId('checkinrsvp-stats');
    await expect(stats.getByText('Registrations')).toBeVisible();
    await expect(stats.getByText('Attendees')).toBeVisible();
    await expect(stats.getByText('Checked In')).toBeVisible();
    // No export button anywhere on the per-event page.
    await expect(page.getByRole('button', { name: /save.*pdf/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page).toHaveURL(new RegExp(`${RSVP_URL}$`));

    // Phone width: the search and tabs stay pinned while the summary scrolls away.
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinActiveEventId}`);
    // At phone width the mobile stacked list renders; wait for it so the page is tall enough to scroll.
    await expect(page.getByTestId('checkinrsvp-row-m').first()).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => window.scrollTo(0, 450));
    await expect(page.getByTestId('checkinrsvp-search')).toBeInViewport();
    await expect(page.getByTestId('checkinrsvp-tabs')).toBeInViewport();
    await expect(page.getByTestId('checkinrsvp-summary')).not.toBeInViewport();
  });

  test('a party of one checks in and out directly on its row', async ({ page }) => {
    await gotoInteract(page);
    const single = row(page, 'RC-I-SINGLE');

    await single.getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Checked in', exact: true })).toBeVisible();

    await single.getByRole('button', { name: 'Checked in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Check in', exact: true })).toBeVisible();
  });

  test('a party of two or more checks in through a sheet: one at a time, all at once, and untick', async ({ page }) => {
    await gotoInteract(page);
    const party = row(page, 'RC-I-PARTY');
    const openSheet = () => party.getByRole('button', { name: /Check in party/ }).click();

    // Opens the sheet; tick one attendee.
    await openSheet();
    const sheet = page.getByTestId('checkin-sheet');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Party One, not checked in' }).click();
    await expect(sheet.getByRole('button', { name: 'Party One, checked in' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(party.getByText('1/3')).toBeVisible();

    // Check in all -> every attendee ticked; the cell reads 3/3.
    await openSheet();
    await sheet.getByRole('button', { name: 'Check in all' }).click();
    await expect(sheet.getByRole('button', { name: 'Party Two, checked in' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Party Three, checked in' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(party.getByText('3/3')).toBeVisible();

    // Tapping a ticked attendee un-ticks them.
    await openSheet();
    await sheet.getByRole('button', { name: 'Party One, checked in' }).click();
    await expect(sheet.getByRole('button', { name: 'Party One, not checked in' })).toBeVisible();
  });

  test('a guest booking shows the email as Booked by, not the placeholder "Guest"', async ({ page }) => {
    await gotoInteract(page);
    // The guest account's name is the 'Guest' placeholder, so the row must show the email instead.
    await expect(row(page, 'RC-I-GUEST')).toContainText('guest-booking@test.dev');
  });

  test('the info icon shows only for bookings with answers and expands them inline', async ({ page }) => {
    await gotoInteract(page);

    // With answers -> icon present, expands the answers INLINE under the row (no modal).
    await row(page, 'RC-I-INFO').getByRole('button', { name: 'View attendee information' }).click();
    const answers = page.getByTestId('checkinrsvp-answers');
    await expect(answers).toBeVisible();
    await expect(answers.getByText('Dietary needs')).toBeVisible();
    await expect(answers.getByText('Vegetarian')).toBeVisible();

    // No answers -> no icon.
    await expect(row(page, 'RC-I-SINGLE').getByRole('button', { name: 'View attendee information' })).toHaveCount(0);
  });

  test('question answers expand inline under the row in friendly format and toggle shut', async ({ page }) => {
    await page.goto(`${RSVP_URL}/${readSeed().qtypesCsvEventId}`);
    const csvRow = page.getByTestId('checkinrsvp-row').filter({ hasText: 'RC-CSV-01' });
    await expect(csvRow).toBeVisible({ timeout: 20_000 });

    // Clicking the info icon opens the answers INLINE (no modal).
    await csvRow.getByRole('button', { name: 'View attendee information' }).click();
    const answers = page.getByTestId('checkinrsvp-answers');
    await expect(answers).toBeVisible();
    await expect(answers).toContainText('Painting; Music');
    // The inline panel renders the date the same friendly way as the downloads.
    await expect(answers).toContainText('20 Aug 2026, 2:30 PM');
    await expect(answers).not.toContainText('2026-08-20T14:30');

    // Clicking again collapses it.
    await csvRow.getByRole('button', { name: 'View attendee information' }).click();
    await expect(answers).toHaveCount(0);
  });

  test('the cancel X shows only when nobody is checked in and removes the booking on confirm', async ({ page }) => {
    await gotoInteract(page);

    // A booking with someone checked in shows no X.
    await expect(row(page, 'RC-I-DONE').getByRole('button', { name: 'Cancel registration' })).toHaveCount(0);

    // A wholly-unchecked booking: X -> confirm -> removed.
    await row(page, 'RC-I-CANCEL').getByRole('button', { name: 'Cancel registration' }).click();
    await expect(page.getByRole('heading', { name: 'Cancel this registration?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes, cancel it' }).click();
    await expect(row(page, 'RC-I-CANCEL')).toHaveCount(0);
  });

  test('an event with 100 RSVPs loads in batches with Load more, keeps search pinned, and search narrows', async ({ page }) => {
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinVolumeEventId}`);
    const rows = page.getByTestId('checkinrsvp-row');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    // Switch to All (the page defaults to "Not checked in") so the whole event loads.
    await page.getByTestId('checkinrsvp-tabs').getByRole('button', { name: 'All' }).click();
    // The first batch is 50 (not all 100 at once).
    await expect(page.getByText('Showing 50 of 100')).toBeVisible({ timeout: 20_000 });
    await expect(rows).toHaveCount(50);

    // Load more appends the next batch to 100, then the button is gone.
    await page.getByTestId('checkinrsvp-loadmore').click();
    await expect(rows).toHaveCount(100);
    await expect(page.getByTestId('checkinrsvp-loadmore')).toHaveCount(0);

    // Search + tabs stay pinned after scrolling to the bottom.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId('checkinrsvp-search')).toBeInViewport();
    await expect(page.getByTestId('checkinrsvp-tabs')).toBeInViewport();

    // Search still narrows 100 -> 1 (server-side).
    await page.getByPlaceholder('Reg No, Name, Email').fill('RC-V-042');
    await expect(rows).toHaveCount(1);
  });

  // Worst-case data - longest reg number, longest name, largest party - renders with the Reg Number
  // never clipped and no sideways page scroll, at phone, tablet and desktop widths.
  test('worst-case booking data is never clipped and the page never scrolls sideways at 360 / 768 / 1024', async ({ page }) => {
    const url = `${RSVP_URL}/${readSeed().rsvpCheckinInteractEventId}`;
    const LONG = 'REG-VERYLONGEVENTCODE-2264-00000001';
    for (const width of [360, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(url);
      // md+ renders the table; below md renders the stacked cards.
      const rowTid = width >= 768 ? 'checkinrsvp-row' : 'checkinrsvp-row-m';
      const rowLoc = page.getByTestId(rowTid).filter({ hasText: LONG });
      await expect(rowLoc).toBeVisible({ timeout: 20_000 });

      // Reg Number element does not overflow horizontally (never clipped with an ellipsis).
      const regFits = await rowLoc.getByTestId('checkinrsvp-regno').evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(regFits, `reg not clipped at ${width}px`).toBe(true);

      // The check-in control and the cancel X are fully on-screen (not clipped off a too-wide table).
      await expect(rowLoc.getByRole('button', { name: /Check in party/ })).toBeInViewport();
      await expect(rowLoc.getByRole('button', { name: 'Cancel registration' })).toBeInViewport();

      // The page never scrolls sideways at any tier.
      const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      expect(noHScroll, `no sideways scroll at ${width}px`).toBe(true);
    }
  });

  test('checking a booking in on "Not checked in" drops it off the list immediately', async ({ page }) => {
    // Default tab is "Not checked in"; RC-I-SINGLE is a single unchecked booking, so it shows here.
    await page.goto(`${RSVP_URL}/${readSeed().rsvpCheckinInteractEventId}`);
    const single = row(page, 'RC-I-SINGLE');
    await expect(single).toBeVisible({ timeout: 20_000 });
    await single.getByRole('button', { name: 'Check in', exact: true }).click();
    // Fully checked in -> it leaves the "Not checked in" worklist at once.
    await expect(row(page, 'RC-I-SINGLE')).toHaveCount(0);
  });
});

test.describe('paid check-in', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const row = (page, inv) => page.getByTestId('checkinpaid-row').filter({ hasText: inv });
  const gotoView = async (page) => {
    await page.goto(`${PAID_URL}/${readSeed().checkinPaidActiveEventId}`);
    await expect(row(page, 'INV-PAID-1')).toBeVisible({ timeout: 20_000 });
    // The page defaults to "Not checked in"; switch to All so a test sees every invoice and
    // in-row check-ins don't drop the row off the default worklist.
    await page.getByTestId('checkinpaid-tabs').getByRole('button', { name: 'All' }).click();
  };

  test('the list splits Active and Past, and tapping a card opens the event view', async ({ page }) => {
    const seed = readSeed();
    await page.goto(PAID_URL);
    const active = page.getByTestId('checkinpaid-active');
    const past = page.getByTestId('checkinpaid-past');
    await expect(active.getByText('E2E Paid Checkin Active')).toBeVisible({ timeout: 20_000 });
    await expect(past.getByText('E2E Paid Checkin Past')).toBeVisible();

    await page.getByTestId('checkinpaid-event-card').filter({ hasText: 'E2E Paid Checkin Active' })
      .getByText('E2E Paid Checkin Active').click();
    await expect(page).toHaveURL(new RegExp(`${PAID_URL}/${seed.checkinPaidActiveEventId}`));
  });

  test('the tabs default to Not checked in, and the stats show tickets, checked in and cancelled with no revenue or export', async ({ page }) => {
    await page.goto(`${PAID_URL}/${readSeed().checkinPaidActiveEventId}`);
    const tabs = page.getByTestId('checkinpaid-tabs');
    await expect(tabs.getByRole('button', { name: 'Not checked in', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
    // A fully-checked order (INV-PAID-3) is hidden by default (it lives under "Checked in").
    await expect(page.getByTestId('checkinpaid-row').filter({ hasText: 'INV-PAID-3' })).toHaveCount(0);

    await gotoView(page);
    const stats = page.getByTestId('checkinpaid-stats');
    await expect(stats.getByText('Total Tickets')).toBeVisible();
    await expect(stats.getByText('Checked In')).toBeVisible();
    await expect(stats.getByText('Cancelled')).toBeVisible();
    await expect(stats.getByText(/revenue/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /save.*pdf/i })).toHaveCount(0);
  });

  test('a one-ticket order checks in from its row, and a bigger order checks in through the sheet', async ({ page }) => {
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

  test('the tabs filter by check-in state, and search matches ticket, invoice, buyer or email', async ({ page }) => {
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

  test('the info icon appears only for orders with answers and opens the Attendee Info sheet', async ({ page }) => {
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

  test('a fully cancelled order is hidden and counted in the Cancelled stat', async ({ page }) => {
    await gotoView(page);
    await expect(page.getByTestId('checkinpaid-row').filter({ hasText: 'INV-PAID-CANCELLED' })).toHaveCount(0);
    await expect(page.getByTestId('checkinpaid-stat-cancelled')).toHaveText('1');
  });

  test('Scan QR opens the scanner, Back closes it, and it auto-closes after 60s with no scans', async ({ page }) => {
    await gotoView(page);
    await page.clock.install(); // control timers set from here on (the scanner's idle countdown)

    await page.getByTestId('checkinpaid-scan').click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toHaveCount(0);

    // Reopen and leave it idle: fast-forward past 60s -> the scanner closes back to the list.
    await page.getByTestId('checkinpaid-scan').click();
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toBeVisible({ timeout: 20_000 });
    await page.clock.fastForward(61_000);
    await expect(page.getByRole('heading', { name: 'Scan QR Code' })).toHaveCount(0);
    await expect(page.getByTestId('checkinpaid-scan')).toBeVisible();
  });
});
