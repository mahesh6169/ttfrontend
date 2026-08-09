// Public "events by one organiser" page - see featureplans/events-by-organiser.md.
// Runs LOGGED OUT (the page is public - attendees scan a QR without an account). Titles carry the AC.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test('AC5 the organiser page loads publicly with the heading and the events grid, no filters', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);

  await expect(page.getByRole('heading', { name: `Events by ${seed.orgPageName}` })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Org Page Free Fest')).toBeVisible();
  await expect(page.getByText('Org Page Paid Fest')).toBeVisible();
  // No filter section on this page.
  await expect(page.getByRole('button', { name: 'Filter' })).toHaveCount(0);
});

test('Back from an event returns to the organiser page it was opened from (not /events)', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);
  await expect(page.getByText('Org Page Free Fest')).toBeVisible({ timeout: 20_000 });

  // Open the event, then use the detail page's Back control.
  await page.getByText('Org Page Free Fest').click();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Back' }).click();

  // Lands back on the organiser page, not the generic /events grid.
  await expect(page).toHaveURL(new RegExp(`/events/by/${seed.orgPageSlug}`));
});

test('AC6 an empty organiser shows "no upcoming events"; an unknown slug shows "organiser not found"', async ({ page }) => {
  const seed = readSeed();

  await page.goto(`/events/by/${seed.orgEmptySlug}`);
  await expect(page.getByRole('heading', { name: 'No upcoming events' })).toBeVisible({ timeout: 20_000 });

  await page.goto('/events/by/no-such-organiser-xyz');
  await expect(page.getByRole('heading', { name: 'Organiser not found' })).toBeVisible({ timeout: 20_000 });
});
