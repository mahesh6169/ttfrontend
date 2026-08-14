// Browser journeys for featureplans/events-rsvp-checkin-redesign.md - the two new checkinrsvp
// pages (J1 the event LIST, J2 the per-event check-in). Titles carry the AC numbers. Runs as the
// known-credential organiser except AC3, which uses the plain member (owns no events -> empty state).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const LIST_URL = '/users/profile/checkinrsvp';

// ─── J1: the LIST page ──────────────────────────────────────────────────────
test.describe('J1 list page', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC1 upcoming events appear under Active, past under Past, and a card tap opens the check-in screen', async ({ page }) => {
    const seed = readSeed();
    await page.goto(LIST_URL);

    const active = page.getByTestId('checkinrsvp-active');
    const past = page.getByTestId('checkinrsvp-past');
    await expect(active.getByText('E2E RSVP Checkin Active')).toBeVisible({ timeout: 20_000 });
    await expect(past.getByText('E2E RSVP Checkin Past')).toBeVisible();

    // Tap the card body (not its Save PDF) -> routes to the per-event screen.
    await page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E RSVP Checkin Active' })
      .getByText('E2E RSVP Checkin Active').click();
    await expect(page).toHaveURL(new RegExp(`/users/profile/checkinrsvp/${seed.rsvpCheckinActiveEventId}`));
  });

  test('AC2 a card Save PDF downloads the attendee list without navigating', async ({ page }) => {
    await page.goto(LIST_URL);
    const card = page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E RSVP Checkin Active' });
    await expect(card).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Save PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    // No navigation occurred - still on the list.
    await expect(page).toHaveURL(new RegExp(`${LIST_URL}$`));
  });
});

test.describe('J1 empty state', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('AC3 an organiser with no free events sees a friendly empty state and no card list', async ({ page }) => {
    await page.goto(LIST_URL);
    await expect(page.getByRole('heading', { name: 'No RSVP events yet' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('checkinrsvp-event-card')).toHaveCount(0);
  });
});

// ─── J2: the per-event check-in screen ──────────────────────────────────────
test.describe('J2 per-event check-in', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const row = (page, reg) => page.getByTestId('checkinrsvp-row').filter({ hasText: reg });
  const gotoActive = async (page) => {
    await page.goto(`${LIST_URL}/${readSeed().rsvpCheckinActiveEventId}`);
    await expect(row(page, 'RC-A04')).toBeVisible({ timeout: 20_000 });
  };
  const gotoInteract = async (page) => {
    await page.goto(`${LIST_URL}/${readSeed().rsvpCheckinInteractEventId}`);
    await expect(row(page, 'RC-I-SINGLE')).toBeVisible({ timeout: 20_000 });
  };

  test('AC4 the header shows the summary and stats (no export), and Back returns to the list', async ({ page }) => {
    await gotoActive(page);

    await expect(page.getByTestId('checkinrsvp-summary').getByText('E2E RSVP Checkin Active')).toBeVisible();
    const stats = page.getByTestId('checkinrsvp-stats');
    await expect(stats.getByText('Registrations')).toBeVisible();
    await expect(stats.getByText('Attendees')).toBeVisible();
    await expect(stats.getByText('Checked In')).toBeVisible();
    // No export button anywhere on the per-event page.
    await expect(page.getByRole('button', { name: /save.*pdf/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Back' }).click();
    await expect(page).toHaveURL(new RegExp(`${LIST_URL}$`));
  });

  test('AC5 search narrows to matching registrations', async ({ page }) => {
    await gotoActive(page);
    const rows = page.getByTestId('checkinrsvp-row');
    await page.getByPlaceholder('Reg No, Name, Email').fill('Zara');
    // RC-A04's attendee is "Zara Searchtarget" - it stays, the fillers drop out of the list.
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A05' })).toHaveCount(0);
  });

  test('AC6 the All / Pending / Done tabs filter by check-in state', async ({ page }) => {
    await gotoActive(page);
    const tabs = page.getByTestId('checkinrsvp-tabs');
    const rows = page.getByTestId('checkinrsvp-row');

    // Pending: partly-checked (RC-A03) and un-checked (RC-A04) show; fully-checked (RC-A01) hidden.
    await tabs.getByRole('button', { name: 'Pending' }).click();
    await expect(rows.filter({ hasText: 'RC-A03' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(0);

    // Done: only fully-checked (RC-A01); partly + un-checked hidden.
    await tabs.getByRole('button', { name: 'Done' }).click();
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A03' })).toHaveCount(0);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(0);

    // All: everything is back.
    await tabs.getByRole('button', { name: 'All' }).click();
    await expect(rows.filter({ hasText: 'RC-A01' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'RC-A04' })).toHaveCount(1);
  });

  test('AC7 the search and tabs stay pinned while the summary scrolls away', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`${LIST_URL}/${readSeed().rsvpCheckinActiveEventId}`);
    // At phone width the mobile stacked list renders; wait for it so the page is tall enough to scroll.
    await expect(page.getByTestId('checkinrsvp-row-m').first()).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => window.scrollTo(0, 450));
    await expect(page.getByTestId('checkinrsvp-search')).toBeInViewport();
    await expect(page.getByTestId('checkinrsvp-tabs')).toBeInViewport();
    await expect(page.getByTestId('checkinrsvp-summary')).not.toBeInViewport();
  });

  test('AC8 a party of one toggles check-in directly on its row', async ({ page }) => {
    await gotoInteract(page);
    const single = row(page, 'RC-I-SINGLE');

    await single.getByRole('button', { name: 'Check in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Checked in', exact: true })).toBeVisible();

    await single.getByRole('button', { name: 'Checked in', exact: true }).click();
    await expect(single.getByRole('button', { name: 'Check in', exact: true })).toBeVisible();
  });

  test('AC9 a party of 2+ opens the check-in sheet; count rises, Check in all completes, a ticked attendee un-ticks', async ({ page }) => {
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

  test('AC10 the info icon shows only for bookings with attendee information and opens the sheet', async ({ page }) => {
    await gotoInteract(page);

    // With answers -> icon present, opens the "Attendee information" sheet listing the answer.
    await row(page, 'RC-I-INFO').getByRole('button', { name: 'View attendee information' }).click();
    const sheet = page.getByTestId('rsvp-answers-sheet');
    await expect(sheet.getByRole('heading', { name: 'Attendee information' })).toBeVisible();
    await expect(sheet.getByText('Dietary needs')).toBeVisible();
    await expect(sheet.getByText('Vegetarian')).toBeVisible();
    await page.keyboard.press('Escape');

    // No answers -> no icon.
    await expect(row(page, 'RC-I-SINGLE').getByRole('button', { name: 'View attendee information' })).toHaveCount(0);
  });

  test('AC11 the cancel X shows only when nobody is checked in and removes the booking on confirm', async ({ page }) => {
    await gotoInteract(page);

    // A booking with someone checked in shows no X.
    await expect(row(page, 'RC-I-DONE').getByRole('button', { name: 'Cancel registration' })).toHaveCount(0);

    // A wholly-unchecked booking: X -> confirm -> removed.
    await row(page, 'RC-I-CANCEL').getByRole('button', { name: 'Cancel registration' }).click();
    await expect(page.getByRole('heading', { name: 'Cancel this registration?' })).toBeVisible();
    await page.getByRole('button', { name: 'Yes, cancel it' }).click();
    await expect(row(page, 'RC-I-CANCEL')).toHaveCount(0);
  });

  test('a high-volume event (100 RSVPs) loads in batches with "Load more", stays pinned, and narrows', async ({ page }) => {
    await page.goto(`${LIST_URL}/${readSeed().rsvpCheckinVolumeEventId}`);
    const rows = page.getByTestId('checkinrsvp-row');
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    // The first batch is 50 (not all 100 at once).
    await expect(rows).toHaveCount(50);
    await expect(page.getByText('Showing 50 of 100')).toBeVisible();

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

  // Feel-pass verification (CheckinTable contract): worst-case data - longest reg number, longest
  // name, largest party - renders with the Reg Number never clipped and no sideways page scroll,
  // across all three layout-foundation tiers (phone 360, tablet 768, desktop 1280).
  test('worst-case data: nothing clipped and no sideways scroll at 360 / 768 / 1024', async ({ page }) => {
    const url = `${LIST_URL}/${readSeed().rsvpCheckinInteractEventId}`;
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
});
