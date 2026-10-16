// Browser journey for featureplans/coupons-guest-code.md - a logged-out visitor claims a coupon
// code by email. The code is emailed, never rendered; a repeat claim is greeted warmly.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

// Drive the guest fork on the coupon views page: open GET CODE, choose the email path, pass the
// reCAPTCHA test widget + dwell-time trap, submit. Returns after the network call resolves.
async function claimByEmail(page, campaignId, email) {
  await page.goto(`/coupons/views/${campaignId}`);

  await page.getByRole('button', { name: 'GET CODE' }).click();
  await page.getByRole('button', { name: 'Continue as guest' }).click();

  await page.getByPlaceholder('you@email.com').fill(email);

  // reCAPTCHA test widget: tick the checkbox in its iframe (Google's test key auto-passes).
  await page.frameLocator('iframe[title="reCAPTCHA"]').getByRole('checkbox').click();
  await expect(
    page.frameLocator('iframe[title="reCAPTCHA"]').locator('.recaptcha-checkbox-checked')
  ).toBeVisible({ timeout: 10_000 });

  // Bot dwell-time trap: the form rejects submits faster than 1500ms. Wait past it.
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Email me the code' }).click();
}

test('a logged-out visitor claims a coupon by email without ever seeing the code; claiming again shows the already-claimed message', async ({ page }) => {
  const seed = readSeed();
  const email = 'coupon-guest@test.dev';

  // First claim - fresh: the sent-to-your-email confirmation.
  await claimByEmail(page, seed.couponCampaignId, email);
  await expect(page.getByText(/on its way/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(email)).toBeVisible();

  // The code (STOREID-12345 shape) must not be rendered anywhere on the page.
  await expect(page.locator('body')).not.toContainText(/-\d{5}/);

  // Second claim - same email, same campaign: the friendly already-claimed message.
  await claimByEmail(page, seed.couponCampaignId, email);
  await expect(page.getByText(/already claimed/i)).toBeVisible({ timeout: 15_000 });
});
