// Seat builder - see featureplans/events-seatbuilder-redesign.md and events-seatbuilder-tabs.md.
// The builder is reached by EDITING a seeded event as the owning organiser (editing bypasses the
// Stripe gate + Google Places). Sidebar steps: 1 Layout, 2 Aisles, 3 Reservations. The Layout calculator
// creates rows with the "Add" button (Rows/Seats start empty); canvas edits are gated to their tab.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';
import { nextRowLabel } from '../utils/events/seatBuilder.js';

test('AC3 (unit) row-label increment: A->B, Z->AA, AA->AB, AZ->BA; custom label falls back to next free letter', () => {
  expect(nextRowLabel('A')).toBe('B');
  expect(nextRowLabel('Y')).toBe('Z');
  expect(nextRowLabel('Z')).toBe('AA');
  expect(nextRowLabel('AA')).toBe('AB');
  expect(nextRowLabel('AZ')).toBe('BA');
  expect(nextRowLabel('VIP', ['VIP'])).toBe('A');
  expect(nextRowLabel('VIP', ['A', 'B', 'VIP'])).toBe('C');
});

test.describe('seat builder overlay (organiser edit)', () => {
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
  // Sidebar layout: only the active step's tool is on screen, and canvas edits are gated to their tab.
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
  // A seam click on the map now STAGES the spot (fills Row + Seat); the panel Add/Clear button then acts.
  // These helpers do both, mirroring how an organiser places or removes one row's aisle via the map.
  const placeAisleViaMap = async (page, row, seat) => {
    await page.getByRole('button', { name: `Add walkway after seat ${seat} in row ${row}` }).click(); // stage
    await page.getByTestId('tool-panel').getByRole('button', { name: 'Add', exact: true }).click();   // place
  };
  const clearAisleViaMap = async (page, row, seat) => {
    await page.getByRole('button', { name: `Remove walkway after seat ${seat} in row ${row}` }).click(); // stage
    await page.getByTestId('tool-panel').getByRole('button', { name: 'Clear', exact: true }).click();     // remove
  };

  test('AC1 overlay preserves wizard state on Save AND Cancel; no route change', async ({ page }) => {
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

  test('AC2 the calculator Add builds one aligned canvas with the stage bar; capacity matches at 400', async ({ page }) => {
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

  test('AC4 Add Single Row mimics the previous row (seat count + walkways) with the next label', async ({ page }) => {
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

  test('AC5 aisle apply-to-all cuts a straight lane in every row; lane/seam toggles are per-row', async ({ page }) => {
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

  test('AC6 walkway lanes are amber and dimensionally distinct from seat dots', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 10);
    await selectStep(page, 'Aisles');
    await placeAisleViaMap(page, 'A', 5);
    const lane = page.locator('[data-walkway="true"]').first();
    await expect(lane).toHaveClass(/amber/);
    const laneBox = await lane.boundingBox();
    const seatBox = await page.getByRole('button', { name: 'Seat A1', exact: true }).boundingBox();
    expect(laneBox.width).toBeLessThan(seatBox.width); // thin lane, not a seat-shaped square
  });

  test('AC7 seat numbers are hidden at fitted zoom and appear after zooming in', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 5);
    const seat = page.getByRole('button', { name: 'Seat A1', exact: true });
    await expect(seat).toHaveText(''); // fitted: clean dot (icon only; the number is not in the button)
    for (let i = 0; i < 3; i++) await page.getByLabel('Zoom in').click(); // past the number threshold (0.3 steps)
    await expect(seat).toHaveText('1'); // zoomed in: the number shows
  });

  test('AC8 (tabs) clicking a seat and Bulk Reserve both feed the reserved list; it merges and persists', async ({ page }) => {
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

  // SUPERSEDED by featureplans/fix-events-seatmap-salelock.md: after a sale it is all-or-nothing, not a
  // partial freeze - the WHOLE builder is read-only (no seam or reserve edits), with a plain lock message.
  test('AC9 a sold event locks the whole builder read-only (label/count/seam/reserve); the booked seat is unclickable', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderSoldEventId);
    await openBuilder(page);
    await expect(page.getByTestId('builder-locked')).toBeVisible();
    await expect(page.getByLabel('Row 1 label')).toBeDisabled();
    await expect(page.getByLabel('Row 1 seat count')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Add walkway after seat 5 in row A' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Seat A3', exact: true })).toBeDisabled(); // sold seat
  });

  // --- Seat-map polish punch-list (see featureplans/fix-events-seatmap-polish.md), builder surface ---
  test('P-AC6/P-AC8 (builder) uniform seats, aisled + gapless rows share one centreline, stage centred on it', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
    await selectStep(page, 'Aisles');
    // Row A gets an aisle (wider); row B stays gapless (narrower) - both must share the centreline.
    await placeAisleViaMap(page, 'A', 5);
    const rowMetrics = async (first, last) => {
      const a = await page.getByRole('button', { name: first, exact: true }).boundingBox();
      const b = await page.getByRole('button', { name: last, exact: true }).boundingBox();
      return { centre: (a.x + b.x + b.width) / 2, size: a.width };
    };
    const rowA = await rowMetrics('Seat A1', 'Seat A20'); // aisled
    const rowB = await rowMetrics('Seat B1', 'Seat B20'); // gapless
    const stage = await page.getByTestId('stage-bar').boundingBox();
    const stageCentre = stage.x + stage.width / 2;
    expect(Math.abs(rowA.centre - rowB.centre)).toBeLessThan(4);
    expect(Math.abs(stageCentre - rowA.centre)).toBeLessThan(4);
    expect(Math.abs(rowA.size - rowB.size)).toBeLessThan(1);
  });

  test('P-AC9 (item 9) the stage bar sits at the top of the map, not floating mid-screen', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 3, 10);
    const map = await page.getByTestId('builder-map').boundingBox();
    const stage = await page.getByTestId('stage-bar').boundingBox();
    expect(stage.y - map.y).toBeLessThan(map.height * 0.35); // near the top of the map (legend above), not centred
  });

  test('P-AC10 (item 10) the Layout tool shows visible Number Of Rows / Seats Per Row labels', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page); // Layout step active by default
    const panel = page.getByTestId('tool-panel');
    await expect(panel).toContainText('Number Of Rows');
    await expect(panel).toContainText('Seats Per Row');
  });

  test('P-AC11 (item 11) the Add Single Row button exists (no Generate)', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 5); // Add Single Row appears once rows exist
    await expect(page.getByTestId('tool-panel').getByRole('button', { name: 'Add Single Row' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate', exact: true })).toHaveCount(0);
  });

  test('P-AC12 (item 12) the seat-count field types freely, clears to empty, applies on blur without snapping', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
    const count = page.getByLabel('Row 1 seat count');
    await count.fill('');
    await expect(count).toHaveValue('');
    await count.fill('7');
    await expect(count).toHaveValue('7');
    await count.blur();
    await expect(page.getByRole('button', { name: 'Seat A7', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Seat A8', exact: true })).toHaveCount(0);
    await count.fill('');
    await count.blur();
    await expect(count).toHaveValue('7');
  });

  test('P-AC13 (item 13) exceeding capacity shows an explicit over-capacity message', async ({ page }) => {
    const seed = readSeed();                     // builderEmptyEvent capacity is 400
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 11, 40);                // 440 seats > 400 capacity
    await expect(page.getByTestId('capacity-error')).toBeVisible();
    await expect(page.getByTestId('capacity-error')).toContainText('Over capacity by 40');
  });

  test('P-AC14 (item 14) the aisle input clears itself after Apply to all rows', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
    await selectStep(page, 'Aisles');
    await page.getByLabel('Aisle seat number').fill('13');
    await page.getByRole('button', { name: 'Apply to all rows' }).click();
    await expect(page.getByLabel('Aisle seat number')).toHaveValue('');
  });

  test('P-AC15 (item 15) the legend lives inside the map, trimmed to Available / Reserved / Aisle', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 6); // the legend lives in the map, which appears once the hall has rows
    const legend = page.getByTestId('builder-canvas').getByTestId('map-legend');
    await expect(legend).toBeVisible();
    await expect(legend).toContainText('Available');
    await expect(legend).toContainText('Reserved');
    await expect(legend).toContainText('Aisle');
    const overlay = page.getByTestId('seat-builder-overlay');
    await expect(overlay.getByText('Sold', { exact: true })).toHaveCount(0);
    await expect(overlay.getByText('Hold', { exact: true })).toHaveCount(0);
    await expect(overlay.getByText('Selected', { exact: true })).toHaveCount(0);
  });

  test('P-AC16/P-AC17 (items 16, 17) each tool panel carries its own contextual how-to', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    const panel = page.getByTestId('tool-panel');
    await selectStep(page, 'Reservations');
    await expect(panel).toContainText(/click an available seat to reserve/i);
    await selectStep(page, 'Aisles');
    // The aisle how-to is now on demand behind the (i), keeping the sheet compact.
    await panel.getByRole('button', { name: 'How aisles work' }).click();
    await expect(panel).toContainText(/Tap between two seats on the map to add or remove a single aisle/i);
  });

  test('P-AC18 (item 18) each tool panel carries its own contextual how-to; the legend lives inside the map', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 6); // the legend lives in the map, which appears once the hall has rows
    const panel = page.getByTestId('tool-panel');
    await selectStep(page, 'Aisles');
    await panel.getByRole('button', { name: 'How aisles work' }).click();
    await expect(panel).toContainText(/Tap between two seats on the map to add or remove a single aisle/i);
    await selectStep(page, 'Reservations');
    await expect(panel).toContainText(/reserve it \(turns purple\)/i);
    await expect(page.getByTestId('builder-canvas').getByTestId('map-legend')).toBeVisible();
  });

  test('P-AC19 (items 19, tabs) sidebar with 3 steps + row list; one tool in focus at a time', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
    const sidebar = page.getByTestId('builder-sidebar');
    await expect(sidebar.getByRole('tab', { name: 'Layout' })).toBeVisible();
    await expect(sidebar.getByRole('tab', { name: 'Aisles' })).toBeVisible();
    await expect(sidebar.getByRole('tab', { name: 'Reservations' })).toBeVisible();
    await expect(page.getByTestId('rows-panel')).toBeVisible(); // now its own cell, no longer nested in the sidebar
    // one tool at a time: Layout shows the Seats-per-row input, not the Aisle input; swapping flips it.
    await expect(page.getByLabel('Seats Per Row')).toBeVisible();
    await expect(page.getByLabel('Aisle seat number')).toHaveCount(0);
    await selectStep(page, 'Aisles');
    await expect(page.getByLabel('Aisle seat number')).toBeVisible();
    await expect(page.getByLabel('Seats Per Row')).toHaveCount(0);
  });

  test('AC12 (mobile) overlay opens; add, reserve-click and zoom all work at a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 6);
    await expect(page.getByTestId('seat-builder-overlay').getByRole('button', { name: /^Seat / })).toHaveCount(12);
    await selectStep(page, 'Reservations');
    await page.getByRole('button', { name: 'Done' }).click(); // dismiss the tool sheet to tap the map
    await page.getByRole('button', { name: 'Seat A1', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'reserved');
    await page.getByRole('button', { name: 'Done' }).click(); // reserving pops the sheet; dismiss to reach the map/zoom
    await page.getByLabel('Zoom in').click(); // zoom control reachable/functional
  });

  // --- Validation (see featureplans/events-seatbuilder-validation.md) ---
  test('V-AC1 renaming a row to a duplicate flags the edited row only; Save is blocked naming Layout', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10); // rows A, B
    await page.getByLabel('Row 2 label').fill('A'); // B -> A, a duplicate of row 1
    await expect(page.getByText('Row name already used')).toHaveCount(1); // only the edited (later) row
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Layout has errors.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible(); // not saved
  });

  test('V-AC2 clearing a row label to blank shows the 1-3 letters error and blocks Save', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    await page.getByLabel('Row 1 label').fill('');
    await expect(page.getByText(/1-3 letters/i)).toBeVisible();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Layout has errors.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
  });

  test('A-AC1 the Row+Seat button toggles one row: Add when clear, Clear when that row+seat has a lane', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
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
  });

  test('A-AC2 the Row+Seat control validates against the built layout (unknown row / seat past the row)', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20); // rows A and B, 20 seats each
    await selectStep(page, 'Aisles');
    const panel = page.getByTestId('tool-panel');
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

  test('V-AC3 an aisle-after-seat past the end of every row shows the red error', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    await selectStep(page, 'Aisles');
    await page.getByLabel('Aisle seat number').fill('15'); // both rows have only 10 seats
    await expect(page.getByText(/No row has a seat after 15/i)).toBeVisible();
  });

  test('V-AC4 bulk reserve is all-or-nothing: one bad token applies nothing and names it; fixing applies all', async ({ page }) => {
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

  test('V-AC5 shrinking a row silently drops an out-of-range aisle and reserved seat', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 10);
    await selectStep(page, 'Aisles');
    await placeAisleViaMap(page, 'A', 8);
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(1);
    await selectStep(page, 'Reservations');
    await page.getByRole('button', { name: 'Seat A9', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A9', exact: true })).toHaveAttribute('data-status', 'reserved');
    // Shrink row A to 5 (the row list lives in the sidebar, visible on any tab).
    const count = page.getByLabel('Row 1 seat count');
    await count.fill('5');
    await count.blur();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(0);                    // aisle silently dropped
    await expect(page.getByRole('button', { name: 'Seat A9', exact: true })).toHaveCount(0); // seat gone
    await expect(page.getByText('None yet.')).toBeVisible();                                 // reserved A9 removed
  });

  test('V-AC6 red fields in two tabs give one toast naming both; fixing them lets Save succeed', async ({ page }) => {
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

  test('V-AC7 an empty hall blocks Save with a plain message', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Add at least one row to save.')).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
  });

  test('V-AC8 under capacity blocks Save - configured seats must equal capacity exactly', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 5); // 5 of the 400-seat capacity
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/Under capacity by 395/i)).toBeVisible();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
  });

  test('V-AC9 you cannot reserve every seat - at least one must stay sellable (bulk and click)', async ({ page }) => {
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

  test('V-AC10 Cancel with unsaved edits prompts to discard; Keep editing stays, Discard closes', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 5); // an edit -> dirty
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Discard changes?')).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByText('Discard changes?')).toHaveCount(0);
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible();
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
  });

  test('V-AC11 Cancel with no edits closes straight away (no prompt)', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await expect(page.getByText('Discard changes?')).toHaveCount(0);
  });

  test('V-AC12 an empty hall shows the three-tab guide instead of a blank map', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    const guide = page.getByTestId('builder-empty');
    await expect(guide).toBeVisible();
    await expect(guide).toContainText('Build your seating layout');
    await expect(guide).toContainText('Layout');
    await expect(guide).toContainText('Aisles');
    await expect(guide).toContainText('Reservations');
    await generate(page, 1, 5); // rows exist -> the guide gives way to the map
    await expect(page.getByTestId('builder-empty')).toHaveCount(0);
    await expect(page.getByTestId('stage-bar')).toBeVisible();
  });

  // --- Zoom parity (builder side) - see featureplans/events-seatmap-zoom-parity.md ---
  const builderScale = async (page) => parseFloat(await page.getByTestId('builder-map').getAttribute('data-scale'));

  test('Z-AC3 (builder) the +/- buttons change scale by 0.3', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 20);
    const a = await builderScale(page);
    await page.getByLabel('Zoom in').click();
    expect((await builderScale(page)) - a).toBeCloseTo(0.3, 1);
    await page.getByLabel('Zoom out').click();
    expect(await builderScale(page)).toBeCloseTo(a, 1);
  });

  test('Z-AC5 (builder) Fit lands the whole hall fitted and centred - no reset-to-100% at the origin', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 80); // wide hall -> the fitted scale is width-bound (< 1)
    const fit = await builderScale(page);
    expect(fit).toBeLessThan(0.95); // fitted below 1 on open (not the old reset-to-1)
    // zoom in and pan away
    for (let i = 0; i < 3; i++) await page.getByLabel('Zoom in').click();
    const m0 = await page.getByTestId('builder-map').boundingBox();
    await page.mouse.move(m0.x + m0.width / 2, m0.y + m0.height / 2);
    await page.mouse.down();
    await page.mouse.move(m0.x + 40, m0.y + 40, { steps: 6 });
    await page.mouse.up();
    // Fit -> back to the fitted scale (NOT 1), stage top-aligned and centred
    await page.getByLabel('Fit').click();
    expect(await builderScale(page)).toBeCloseTo(fit, 2);
    const map = await page.getByTestId('builder-map').boundingBox();
    const stage = await page.getByTestId('stage-bar').boundingBox();
    expect(stage.y - map.y).toBeLessThan(map.height * 0.35); // top-aligned, not centred mid-screen
    expect(Math.abs((stage.x + stage.width / 2) - (map.x + map.width / 2))).toBeLessThan(map.width * 0.06); // ~centred
  });

  test('Z-AC6 (builder) hovering a seat shows the shared card; the zoomed-in numbers still appear', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    const seat = page.getByRole('button', { name: 'Seat A2', exact: true });
    await seat.hover();
    const card = seat.locator('xpath=..').getByTestId('seat-hover-card');
    await expect(card).toContainText('Row');
    await expect(card).toContainText('Seat');
    await expect(card).toContainText('2');
    await expect(card).not.toContainText('Available'); // no status word - Row + Seat only
    expect(await card.innerText()).not.toContain('$');
    // the builder's always-numbers-when-zoomed feature is unchanged (card replaces hover only)
    for (let i = 0; i < 3; i++) await page.getByLabel('Zoom in').click();
    await expect(seat).toHaveText('2');
  });
});

test.describe('builder-attendee parity (attendee view)', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('AC10 the attendee seats page shows the same amber aisles and purple reserved seats', async ({ page }) => {
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
