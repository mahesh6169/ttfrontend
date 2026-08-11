// Blocking answers on free-RSVP dropdown questions - see featureplans/events-rsvp-blocking-questions.md.
// The attendee picks a blocking answer, sees the inline message with Register disabled, switches to the
// safe answer, and completes the RSVP. Runs as the seeded member.
import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

test('AC11 a blocking answer disables Register with an inline message; the safe answer registers', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/rsvp/${seed.blockingRsvpEventId}`);
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('0412345678').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Member Tester');

  // Pick the blocking answer "No" -> inline message shows and the primary action becomes "Browse Events".
  // Custom questions now use the shared Attendee Information card (Headless UI Listbox): the trigger is
  // a button, the choices are role="option".
  await page.getByRole('button', { name: 'Select' }).click();
  await page.getByRole('option', { name: 'No', exact: true }).click();
  await expect(page.getByText('Sorry, this event is 18+ only.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Events' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toHaveCount(0);

  // Switch to the safe answer "Yes" -> the message clears and Register returns.
  await page.getByRole('button', { name: 'No', exact: true }).click(); // the trigger now shows "No"; reopen
  await page.getByRole('option', { name: 'Yes', exact: true }).click();
  await expect(page.getByText('Sorry, this event is 18+ only.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Register', exact: true })).toBeEnabled();

  // The registration completes.
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
  expect(dbCount('freeTickets', seed.blockingRsvpEventId)).toBeGreaterThanOrEqual(1);
});
