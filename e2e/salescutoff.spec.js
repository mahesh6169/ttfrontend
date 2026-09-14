// featureplans/fix-events-sales-cutoff.md
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// Member is logged in for the tickets-page tests.
test.use({ storageState: 'e2e/.auth/member.json' });

// AC8: event detail page shows Sales Closed (closed event) vs Purchase Tickets (open event).
test('AC8 - sales-closed event detail shows greyed Sales Closed button and dimmed ticket list', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/events/views/${seed.salesCutoffEventId}`);
  await page.waitForLoadState('networkidle');

  // The "Sales Closed" button must be visible and disabled.
  const salesClosedBtn = page.getByRole('button', { name: 'Sales Closed' });
  await expect(salesClosedBtn).toBeVisible({ timeout: 15_000 });
  await expect(salesClosedBtn).toBeDisabled();

  // The "Purchase Tickets" active button must NOT be visible.
  await expect(page.getByRole('button', { name: 'Purchase Tickets' })).not.toBeVisible();

  // The ticket list container must have the dim class (opacity-50).
  const ticketList = page.locator('.divide-y.divide-slate-100');
  await expect(ticketList.first()).toHaveClass(/opacity-50/);
});

test('AC8b - open paid event detail shows active Purchase Tickets button', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/events/views/${seed.paidEventId}`);
  await page.waitForLoadState('networkidle');

  // The active "Purchase Tickets" button must be visible.
  const purchaseBtn = page.getByRole('button', { name: 'Purchase Tickets' });
  await expect(purchaseBtn).toBeVisible({ timeout: 15_000 });
  await expect(purchaseBtn).not.toBeDisabled();

  // The "Sales Closed" button must NOT be visible.
  await expect(page.getByRole('button', { name: 'Sales Closed' })).not.toBeVisible();
});

// AC9: tickets page for a sales-closed event shows the closed message and a disabled proceed.
test('AC9 - tickets page for a sales-closed event shows closed message and disabled proceed', async ({ page }) => {
  const seed = readSeed();

  // Deep-link directly to the tickets page for the closed event.
  await page.goto(`/events/tickets/${seed.salesCutoffEventId}`);
  await page.waitForLoadState('networkidle');

  // The "Ticket sales for this event have closed." message must appear (appears in the ticket
  // area and the sticky bar; either one is sufficient - check the first).
  await expect(page.getByText('Ticket sales for this event have closed.').first()).toBeVisible({ timeout: 15_000 });

  // The sticky bar must be visible with the closed label.
  const ctaBar = page.locator('[data-testid="tickets-cta-bar"]');
  await expect(ctaBar).toBeVisible({ timeout: 10_000 });

  // The proceed button must read "Sales Closed" and be disabled.
  const proceedBtn = page.locator('[data-testid="tickets-proceed"]');
  await expect(proceedBtn).toBeVisible();
  await expect(proceedBtn).toBeDisabled();
  await expect(proceedBtn).toHaveText(/Sales Closed/);
});
