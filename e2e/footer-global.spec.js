// Acceptance suite for featureplans/shared-footer-global.md (suite: footer-global).
// One global footer, rendered once in app/layout.jsx, ON by default, OFF only on the
// exemption list. The visible footer carries id="Footer" (unique in the app).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const FOOTER = '#Footer';

// AC1: a default browse page shows exactly one footer.
test('AC1 default browse page (/events) has exactly one footer', async ({ page }) => {
  await page.goto('/events');
  await expect(page.locator(FOOTER)).toHaveCount(1, { timeout: 20_000 });
});

// AC2: pages that previously had NO footer now show one (proves centralisation reaches them).
test('AC2 previously-footerless pages now show the footer', async ({ page }) => {
  for (const path of ['/register', '/support/terms', '/blog/give-your-clothes-a-second-home']) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `footer expected on ${path}`).toHaveCount(1, { timeout: 20_000 });
  }
});

// AC3: exempt booking-flow pages show no footer. (Checkout with no reservation redirects to
// the tickets page after a delay - both are exempt, so the count stays 0 either way.)
test('AC3 exempt booking-flow pages have no footer', async ({ page }) => {
  const seed = readSeed();
  for (const path of [`/events/checkout/${seed.paidEventId}`, `/events/tickets/${seed.paidEventId}`]) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `no footer expected on ${path}`).toHaveCount(0);
  }
});

// AC4: the profile console is exempt. Run as the seeded (verified) member so the auth gate does
// not bounce us off /users/profile; assert the URL held and the footer is absent.
test.describe('as the seeded member', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('AC4 exempt profile page has no footer', async ({ page }) => {
    await page.goto('/users/profile');
    await expect(page).toHaveURL(/\/users\/profile/, { timeout: 15_000 });
    await expect(page.locator(FOOTER)).toHaveCount(0);
  });
});

// AC5: the standalone /tickets landing keeps its footer (proves /tickets and /events/tickets/*
// are treated differently).
test('AC5 standalone /tickets page has a footer', async ({ page }) => {
  await page.goto('/tickets');
  await expect(page.locator(FOOTER)).toHaveCount(1, { timeout: 20_000 });
});

// AC6: other exempt areas show no footer.
test('AC6 other exempt areas (/chat, /admin, /validate) have no footer', async ({ page }) => {
  for (const path of ['/chat', '/admin', '/validate']) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `no footer expected on ${path}`).toHaveCount(0);
  }
});

// AC7: on a short page the footer drops to the bottom of the viewport, not mid-page. A tall
// viewport guarantees the content is less than one screen, so the sticky floor must apply.
// Desktop width -> the mobile bottom nav is hidden, so the footer is flush with the viewport bottom.
test('AC7 on a short page the footer sits at the bottom of the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1600 });
  await page.goto('/register');
  const footer = page.locator(FOOTER);
  await expect(footer).toHaveCount(1, { timeout: 20_000 });
  const box = await footer.boundingBox();
  expect(box).not.toBeNull();
  // Bottom edge flush with the viewport bottom.
  expect(box.y + box.height).toBeGreaterThanOrEqual(1600 - 3);
  // And well below the top - it dropped to the floor, it is not sitting right under the content.
  expect(box.y).toBeGreaterThan(800);
});

// AC8: on a mobile viewport the footer is fully visible ABOVE the fixed bottom nav. Scroll to the
// very bottom first so the footer is in view at its resting position (the page is taller than one
// screen on mobile); then its bottom edge must clear the fixed nav's top edge.
test('AC8 on mobile the footer sits fully above the bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/register');
  const footer = page.locator(FOOTER);
  await expect(footer).toHaveCount(1, { timeout: 20_000 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(footer).toBeInViewport();
  // The bottom nav is the fixed bottom bar containing the nav labels (visible below md).
  const nav = page.locator('.fixed.bottom-0').filter({ hasText: 'Forum' });
  await expect(nav).toBeVisible();
  const fBox = await footer.boundingBox();
  const nBox = await nav.boundingBox();
  expect(fBox).not.toBeNull();
  expect(nBox).not.toBeNull();
  // Footer's bottom edge must not cross into the nav (fully clear of it).
  expect(fBox.y + fBox.height).toBeLessThanOrEqual(nBox.y + 1);
});

// AC9: no page renders more than one footer (guards against a stray, un-removed render).
test('AC9 footer pages render exactly one footer (no stray duplicate)', async ({ page }) => {
  for (const path of ['/events', '/tickets', '/register', '/support/terms', '/support/contact']) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `footer count on ${path}`).toHaveCount(1, { timeout: 20_000 });
  }
});
