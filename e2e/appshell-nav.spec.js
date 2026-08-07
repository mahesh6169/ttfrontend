// Acceptance suite for featureplans/shared-appshell-nav.md (suite: appshell-nav).
// The desktop header centre nav and the mobile bottom nav both read one shared destination
// list, so they can no longer drift; viewport-fit=cover is emitted for safe-area handling;
// and the device split (destinations on top for desktop, bottom bar for mobile) still holds.
import { test, expect } from '@playwright/test';

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 800 };

// Read each destination link's label + href, in DOM order, from a nav container. Runs on the
// viewport where that nav is visible (innerText is empty for display:none elements).
async function readNav(page, testid) {
  return page.locator(`[data-testid="${testid}"] a`).evaluateAll((els) =>
    els.map((e) => ({ label: e.innerText.trim(), href: e.getAttribute('href') }))
  );
}

// AC1: both navs list the SAME destination labels in the SAME order (parity guard vs drift).
test('AC1 header nav and bottom nav share the same labels in the same order', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  const header = await readNav(page, 'header-nav');

  await page.setViewportSize(MOBILE);
  await page.goto('/');
  const bottom = await readNav(page, 'bottom-nav');

  expect(header.length).toBe(6);
  expect(header.map((d) => d.label)).toEqual(bottom.map((d) => d.label));
});

// AC2: each shared destination links to the same href in both navs.
test('AC2 each destination links to the same href in both navs', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  const header = await readNav(page, 'header-nav');

  await page.setViewportSize(MOBILE);
  await page.goto('/');
  const bottom = await readNav(page, 'bottom-nav');

  expect(header.map((d) => d.href)).toEqual(bottom.map((d) => d.href));
});

// AC3: the viewport meta includes viewport-fit=cover (activates the safe-area handling).
test('AC3 the document viewport meta includes viewport-fit=cover', async ({ page }) => {
  await page.goto('/');
  const content = await page.locator('meta[name="viewport"]').getAttribute('content');
  expect(content).toContain('viewport-fit=cover');
});

// AC4: the device split still holds after the refactor.
test('AC4 device split: bottom nav on mobile, header centre nav on desktop', async ({ page }) => {
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
  await expect(page.locator('[data-testid="header-nav"]')).toBeHidden();

  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
  await expect(page.locator('[data-testid="header-nav"]')).toBeVisible();
});
