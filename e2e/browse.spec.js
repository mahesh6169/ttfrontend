import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test('events landing shows the seeded event and opens its detail', async ({ page }) => {
  const seed = readSeed();
  await page.goto('/events');
  const card = page.getByText('E2E Free Fest', { exact: false }).first();
  await expect(card).toBeVisible({ timeout: 20_000 });
  await card.click();
  await expect(page).toHaveURL(/\/events\//);
  await expect(page.getByText('E2E Free Fest').first()).toBeVisible({ timeout: 15_000 });
});
