// Browser journeys for featureplans/coupons-guest-code.md - a logged-out visitor claims a coupon
// code by email. The code is emailed, never rendered; a repeat claim is greeted warmly.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// Drive the guest fork on the coupon views page: open GET CODE, choose the email path, pass the
// reCAPTCHA test widget + dwell-time trap, submit. Returns after the network call resolves.
async function claimByEmail(page, campaignId, email) {
  await page.goto(`/coupons/views/${campaignId}`);

  await page.getByRole('button', { name: 'GET CODE' }).click();
  await page.getByRole('button', { name: 'Get it by email' }).click();

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

// AC9: a logged-out visitor claims a coupon by email and sees the sent-to-your-email confirmation -
// the code never appears anywhere on the page.
test('AC9 [e2e]: logged-out visitor claims a coupon by email; the code is never shown', async ({ page }) => {
  const seed = readSeed();
  await claimByEmail(page, seed.couponCampaignId, 'coupon-guest@test.dev');

  await expect(page.getByText(/on its way/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('coupon-guest@test.dev')).toBeVisible();

  // The code (STOREID-12345 shape) must not be rendered anywhere on the page.
  await expect(page.locator('body')).not.toContainText(/-\d{5}/);
});

// AC10: repeating the claim in the browser shows the friendly already-claimed message.
test('AC10 [e2e]: repeating the claim shows the already-claimed message', async ({ page }) => {
  const seed = readSeed();
  const email = 'coupon-reclaim@test.dev';

  // First claim - fresh.
  await claimByEmail(page, seed.couponCampaignId, email);
  await expect(page.getByText(/on its way/i)).toBeVisible({ timeout: 15_000 });

  // Second claim - same email, same campaign.
  await claimByEmail(page, seed.couponCampaignId, email);
  await expect(page.getByText(/already claimed/i)).toBeVisible({ timeout: 15_000 });
});
