// Acceptance suite for featureplans/shared-layout-tiers.md (suite: layout-tiers).
// Three tiers (phone <768 / tablet 768-1023 / desktop 1024+), safe floor 360; the default
// content cap is 1024 (was 1152), forms stay 768; nothing scrolls sideways at the floor; and
// the side-ad rails are desktop-only (lg+).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const BAND = '[data-testid="content-band"]';

async function horizontalOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
}

// AC1: a default (with-ads) page caps its content band at 1024 on a wide desktop, not 1152.
test('AC1 default page content band caps at 1024 on wide desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/events');
  const band = page.locator(BAND).first();
  await expect(band).toBeVisible({ timeout: 20_000 });
  const box = await band.boundingBox();
  expect(box.width).toBeLessThanOrEqual(1025); // 1024 cap (+1 for rounding)
});

// AC2: a forms page caps its content band at 768 on a wide desktop.
test('AC2 forms page content band caps at 768 on wide desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/events/add');
  const band = page.locator(BAND).first();
  await expect(band).toBeVisible({ timeout: 20_000 });
  const box = await band.boundingBox();
  expect(box.width).toBeLessThanOrEqual(769); // 768 cap (+1 for rounding)
});

// AC3: at the 360px phone floor, no page scrolls sideways (nothing wider than the phone).
test('AC3 no horizontal scroll at the 360px floor', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize({ width: 360, height: 780 });
  const paths = ['/events', '/listings', `/events/views/${seed.freeEventId}`, '/events/add'];
  for (const p of paths) {
    await page.goto(p);
    await expect(page.locator(BAND).first()).toBeVisible({ timeout: 20_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    const overflow = await horizontalOverflow(page);
    expect(overflow, `horizontal overflow on ${p}`).toBeLessThanOrEqual(1);
  }
});

// AC4: on a tablet the default band fills the available width of its tier (governed by the
// Tailwind container's 768 max-width at md, minus the 16px gutters -> ~736), with the 1024 cap
// NOT in effect below desktop, and no horizontal scroll.
test('AC4 tablet default band fills the tier width, no 1024 cap', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/register');
  const band = page.locator(BAND).first();
  await expect(band).toBeVisible({ timeout: 20_000 });
  const box = await band.boundingBox();
  // Fills the tablet tier width (container 768 minus gutters) - not collapsed narrow, and well
  // clear of the 1024 default cap (which does not bite below desktop).
  expect(box.width).toBeGreaterThan(700);
  expect(box.width).toBeLessThan(1024);
  const overflow = await horizontalOverflow(page);
  expect(overflow).toBeLessThanOrEqual(1);
});

// AC5: the side-ad rails are desktop-only - present on desktop, no rail space on phone/tablet.
test('AC5 side-ad rails are desktop-only', async ({ page }) => {
  const left = page.locator('[data-testid="left-ad"]');
  const right = page.locator('[data-testid="right-ad"]');

  // Desktop: both rails render and are visible.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/events');
  await expect(left).toBeVisible({ timeout: 20_000 });
  await expect(right).toBeVisible();

  // Tablet: no rail visible (no rail space reserved; content column spans the full width).
  await page.setViewportSize({ width: 900, height: 900 });
  await page.goto('/events');
  await expect(left).toBeHidden();
  await expect(right).toBeHidden();

  // Phone: no rail visible.
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/events');
  await expect(left).toBeHidden();
  await expect(right).toBeHidden();
});
