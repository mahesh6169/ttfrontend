// The attendee seat map (/events/seats): sticky bar and gating, the hold timer, tap/zoom/pan, seat
// count sync with the tickets page, walkways, not-for-sale and organiser-reserved seats, and a
// flipped layout. Runs as the member.
import { test, expect } from '@playwright/test';
import { readSeed, clearReservation, openSeats } from '../helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const zoomInPastThreshold = async (page) => {
  for (let i = 0; i < 4; i++) await page.getByLabel('Zoom in').click();
};

test.describe('choosing seats', () => {
  test.beforeEach(async ({ page }) => {
    await clearReservation(page, readSeed().zoomHallEventId);
  });

  test('the sticky bar counts "N of M seats selected" and Proceed only enables once every seat is picked', async ({ page }) => {
    const id = readSeed().zoomHallEventId;
    await openSeats(page, id, 2);

    const bar = page.getByTestId('seats-cta-bar');
    const proceed = page.getByRole('button', { name: 'Proceed to Payment' });
    await expect(bar).toContainText('0 of 2 seats selected', { timeout: 20_000 });
    await expect(proceed).toBeDisabled({ timeout: 20_000 });

    await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
    await expect(bar).toContainText('1 of 2 seats selected', { timeout: 20_000 });
    await expect(proceed).toBeDisabled(); // only 1 of 2

    await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
    await expect(bar).toContainText('2 of 2 seats selected', { timeout: 20_000 });
    await expect(proceed).toBeEnabled({ timeout: 20_000 });
  });

  test('the hold timer is an amber badge that turns red under one minute', async ({ page }) => {
    const id = readSeed().zoomHallEventId;

    // Default 15-minute hold -> amber badge on load.
    await openSeats(page, id, 1);
    await expect(page.getByTestId('reservation-timer')).toHaveClass(/amber/, { timeout: 20_000 });

    // Start again from a clean slate (server hold + this tab's saved booking state).
    await clearReservation(page, id);
    await page.evaluate(() => sessionStorage.clear());

    // Force the reservation to expire in ~45s (only the GET reservation payload is tweaked) so the same
    // badge renders red, proving the under-one-minute threshold without waiting out a real 15-min hold.
    // The seats page cache-busts the reservation GET (.../reservation?_t=...), so match with or without a query string.
    await page.route(/\/events\/[^/]+\/reservation(\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const resp = await route.fetch();
      let body;
      try { body = await resp.json(); } catch { return route.fulfill({ response: resp }); }
      if (body?.reservation) body.reservation.expiresAt = new Date(Date.now() + 45_000).toISOString();
      return route.fulfill({ response: resp, json: body });
    });

    await openSeats(page, id, 1);
    await expect(page.getByTestId('reservation-timer')).toHaveClass(/red/, { timeout: 20_000 });
  });

  test('at the fitted view a tap selects a seat straight away and a second tap deselects it', async ({ page }) => {
    await openSeats(page, readSeed().zoomHallEventId);
    await expect(page.getByTestId('zoom-hint')).toHaveCount(0); // the zoom-gate hint is gone
    await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'C40 - Selected by you' }).click();
    await expect(page.getByRole('button', { name: 'C40 - Available (tap to select)' })).toBeVisible({ timeout: 15_000 });
  });

  test('Fit returns to the fitted view and a tap still selects there', async ({ page }) => {
    await openSeats(page, readSeed().zoomHallEventId);
    await zoomInPastThreshold(page);
    await page.getByLabel('Fit view').click();
    // Back at the fitted view, a tap still selects (selection is never gated by zoom).
    await page.getByRole('button', { name: 'C41 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'C41 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  });

  test('a drag over seats pans and selects nothing, while a plain click selects', async ({ page }) => {
    await openSeats(page, readSeed().zoomHallEventId);
    await zoomInPastThreshold(page);
    const seat = page.getByRole('button', { name: 'C40 - Available (tap to select)' });
    const box = await seat.boundingBox();
    // Drag starting on the seat -> pans, does not select.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 + 40, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toHaveCount(0);
    // A plain click selects.
    await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  });

  test('on a phone a seat tap selects at the fitted view on load, with the legend visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openSeats(page, readSeed().zoomHallEventId);
    await expect(page.getByTestId('zoom-hint')).toHaveCount(0); // no gate hint
    await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'C40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Sold', { exact: true })).toBeVisible(); // chrome visible on mobile
  });

  // A REAL touch device (hover:none, pointer:coarse): one tap must select (the old hover styling made
  // the first tap only reveal the card).
  test.describe('on a touch device', () => {
    // isMobile+hasTouch make Chromium report `hover: none` / `pointer: coarse` (a real phone).
    test.use({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, storageState: 'e2e/.auth/member.json' });

    test('one tap selects the seat and shows its Row/Seat card', async ({ page }) => {
      await clearReservation(page, readSeed().zoomHallEventId);
      await openSeats(page, readSeed().zoomHallEventId);
      await zoomInPastThreshold(page);
      await page.getByRole('button', { name: 'C40 - Available (tap to select)' }).tap();
      const selected = page.getByRole('button', { name: 'C40 - Selected by you' });
      await expect(selected).toBeVisible({ timeout: 15_000 }); // selected on the tap
      const card = selected.locator('xpath=..').getByTestId('seat-hover-card');
      await expect(card).toContainText('40');
    });
  });
});

// The seats page reads the required-seat count from the LIVE reservation and reconciles held seats
// when the buyer changes quantity on the tickets page.
test.describe('seat count follows the ticket quantity', () => {
  const addStandard = (page, n) => (async () => {
    for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Add one Standard' }).click();
  })();
  const removeStandard = (page, n) => (async () => {
    for (let i = 0; i < n; i++) await page.getByRole('button', { name: 'Remove one Standard' }).click();
  })();
  const pickSeats = async (page, seats) => {
    for (const s of seats) {
      await page.getByRole('button', { name: `${s} - Available (tap to select)` }).click();
    }
  };
  const gotoSeats = async (page, eventId) => {
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
    await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
  };

  test.beforeEach(async ({ page }) => {
    await clearReservation(page, readSeed().seatSyncEventId);
  });

  test('raising tickets from 5 to 6 after holding 5 seats keeps them and lets a 6th be picked', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
    await addStandard(page, 5);
    await expect(page.getByText(/5 tickets selected/)).toBeVisible({ timeout: 20_000 });
    await gotoSeats(page, seed.seatSyncEventId);

    await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5']);
    await expect(page.getByText(/5 of 5 seats selected/)).toBeVisible({ timeout: 15_000 });

    // Back to tickets, raise to 6.
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.seatSyncEventId}`), { timeout: 15_000 });
    await addStandard(page, 1);
    await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 15_000 });

    // Return to seats: the 5 held seats stay selected, the count is 5 of 6 (live), and the 6th selects.
    await gotoSeats(page, seed.seatSyncEventId);
    await expect(page.getByText(/5 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'A6 - Available (tap to select)' }).click();
    await expect(page.getByText('You can only select 5 seats')).toHaveCount(0);
    await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
  });

  test('lowering tickets from 6 to 4 after holding 6 seats trims the held seats to 4', async ({ page }) => {
    const seed = readSeed();

    await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
    await addStandard(page, 6);
    await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 20_000 });
    await gotoSeats(page, seed.seatSyncEventId);

    await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/tickets/${seed.seatSyncEventId}`), { timeout: 15_000 });
    await removeStandard(page, 2);
    await expect(page.getByText(/4 tickets selected/)).toBeVisible({ timeout: 15_000 });

    // Return to seats: the held seats reconcile to exactly 4 and Proceed enables.
    await gotoSeats(page, seed.seatSyncEventId);
    await expect(page.getByText(/4 of 4 seats selected/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
  });

  test('with 6 tickets Proceed stays disabled at 5 seats and enables at exactly 6', async ({ page }) => {
    const seed = readSeed();

    await page.goto(`/events/tickets/${seed.seatSyncEventId}`);
    await addStandard(page, 6);
    await expect(page.getByText(/6 tickets selected/)).toBeVisible({ timeout: 20_000 });
    await gotoSeats(page, seed.seatSyncEventId);

    await pickSeats(page, ['A1', 'A2', 'A3', 'A4', 'A5']);
    await expect(page.getByText(/5 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeDisabled();

    await page.getByRole('button', { name: 'A6 - Available (tap to select)' }).click();
    await expect(page.getByText(/6 of 6 seats selected/)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Proceed to Payment' })).toBeEnabled();
  });
});

// Walkways are cosmetic spacers: rows split into blocks, seats on each side behave normally.
test.describe('walkways', () => {
  test.beforeEach(async ({ page }) => {
    const seed = readSeed();
    await clearReservation(page, seed.walkwayEventId);
    await clearReservation(page, seed.walkwayWideEventId);
  });

  test('a row splits into blocks at the walkway, seats either side can be held, and the gap is not clickable', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.walkwayEventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.walkwayEventId}`), { timeout: 15_000 });

    // Blocks: a walkway spacer is rendered inside the row.
    await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });

    // A seat on each side of the gap after seat 13 can be selected and held.
    await page.getByRole('button', { name: 'A13 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'A13 - Selected by you' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'A14 - Available (tap to select)' }).click();
    await expect(page.getByRole('button', { name: 'A14 - Selected by you' })).toBeVisible({ timeout: 15_000 });

    // The gap itself is a plain, non-interactive div (no seat, no handler).
    await expect(page.locator('[data-walkway="true"]').first()).toHaveJSProperty('tagName', 'DIV');
  });

  // The map is one zoom/pan canvas: a wide row with a walkway fits on load (no horizontal scrollbar),
  // and the far-end seat is reached by zooming in and panning, then selected.
  test('on a phone the far end of a wide row with a walkway is reached by zoom and pan, then selected', async ({ page }) => {
    const seed = readSeed();
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/events/tickets/${seed.walkwayWideEventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.walkwayWideEventId}`), { timeout: 15_000 });

    // Blocks render; the whole row fits on load (no horizontal scroll container).
    await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });
    await expect(page.locator('.seat-container')).toHaveCount(0);

    // Zoom in until seats are tap-sized (past the selection threshold).
    for (let i = 0; i < 2; i++) await page.getByLabel('Zoom in').click();

    // Pan left until the far-end seat is on screen, then select it.
    const far = page.getByRole('button', { name: 'A40 - Available (tap to select)' });
    for (let i = 0; i < 8; i++) {
      const b = await far.boundingBox();
      if (b && b.x >= 4 && b.x + b.width <= 371) break;
      await page.mouse.move(340, 400);
      await page.mouse.down();
      await page.mouse.move(60, 400, { steps: 6 });
      await page.mouse.up();
    }
    await far.click();
    await expect(page.getByRole('button', { name: 'A40 - Selected by you' })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('layouts saved by the organiser', () => {
  test('a not-for-sale seat is greyed and unclickable, and the legend lists Not for sale', async ({ page }) => {
    await clearReservation(page, readSeed().blockedSeatEventId);
    await openSeats(page, readSeed().blockedSeatEventId);
    // A-1 is not for sale: its accessible name says so and the button is disabled (unclickable).
    const blocked = page.getByRole('button', { name: 'A1 - Not for sale' });
    await expect(blocked).toBeVisible();
    await expect(blocked).toBeDisabled();
    // A normal seat is still selectable, proving the map itself works.
    await expect(page.getByRole('button', { name: 'A2 - Available (tap to select)' })).toBeVisible();
    // The shared seat legend shows a Not for sale entry.
    await expect(page.getByTestId('seats-legend')).toContainText('Not for sale');
  });

  test('a flipped layout matches the builder: reversed order, mirrored aisle, reserved and blocked seats by id', async ({ page }) => {
    await clearReservation(page, readSeed().flippedSeatEventId);
    await openSeats(page, readSeed().flippedSeatEventId);

    // The seat-1 cue matches the builder's flipped orientation.
    await expect(page.getByTestId('seat-numbering-hint')).toHaveAttribute('data-flipped', 'true');

    // Reversed draw order: A5 (last) is left of A1 (first).
    const blocked = page.getByRole('button', { name: 'A5 - Not for sale' });
    const reserved = page.getByRole('button', { name: 'A1 - Reserved by organizer' });
    await expect(blocked).toBeVisible();
    await expect(reserved).toBeVisible();
    const x = async (loc) => (await loc.boundingBox()).x;
    expect(await x(blocked)).toBeLessThan(await x(reserved));

    // The blocked and reserved seats are the same ids, just flipped, and both unclickable.
    await expect(blocked).toBeDisabled();
    await expect(reserved).toBeDisabled();

    // The aisle mirrors to sit between A3 and A2 in the reversed render (A5,A4,A3,[aisle],A2,A1).
    const a3 = await x(page.getByRole('button', { name: 'A3 - Available (tap to select)' }));
    const a2 = await x(page.getByRole('button', { name: 'A2 - Available (tap to select)' }));
    const aisleX = (await page.locator('[data-walkway="true"]').first().boundingBox()).x;
    expect(a3).toBeLessThan(aisleX);
    expect(aisleX).toBeLessThan(a2);
  });

  test('the attendee map shows the same amber aisles and purple reserved seats as the builder', async ({ page }) => {
    const seed = readSeed();
    await page.goto(`/events/tickets/${seed.builderParityEventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${seed.builderParityEventId}`), { timeout: 15_000 });

    await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });
    const reserved = page.getByRole('button', { name: /^A3 - Reserved by organizer/ });
    await expect(reserved).toBeVisible();
    await expect(reserved).toHaveClass(/purple/);
  });
});
