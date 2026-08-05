// Acceptance suite for featureplans/events-seating-card.md — the wizard's Seating Configuration card:
// a display-only panel with a "Seat Builder" button, no capacity badge, and a read-only mini seat
// preview (faint placeholder when empty). The SeatBuilderOverlay and all seat/capacity logic are
// unchanged. Reached by editing a seeded paid event as the owning organiser (step 3 = Registration).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

const gotoStep3 = async (page, eventId) => {
  await page.goto(`/events/edit/${eventId}`);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByTestId('seating-card')).toBeVisible({ timeout: 20_000 });
};

// AC1 — a configured layout shows "N seats - M rows", the Reserved line, a mini preview with M rows,
// and NO capacity badge.
test('AC1 configured card: summary, reserved line, mini preview with M rows, no capacity badge', async ({ page }) => {
  const seed = readSeed();
  await gotoStep3(page, seed.builderParityEventId); // A,B x 8 seats = 16 seats, 2 rows, A3 reserved
  const card = page.getByTestId('seating-card');

  await expect(card).toContainText('16 seats');
  await expect(card).toContainText('2 rows');
  await expect(card).toContainText('Reserved');
  await expect(card).toContainText('A3');
  await expect(card.getByTestId('mini-seat-row')).toHaveCount(2); // mini preview has M=2 rows

  // No capacity badge of any kind.
  await expect(card).not.toContainText('Matches capacity');
  await expect(card).not.toContainText(/over capacity|short/i);
});

// AC2 — no seating configured shows the "no seating" text and the faint placeholder preview.
test('AC2 empty card: no-seating text + faint placeholder preview', async ({ page }) => {
  const seed = readSeed();
  await gotoStep3(page, seed.builderEmptyEventId); // no seatingLayout
  const card = page.getByTestId('seating-card');

  await expect(card).toContainText('No seating configured yet');
  await expect(card.getByTestId('mini-seat-preview')).toBeVisible();
  await expect(card).not.toContainText('Reserved');
});

// AC3 — only the Seat Builder button opens the overlay; clicking elsewhere on the card does nothing.
test('AC3 only the Seat Builder button opens the overlay', async ({ page }) => {
  const seed = readSeed();
  await gotoStep3(page, seed.builderParityEventId);
  const card = page.getByTestId('seating-card');

  // Clicking the (non-interactive) mini preview opens nothing.
  await card.getByTestId('mini-seat-preview').click();
  await expect(page.getByTestId('seat-builder-overlay')).toHaveCount(0);

  // The Seat Builder button opens the overlay.
  await page.getByRole('button', { name: 'Seat Builder' }).click();
  await expect(page.getByTestId('seat-builder-overlay')).toBeVisible({ timeout: 15_000 });
});

// AC4 — at 360px the card is compact with no horizontal scroll.
test('AC4 360px: compact card, no horizontal scroll', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 360, height: 780 });
  await gotoStep3(page, seed.builderParityEventId);

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
