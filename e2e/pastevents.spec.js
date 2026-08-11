// events-past-events.md - the public "Past events" section on /events (AC1) and that an organiser's
// soft-deleted past event still shows there but is gone from their manage list (AC4). The seeded
// "E2E Past Ended Fest" is a past-dated event the organiser soft-deleted.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test('AC1 /events shows a Past events section below the upcoming grid with Ended cards, and it scrolls', async ({ page }) => {
  await page.goto('/events');

  const section = page.getByTestId('past-events');
  await expect(section).toBeVisible({ timeout: 20_000 });
  await expect(section.getByRole('heading', { name: 'Past events' })).toBeVisible();
  await expect(section.getByText('E2E Past Ended Fest')).toBeVisible();
  await expect(section.getByText('Ended').first()).toBeVisible();
  // Admin curation: a past event that is NOT featured does not appear.
  await expect(section.getByText('E2E Past Unfeatured Fest')).toHaveCount(0);

  // The strip is a horizontally scrollable container (overflow-x-auto).
  const scroll = page.getByTestId('past-events-scroll');
  await expect(scroll).toBeVisible();
  const overflowX = await scroll.evaluate((el) => getComputedStyle(el).overflowX);
  expect(['auto', 'scroll']).toContain(overflowX);

  // It sits BELOW the upcoming grid.
  const gridBox = await page.locator('#EventGrid').boundingBox();
  const sectionBox = await section.boundingBox();
  expect(sectionBox.y).toBeGreaterThan(gridBox.y);
});

test.describe('AC4 organiser view', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  const API = 'http://localhost:5100/api';
  const KEY = { 'x-api-key': 'test-api-key' };

  test('AC4 a soft-deleted past event still shows in Past events (card + image) but not in the organiser manage list', async ({ page }) => {
    // Public Past section shows the deleted past event, with a card image.
    await page.goto('/events');
    const section = page.getByTestId('past-events');
    await expect(section.getByText('E2E Past Ended Fest')).toBeVisible({ timeout: 20_000 });
    await expect(section.locator('img').first()).toBeVisible();

    // The organiser's manage list (/events/mine, the manage-events page's source) excludes it.
    const res = await page.request.get(`${API}/events/mine`, { headers: KEY });
    expect(res.ok()).toBeTruthy();
    const mine = await res.json();
    const titles = (Array.isArray(mine) ? mine : []).map((e) => e.title);
    expect(titles.length).toBeGreaterThan(0); // the organiser owns other events (list loaded)
    expect(titles).not.toContain('E2E Past Ended Fest');
  });
});
