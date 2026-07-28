import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from './helpers.js';

// Authenticated as the seeded member (no guest fork).
test.use({ storageState: 'e2e/.auth/member.json' });

test('member RSVPs a free event without the guest fork', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);
  // Let the on-load validate call settle so the member is recognised.
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Register for Event' }).click();
  // Member goes straight to the RSVP page - no email/reCAPTCHA fork.
  await expect(page).toHaveURL(new RegExp(`/events/rsvp/${seed.freeEventId}`), { timeout: 15_000 });

  await page.getByPlaceholder('Enter your mobile number').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Member Tester');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });

  // Confirm it persisted.
  expect(dbCount('freeTickets', seed.freeEventId)).toBeGreaterThanOrEqual(1);
});
