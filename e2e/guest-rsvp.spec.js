import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// Flagship guest journey (zero Stripe): open a free event, Continue as guest with an email, fill
// the RSVP form, see the success card. Anonymous context (no member storage state).
test('guest RSVPs a free event end to end', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);

  await page.getByRole('button', { name: 'Register for Event' }).click();
  await page.getByRole('button', { name: 'Continue as guest' }).click();

  await page.getByPlaceholder('you@email.com').fill('guest-e2e@test.dev');

  // reCAPTCHA test widget: click the checkbox in its iframe (Google's test key auto-passes).
  await page.frameLocator('iframe[title="reCAPTCHA"]').getByRole('checkbox').click();
  await expect(page.frameLocator('iframe[title="reCAPTCHA"]').locator('.recaptcha-checkbox-checked')).toBeVisible({ timeout: 10_000 });

  // Bot dwell-time trap: the form rejects submits faster than 1500ms. Wait past it.
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: /Continue to RSVP/ }).click();

  await expect(page).toHaveURL(new RegExp(`/events/rsvp/${seed.freeEventId}`), { timeout: 15_000 });
  await page.getByPlaceholder('0412345678').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Guest Tester');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
});
