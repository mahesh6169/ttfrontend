// Admin moderation of events.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };

test.describe('admin moderation', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('Moderation Hide on the renewals page hides a live event from search and its page, and the purge queue lists it', async ({ page }) => {
    const seed = readSeed();

    await page.goto('/admin/profile/events/renewals');
    const row = page.locator('tr', { hasText: 'E2E Renewals Moderation Fest' });
    await expect(row).toBeVisible({ timeout: 20_000 });

    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Moderation Hide' }).click();
    await expect(row.getByText('Blocked')).toBeVisible({ timeout: 20_000 });

    // Disappears from search (the /events grid's data source).
    const searchRes = await page.request.get(`${API}/events/search`, {
      params: { filters: JSON.stringify({}), pagination: JSON.stringify({ page: 1, limit: 100 }) },
      headers: KEY,
    });
    const searchBody = await searchRes.json();
    const foundIds = (searchBody.events || []).map((e) => String(e._id));
    expect(foundIds).not.toContain(seed.renewalsModerationEventId);

    // Its own page reads unavailable.
    await page.goto(`/events/${seed.renewalsModerationEventId}`);
    await expect(page.getByText('Event not found')).toBeVisible({ timeout: 20_000 });

    // The purge queue lists it, tagged (blocked).
    await page.goto('/admin/profile/events/purge');
    const purgeRow = page.locator('tr', { hasText: 'E2E Renewals Moderation Fest' });
    await expect(purgeRow).toBeVisible({ timeout: 20_000 });
    await expect(purgeRow.getByText('(blocked)')).toBeVisible();
  });
});
