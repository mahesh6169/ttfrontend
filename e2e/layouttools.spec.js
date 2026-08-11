// events-layout-tools.md - two Layout-tab conveniences in the seat builder. Skip rows omits chosen
// letters from the auto-generated row labels (AC1) and the row-start rejects a lone skipped letter while
// typed labels are only unique+valid (AC2). A horizontal flip reverses each row's draw order with ids
// unchanged (AC3), mirrors the aisles and keeps reserved/blocked seats by id on both maps (AC4), and the
// saved flip persists and matches on the attendee map (AC6). Both tools are exercised via editing seeded
// events as the owning organiser (editing bypasses the Stripe gate + Google Places).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const xOf = async (page, name) => (await page.getByRole('button', { name, exact: true }).boundingBox()).x;

test.describe('layout tools - builder (organiser edit)', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const gotoStep3 = async (page, eventId) => {
    await page.goto(`/events/edit/${eventId}`);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Seat Builder' })).toBeVisible({ timeout: 20_000 });
  };
  const openBuilder = async (page) => {
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 15_000 });
  };
  const selectStep = async (page, name) => { await page.getByRole('tab', { name }).click(); };
  const generate = async (page, rows, seats) => {
    await page.getByLabel('Number Of Rows').fill(String(rows));
    await page.getByLabel('Seats Per Row').fill(String(seats));
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('button', { name: `Seat A${seats}`, exact: true })).toBeVisible();
  };

  test('AC1 Skip rows omits I from the auto-generated labels; a never-reached entry has no effect', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // Skip "I": 12 rows label A..H then J..M (no I).
    await page.getByLabel('Skip Rows').fill('I');
    await generate(page, 12, 4);
    await expect(page.getByLabel('Row 8 label')).toHaveValue('H');
    await expect(page.getByLabel('Row 9 label')).toHaveValue('J');
    await expect(page.getByLabel('Row 12 label')).toHaveValue('M');

    // A never-reached entry ("AI" on a 12-row hall) has no effect and raises no error: I is NOT skipped.
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByLabel('Skip Rows').fill('AI');
    await generate(page, 12, 4);
    await expect(page.getByLabel('Row 9 label')).toHaveValue('I');
  });

  test('AC2 the row-start rejects a lone skipped letter; "AO" is accepted; a duplicate label is rejected', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // Row-start = "I" (a default-skipped letter) -> error + Add disabled.
    await page.getByLabel('Row Label').fill('I');
    await page.getByLabel('Number Of Rows').fill('3');
    await page.getByLabel('Seats Per Row').fill('4');
    await expect(page.getByText(/Row Label can.t be a skipped letter/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();

    // A multi-letter "AO" is accepted (it is not the letter I or O).
    await page.getByLabel('Row Label').fill('AO');
    await expect(page.getByRole('button', { name: 'Add', exact: true })).toBeEnabled();

    // Duplicate row label is rejected in the row list.
    await page.getByLabel('Row Label').fill('A');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByLabel('Row 1 label')).toHaveValue('A');
    await page.getByLabel('Row 2 label').fill('A');
    await expect(page.getByText('Row name already used')).toBeVisible();
  });

  test('AC3 a horizontal flip reverses a row to A3, A2, A1 left-to-right; seat ids are unchanged', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 3); // A1, A2, A3

    // Before flip: A1 is left of A3, and the seat-1 cue sits on the left (not flipped).
    expect(await xOf(page, 'Seat A1')).toBeLessThan(await xOf(page, 'Seat A3'));
    await expect(page.getByTestId('seat-numbering-hint')).toHaveAttribute('data-flipped', 'false');

    await page.getByTestId('flip-horizontal').click();

    // After flip: A3 is left of A1, the seat-1 cue moves to the right, and all three ids still present.
    expect(await xOf(page, 'Seat A3')).toBeLessThan(await xOf(page, 'Seat A1'));
    await expect(page.getByTestId('seat-numbering-hint')).toHaveAttribute('data-flipped', 'true');
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat A3', exact: true })).toBeVisible();
  });

  test('AC4 (builder) after a flip the aisle mirrors and reserved/blocked seats stay by id', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 5); // A1..A5

    // Aisle after seat 2 (between A2 and A3).
    await selectStep(page, 'Aisles');
    await page.getByLabel('Aisle row').fill('A');
    await page.getByLabel('Aisle seat number').fill('2');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Reserve A1, mark A5 not-for-sale.
    await selectStep(page, 'Reservations');
    await page.getByRole('button', { name: 'Seat A1', exact: true }).click();
    await selectStep(page, 'Not for sale');
    await page.getByRole('button', { name: 'Seat A5', exact: true }).click();

    // Flip from the Layout tab.
    await selectStep(page, 'Layout');
    await page.getByTestId('flip-horizontal').click();

    // Reserved + blocked follow their ids into the flipped positions.
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'blocked');

    // The aisle mirrors: after the flip the row draws A5,A4,A3,[aisle],A2,A1 - the aisle sits between A3 and A2.
    const aisleX = (await page.locator('[data-walkway="true"]').boundingBox()).x;
    expect(await xOf(page, 'Seat A3')).toBeLessThan(aisleX);
    expect(aisleX).toBeLessThan(await xOf(page, 'Seat A2'));
  });

  test('AC6 (builder) a saved flip persists on reopen', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 10, 40); // 400 = capacity, so Save is allowed (exact match required)
    await page.getByTestId('flip-horizontal').click();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();

    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await expect(page.getByTestId('flip-horizontal')).toHaveAttribute('aria-pressed', 'true');
    expect(await xOf(page, 'Seat A3')).toBeLessThan(await xOf(page, 'Seat A1'));
  });
});

test.describe('layout tools - attendee map (member)', () => {
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
  const openSeats = async (page, eventId) => {
    await page.goto(`/events/tickets/${eventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await page.getByRole('button', { name: 'Select Seats' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/seats/${eventId}`), { timeout: 15_000 });
    await expect(page.getByTestId('stage-bar')).toBeVisible({ timeout: 20_000 });
  };

  test.beforeEach(async ({ page }) => {
    await clearReservation(page, readSeed().flippedSeatEventId);
  });

  test('AC4/AC6 (attendee) the saved flip matches the builder: reversed order, mirrored aisle, seats by id', async ({ page }) => {
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
});
