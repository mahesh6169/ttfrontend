// Seat builder redesign - see featureplans/events-seatbuilder-redesign.md.
// The builder is reached by EDITING a seeded event as the owning organiser (editing bypasses the
// Stripe gate + Google Places). The empty-layout event has no frozen rows, so all tools are enabled.
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

  // Edit the event and advance to step 3 (Registration), where the seating section lives.
  const gotoStep3 = async (page, eventId) => {
    await page.goto(`/events/edit/${eventId}`);
    await page.getByRole('button', { name: 'Next →' }).click();
    await page.getByRole('button', { name: 'Next →' }).click();
    await expect(page.getByRole('button', { name: /Configure Seating|Open seat builder/ })).toBeVisible({ timeout: 20_000 });
  };
  const openBuilder = async (page) => {
    await page.getByRole('button', { name: /Configure Seating|Open seat builder/ }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 15_000 });
  };

  test('AC1 overlay preserves wizard state on Save AND Cancel; no route change', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    const url = page.url();
    const limit = page.getByPlaceholder('Max per order');
    await limit.fill('7');

    await openBuilder(page);
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

  test('AC2 generate renders one aligned canvas with the stage bar; capacity matches at 400', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);

    await page.getByLabel('Rows').fill('10');
    await page.getByLabel('Seats per row').fill('40');
    await page.getByRole('button', { name: 'Generate' }).click();

    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toBeVisible();
    await expect(page.getByTestId('stage-bar')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Seat / })).toHaveCount(400);
    await expect(page.getByText('Matches')).toBeVisible();
  });

  const generate = async (page, rows, seats) => {
    await page.getByLabel('Rows').fill(String(rows));
    await page.getByLabel('Seats per row').fill(String(seats));
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toBeVisible();
  };

  test('AC4 Add row mimics the previous row (seat count + walkways) with the next label', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 12);
    await page.getByRole('button', { name: 'Add walkway after seat 4 in row A' }).click();
    await page.getByRole('button', { name: '+ Add row' }).click();
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
    await page.getByLabel('Aisle seat number').fill('13');
    await page.getByRole('button', { name: 'Apply to all rows' }).click();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(3); // one per row, same position
    for (const r of ['A', 'B', 'C']) {
      await expect(page.getByRole('button', { name: `Remove walkway after seat 13 in row ${r}` })).toBeVisible();
    }
    // Clicking one row's amber lane removes only that row's gap.
    await page.getByRole('button', { name: 'Remove walkway after seat 13 in row A' }).click();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(2);
    // A seam click adds a single gap back.
    await page.getByRole('button', { name: 'Add walkway after seat 5 in row A' }).click();
    await expect(page.locator('[data-walkway="true"]')).toHaveCount(3);
  });

  test('AC6 walkway lanes are amber and dimensionally distinct from seat dots', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 1, 10);
    await page.getByRole('button', { name: 'Add walkway after seat 5 in row A' }).click();
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
    await expect(seat).toHaveText(''); // fitted: clean dot (icon only, no number)
    for (let i = 0; i < 5; i++) await page.getByLabel('Zoom in').click();
    await expect(seat).toHaveText('1');
  });

  test('AC8 click-to-reserve syncs with the typed box both ways and persists on save', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 10);
    // Click a seat -> purple + box shows it.
    await page.getByRole('button', { name: 'Seat A2', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByLabel('Reserved seats')).toHaveValue('A2');
    // Type a range -> those seats go purple; the old one clears.
    await page.getByLabel('Reserved seats').fill('A4-A6');
    await expect(page.getByRole('button', { name: 'Seat A5', exact: true })).toHaveAttribute('data-status', 'reserved');
    await expect(page.getByRole('button', { name: 'Seat A2', exact: true })).toHaveAttribute('data-status', 'available');
    // Save then reopen -> the reserved list persisted.
    await page.getByTestId('seat-builder-overlay').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByTestId('seat-builder-overlay')).toBeHidden();
    await page.getByRole('button', { name: /Open seat builder/ }).click();
    await expect(page.getByLabel('Reserved seats')).toHaveValue('A4-A6');
  });

  test('AC9 frozen rows lock label/count but allow seam + reserve; a booked seat is unclickable', async ({ page }) => {
    const seed = readSeed();
    await gotoStep3(page, seed.builderSoldEventId);
    await openBuilder(page);
    // Frozen row A: label + count controls disabled.
    await expect(page.getByLabel('Row 1 label')).toBeDisabled();
    await expect(page.getByLabel('Row 1 seat count')).toBeDisabled();
    // Seam toggle still works on the frozen row.
    await page.getByRole('button', { name: 'Add walkway after seat 5 in row A' }).click();
    await expect(page.getByRole('button', { name: 'Remove walkway after seat 5 in row A' })).toBeVisible();
    // Reserve click works on an available seat in the frozen row.
    await page.getByRole('button', { name: 'Seat A1', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'reserved');
    // The sold seat (A3) is unclickable.
    await expect(page.getByRole('button', { name: 'Seat A3', exact: true })).toBeDisabled();
  });

  test('AC12 (mobile) overlay opens; generate, reserve-click and zoom all work at a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const seed = readSeed();
    await gotoStep3(page, seed.builderEmptyEventId);
    await openBuilder(page);
    await generate(page, 2, 6);
    await expect(page.getByRole('button', { name: /^Seat / })).toHaveCount(12);
    await page.getByRole('button', { name: 'Seat A1', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Seat A1', exact: true })).toHaveAttribute('data-status', 'reserved');
    await page.getByLabel('Zoom in').click(); // zoom control reachable/functional
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

    // Same aisles: a walkway spacer renders in the row.
    await expect(page.locator('[data-walkway="true"]').first()).toBeAttached({ timeout: 20_000 });
    // Same purple reserved seat: A3 renders as organiser-reserved and is not selectable.
    const reserved = page.getByRole('button', { name: /^A3 - Reserved by organizer/ });
    await expect(reserved).toBeVisible();
    await expect(reserved).toHaveClass(/purple/);
  });
});
