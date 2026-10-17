// The seat builder overlay (wizard step 3 -> Seat Builder) and the Seating Configuration card. Reached
// by EDITING a seeded event as the owning organiser (editing bypasses the Stripe gate + Google Places).
// Sidebar steps: Layout, Aisles, Reservations, Not for sale. The Layout calculator creates rows with the
// "Add" button; canvas edits are gated to their tab. Nothing here clicks the wizard's Update, so the
// seeded events keep their saved layouts.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

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
const selectStep = async (page, name) => {
  await page.getByRole('tab', { name }).click();
};
// Layout calculator: type Rows/Seats (start empty), then the "Add" button creates the hall. On mobile
// the calculator lives in the bottom sheet, so open the Layout tool first (a no-op on desktop where the
// tool is inline; Layout is the default active tab).
const generate = async (page, rows, seats) => {
  await page.getByRole('tab', { name: 'Layout' }).click();
  await page.getByLabel('Number Of Rows').fill(String(rows));
  await page.getByLabel('Seats Per Row').fill(String(seats));
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: `Seat A${seats}`, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: `Seat A${seats + 1}`, exact: true })).toHaveCount(0);
};
// The same calculator without first clicking the Layout tab (desktop, Layout already active) - used
// where a field such as Skip Rows is filled before the hall is added.
const addHall = async (page, rows, seats) => {
  await page.getByLabel('Number Of Rows').fill(String(rows));
  await page.getByLabel('Seats Per Row').fill(String(seats));
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('button', { name: `Seat A${seats}`, exact: true })).toBeVisible();
};
// A seam click on the map STAGES the spot (fills Row + Seat); the panel Add/Clear button then acts.
const placeAisleViaMap = async (page, row, seat) => {
  await page.getByRole('button', { name: `Add walkway after seat ${seat} in row ${row}` }).click(); // stage
  await page.getByTestId('tool-panel').getByRole('button', { name: 'Add', exact: true }).click();   // place
};
const clearAisleViaMap = async (page, row, seat) => {
  await page.getByRole('button', { name: `Remove walkway after seat ${seat} in row ${row}` }).click(); // stage
  await page.getByTestId('tool-panel').getByRole('button', { name: 'Clear', exact: true }).click();     // remove
};
const xOf = async (page, name) => (await page.getByRole('button', { name, exact: true }).boundingBox()).x;

test.describe('building a layout', () => {
  test('the overlay keeps the wizard state on Save and on Cancel, without a route change', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    const url = page.url();
    const limit = page.getByPlaceholder('Max per order');
    await limit.fill('7');

    await openBuilder(page);
    await generate(page, 10, 40); // fill to the 400 capacity so Save is allowed (exact match required)
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await expect(limit).toHaveValue('7');
    expect(page.url()).toBe(url);

    await openBuilder(page);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await expect(limit).toHaveValue('7');
    expect(page.url()).toBe(url);
  });

  test('the calculator builds one canvas with the stage bar and the capacity matches at 400 seats', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    await page.getByLabel('Number Of Rows').fill('10');
    await page.getByLabel('Seats Per Row').fill('40');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toBeVisible();
    await expect(page.getByTestId('stage-bar')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay').getByRole('button', { name: /^Seat / })).toHaveCount(400);
    await expect(page.getByTestId('capacity-badge')).toContainText('Seating Capacity');
    await expect(page.getByTestId('capacity-badge')).toContainText('400');
  });

  test('Add Single Row copies the previous row (seat count and walkways) with the next label', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 12);
    await selectStep(page, 'Aisles');
    await placeAisleViaMap(page, 'A', 4);
    await selectStep(page, 'Layout'); // Add Single Row is in the Layout tool (also in the rows-panel header)
    await page.getByTestId('tool-panel').getByRole('button', { name: 'Add Single Row' }).click();
    // Row B: same 12 seats (B12 exists, B13 does not) and the copied walkway after seat 4.
    await expect(page.getByRole('button', { name: 'Seat B12', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat B13', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Remove walkway after seat 4 in row B' })).toBeVisible();
  });

  test('Apply to all rows cuts one straight aisle through every row, and single aisles toggle per row', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 3, 40);
    await selectStep(page, 'Aisles');
    await page.getByLabel('Aisle seat number').fill('13');
    await page.getByRole('button', { name: 'Apply to all rows' }).click();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(3); // one per row, same position
    for (const r of ['A', 'B', 'C']) {
      await expect(page.getByRole('button', { name: `Remove walkway after seat 13 in row ${r}` })).toBeVisible();
    }
    // Staging one row's amber lane then Clear removes only that row's gap.
    await clearAisleViaMap(page, 'A', 13);
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(2);
    // Staging an empty gap then Add puts a single gap back.
    await placeAisleViaMap(page, 'A', 5);
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(3);
  });

  test('the Row + Seat aisle control adds or clears one row and rejects an unknown row or a seat past the row end', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20); // rows A and B, 20 seats each
    await selectStep(page, 'Aisles');
    const panel = page.getByTestId('tool-panel');
    await page.getByLabel('Aisle row').fill('A');
    await page.getByLabel('Aisle seat number').fill('13');
    await panel.getByRole('button', { name: 'Add', exact: true }).click(); // A13 clear -> Add, row A only
    await expect(page.getByRole('button', { name: 'Remove walkway after seat 13 in row A' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add walkway after seat 13 in row B' })).toBeVisible(); // B untouched
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(1);
    // Re-enter A13: it now has a lane, so the same button reads Clear and removes just that row's gap.
    await page.getByLabel('Aisle row').fill('A');
    await page.getByLabel('Aisle seat number').fill('13');
    await expect(panel.getByRole('button', { name: 'Clear', exact: true })).toBeVisible();
    await panel.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(0);

    // Unknown row -> explicit error, Add disabled.
    await page.getByLabel('Aisle row').fill('BB');
    await page.getByLabel('Aisle seat number').fill('5');
    await expect(panel.getByText(/Row BB does not exist/i)).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
    // Seat past that row's end -> explicit error naming the real size.
    await page.getByLabel('Aisle row').fill('A');
    await page.getByLabel('Aisle seat number').fill('25');
    await expect(panel.getByText(/Row A has only 20 seats/i)).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Add', exact: true })).toBeDisabled();
  });

  test('clicking seats and Bulk Reserve both add to the reserved list, which merges and survives Save', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 10, 40); // 400 = capacity, so the final Save is allowed
    await selectStep(page, 'Reservations');
    // Click a seat -> reserved (purple).
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
    // Bulk Reserve merges a range and clears the box (one-time entry).
    await page.getByLabel('Bulk reserve seats').fill('A4-A6');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByLabel('Bulk reserve seats')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved'); // merge, not replace
    // Save then reopen -> the reserved list persisted.
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await selectStep(page, 'Reservations');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
  });

  test('the Not for sale tab marks seats by click and by typed range, shows in the legend, and survives Save', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // The four tabs, in order: Layout / Aisles / Reservations / Not for sale (each tab also carries a
    // number badge at desktop width, so match by substring).
    await expect(
      page.getByRole('tablist', { name: 'Seating steps' }).getByRole('tab')
    ).toHaveText([/Layout/, /Aisles/, /Reservations/, /Not for sale/]);

    await addHall(page, 10, 40); // 400 = capacity, so the final Save is allowed (Matches passes)
    // The map legend shows a Not for sale entry.
    await expect(page.getByTestId('map-legend')).toContainText('Not for sale');
    await selectStep(page, 'Not for sale');

    // Click a seat -> not for sale (grey/X).
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked');

    // Bulk Not for sale merges a range and clears the box (one-time entry), two-way synced with the map.
    await page.getByLabel('Bulk not for sale seats').fill('A4-A6');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByLabel('Bulk not for sale seats')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'blocked');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked'); // merge, not replace

    // Save is allowed (Matches passed with 400 seats even though some are not-for-sale), then reopen
    // -> the not-for-sale list round-trips through the builder (persists like the reserved list).
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await selectStep(page, 'Not for sale');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'blocked');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'blocked');
  });
});

test.describe('layout tools', () => {
  test('Skip rows leaves letters out of the row labels, and the row start rejects a skipped letter or a duplicate', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // Skip "I": 12 rows label A..H then J..M (no I).
    await page.getByLabel('Skip Rows').fill('I');
    await addHall(page, 12, 4);
    await expect(page.getByLabel('Row 8 label')).toHaveValue('H');
    await expect(page.getByLabel('Row 9 label')).toHaveValue('J');
    await expect(page.getByLabel('Row 12 label')).toHaveValue('M');

    // A never-reached entry ("AI" on a 12-row hall) has no effect and raises no error: I is NOT skipped.
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByLabel('Skip Rows').fill('AI');
    await addHall(page, 12, 4);
    await expect(page.getByLabel('Row 9 label')).toHaveValue('I');

    // On a fresh builder: row-start = "I" (a default-skipped letter) -> error + Add disabled.
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
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

  test('a horizontal flip reverses each row with the same seat ids, mirrors the aisle and keeps reserved and blocked seats', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await addHall(page, 1, 3); // A1, A2, A3

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

    // On a fresh builder: an aisle, a reserved and a blocked seat follow the flip.
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await addHall(page, 1, 5); // A1..A5

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

  test('a saved flip is still on when the builder is reopened', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await addHall(page, 10, 40); // 400 = capacity, so Save is allowed (exact match required)
    await page.getByTestId('flip-horizontal').click();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();

    await page.getByRole('button', { name: 'Seat Builder' }).click();
    await expect(page.getByTestId('flip-horizontal')).toHaveAttribute('aria-pressed', 'true');
    expect(await xOf(page, 'Seat A3')).toBeLessThan(await xOf(page, 'Seat A1'));
  });
});

test.describe('validation', () => {
  test('a duplicate or blank row label is flagged and blocks Save naming Layout', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10); // rows A, B
    await page.getByLabel('Row 2 label').fill('A'); // B -> A, a duplicate of row 1
    await expect(page.getByText('Row name already used')).toHaveCount(1); // only the edited (later) row
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Layout has errors.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible(); // not saved

    // On a fresh builder: a blank label shows the 1-3 letters error and blocks Save.
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    await page.getByLabel('Row 1 label').fill('');
    await expect(page.getByText(/1-3 letters/i)).toBeVisible();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Layout has errors.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
  });

  test('bulk reserve is all-or-nothing: one bad seat applies nothing and is named; fixing it applies all', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    await selectStep(page, 'Reservations');
    await page.getByLabel('Bulk reserve seats').fill('A1, Z9');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText(/Not in your hall: Z9/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'available'); // nothing applied
    // fix the bad token and re-apply -> all listed seats reserved at once
    await page.getByLabel('Bulk reserve seats').fill('A1, A2');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByLabel('Bulk reserve seats')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
  });

  test('errors in two tabs give one toast naming both, and fixing them lets Save succeed', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 10, 40); // 400 = capacity, so the fixed-up Save at the end is allowed
    // Reservations red: a bad bulk token.
    await selectStep(page, 'Reservations');
    await page.getByLabel('Bulk reserve seats').fill('Z9');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText(/Not in your hall: Z9/i)).toBeVisible();
    // Layout red: a blank row label (the row list counts as Layout).
    await page.getByLabel('Row 1 label').fill('');
    await expect(page.getByText(/1-3 letters/i)).toBeVisible();
    // Save blocked - ONE toast naming both tabs.
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Layout and Reservations have errors.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible(); // not saved
    // Fix both -> Save succeeds (overlay closes).
    await page.getByLabel('Row 1 label').fill('A');
    await page.getByLabel('Bulk reserve seats').fill('');
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
  });

  // An empty layout is a valid saved state, so Save on an empty hall exits the builder.
  test('an empty hall saves and exits the builder', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
  });

  test('fewer seats than the capacity blocks Save - seats must equal capacity exactly', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 5); // 5 of the 400-seat capacity
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/Under capacity by 395/i)).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
  });

  test('every seat cannot be reserved - at least one must stay sellable, by bulk or by click', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 3); // A1..A3
    await selectStep(page, 'Reservations');
    // Bulk: reserving all three is rejected, nothing applied.
    await page.getByLabel('Bulk reserve seats').fill('A1-A3');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(page.getByText(/At least one seat must stay unreserved/i)).toBeVisible();
    await expect(page.getByText('None yet.')).toBeVisible();
    // Click: two reserve fine; the third (last) click is blocked and stays available.
    await page.getByRole('button', { name: 'Seat A1', exact: true }).click();
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await page.getByRole('button', { name: 'Seat A3', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A3', exact: true })).toHaveAttribute('data-status', 'available');
  });

  test('Cancel closes straight away with no edits, and asks to discard when there are unsaved edits', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);

    // No edits -> closes with no prompt.
    await openBuilder(page);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await expect(page.getByText('Discard changes?')).toHaveCount(0);

    // An edit -> dirty: Keep editing stays, Discard closes.
    await openBuilder(page);
    await generate(page, 1, 5);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Discard changes?')).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByText('Discard changes?')).toHaveCount(0);
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
  });
});

test.describe('locking after sales', () => {
  test('an existing unsold event is fully editable and the calculator rebuilds its hall', async ({ page }) => {
    const seed = readSeed();
    // builderParityEvent has a layout (A,B) with an organiser-RESERVED seat but no SALE - not a lock reason.
    await gotoStep3(page, seed.builderParityEventId);
    await openBuilder(page);

    await expect(page.getByTestId('builder-locked')).toHaveCount(0); // not locked
    await expect(page.getByLabel('Number Of Rows')).toBeEnabled();    // calculator editable
    await expect(page.getByLabel('Row 1 label')).toBeEnabled();       // row list editable (no frozen rows)

    // The calculator works on an existing event: Clear the current hall, then Add a fresh one.
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByLabel('Number Of Rows').fill('3');
    await page.getByLabel('Seats Per Row').fill('6');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat C6', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat C7', exact: true })).toHaveCount(0);
  });

  test('once a seat sells the whole layout freezes and only reserving a free seat stays live', async ({ page }) => {
    await gotoStep3(page, readSeed().builderSoldEventId); // row A has a sold seat A-3
    await page.getByRole('button', { name: 'Seat Builder' }).click();
    const overlay = page.getByTestId('seat-builder-overlay');
    await expect(overlay).toBeVisible({ timeout: 15_000 });

    // The sold seat is frozen and the "some seats sold" notice shows.
    await expect(page.getByTestId('builder-locked')).toBeVisible();
    await expect(overlay.getByRole('button', { name: 'Seat A3', exact: true })).toBeDisabled();

    // The whole layout is frozen - bulk tool off, every row's label + count locked.
    await expect(overlay.getByLabel('Number Of Rows')).toBeDisabled();
    await expect(overlay.getByLabel('Row 1 label')).toBeDisabled();
    await expect(overlay.getByLabel('Row 2 label')).toBeDisabled();
    await expect(overlay.getByLabel('Row 2 seat count')).toBeDisabled();

    // The one live action: reserve a still-free seat. Switch to the Reservations tab and click one.
    await overlay.getByRole('tab', { name: /Reservations/i }).click();
    const freeSeat = overlay.getByRole('button', { name: 'Seat B1', exact: true });
    await expect(freeSeat).toBeEnabled();
    await freeSeat.click();
    await expect(freeSeat).toHaveAttribute('data-status', 'reserved');
  });
});

test.describe('on a phone', () => {
  test('each tab\'s tool opens as a bottom sheet that Done dismisses, and the map still edits with it closed', async ({ page }) => {
    const seed = readSeed();
    await page.setViewportSize({ width: 390, height: 800 });
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    // Not shown inline; opens on a tab tap; Done dismisses it.
    const sheet = page.getByTestId('tool-panel');
    await expect(sheet).toHaveAttribute('data-open', 'false');
    await expect(sheet).toBeHidden();

    await page.getByRole('tab', { name: 'Aisles' }).click();
    await expect(sheet).toHaveAttribute('data-open', 'true');
    await expect(sheet).toBeVisible();
    await expect(page.getByLabel('Aisle seat number')).toBeVisible(); // the Aisles tool content

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(sheet).toHaveAttribute('data-open', 'false');
    await expect(sheet).toBeHidden();

    // With the sheet dismissed, map editing still works (a seat reserve on the Reservations tab).
    await generate(page, 2, 6);
    await page.getByRole('tab', { name: 'Reservations' }).click();
    await page.getByRole('button', { name: 'Done' }).click(); // dismiss to tap the map
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByTestId('tool-panel')).toHaveAttribute('data-open', 'true'); // reserving pops the sheet open
  });
});

test('the Seating Configuration card summarises the layout with a mini preview, and only its Seat Builder button opens the builder', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/edit/${seed.builderParityEventId}`); // A,B x 8 seats = 16 seats, 2 rows, A3 reserved
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('seating-card')).toBeVisible({ timeout: 20_000 });
  const card = page.getByTestId('seating-card');

  await expect(card).toContainText('16 seats');
  await expect(card).toContainText('2 rows');
  await expect(card).toContainText('Reserved');
  await expect(card).toContainText('A3');
  await expect(card.getByTestId('mini-seat-row')).toHaveCount(2); // mini preview has M=2 rows

  // No capacity badge of any kind.
  await expect(card).not.toContainText('Matches capacity');
  await expect(card).not.toContainText(/over capacity|short/i);

  // Clicking the (non-interactive) mini preview opens nothing.
  await card.getByTestId('mini-seat-preview').click();
  await expect(page.getByTestId('seat-builder-overlay')).toHaveCount(0);

  // The Seat Builder button opens the overlay.
  await page.getByRole('button', { name: 'Seat Builder' }).click();
  await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 15_000 });
});
