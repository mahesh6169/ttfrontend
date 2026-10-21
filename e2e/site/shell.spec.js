// The app shell: the shared navigation (desktop header centre nav and mobile bottom nav read one
// destination list, so they cannot drift) and the one global footer (rendered once in
// app/layout.jsx, ON by default, OFF only on the exemption list; the visible footer carries
// id="Footer"). Plans: featureplans/shared-appshell-nav.md, featureplans/shared-footer-global.md.
import { test, expect } from '@playwright/test';
import { readSeed } from '../helpers.js';

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 800 };
const FOOTER = '#Footer';

// Read each destination link's label + href, in DOM order, from a nav container. Runs on the
// viewport where that nav is visible (innerText is empty for display:none elements).
async function readNav(page, testid) {
  return page.locator(`[data-testid="${testid}"] a`).evaluateAll((els) =>
    els.map((e) => ({ label: e.innerText.trim(), href: e.getAttribute('href') }))
  );
}

test('header nav on desktop and bottom nav on mobile list the same destinations, in the same order, with the same links', async ({ page }) => {
  // Desktop: header centre nav shown, bottom nav hidden.
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
  await expect(page.locator('[data-testid="header-nav"]')).toBeVisible();
  const header = await readNav(page, 'header-nav');

  // Mobile: bottom nav shown, header centre nav hidden.
  await page.setViewportSize(MOBILE);
  await page.goto('/');
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
  await expect(page.locator('[data-testid="header-nav"]')).toBeHidden();
  const bottom = await readNav(page, 'bottom-nav');

  expect(header.length).toBe(6);
  expect(header.map((d) => d.label)).toEqual(bottom.map((d) => d.label));
  expect(header.map((d) => d.href)).toEqual(bottom.map((d) => d.href));
});

test('text fields use 16px text on phones so iPhones do not zoom the page, desktop sizes unchanged, double-tap zoom off', async ({ page }) => {
  // iOS zooms into any field under 16px and does not zoom back (feature 1008).
  const fields = page
    .locator('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select')
    .filter({ visible: true });

  for (const path of ['/listings', '/login']) {
    await page.setViewportSize(MOBILE);
    await page.goto(path);
    await expect(fields.first(), `a visible field on ${path}`).toBeVisible({ timeout: 20_000 });
    const sizes = await fields.evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    for (const size of sizes) expect(size, `field text size on ${path} (mobile)`).toBeGreaterThanOrEqual(16);
  }

  // Desktop keeps the designed smaller field text (the login fields are text-sm = 14px).
  await page.setViewportSize(DESKTOP);
  await page.goto('/login');
  await expect(page.locator('input[type=email]')).toBeVisible({ timeout: 20_000 });
  expect(await page.locator('input[type=email]').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(16);

  // Double-tap zoom off, pinch zoom kept.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).touchAction)).toBe('manipulation');
});

test('ordinary pages show exactly one footer', async ({ page }) => {
  // Includes pages that previously had no footer (register, terms, a blog post) and the
  // standalone /tickets landing (unlike the exempt /events/tickets/* booking pages).
  const paths = [
    '/events',
    '/tickets',
    '/register',
    '/support/terms',
    '/support/contact',
    '/blog/give-your-clothes-a-second-home',
  ];
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `footer count on ${path}`).toHaveCount(1, { timeout: 20_000 });
  }
});

test('booking, profile, chat, admin and coupon-validate pages show no footer', async ({ page, browser, baseURL }) => {
  const seed = readSeed();

  // Booking flow (logged out). Checkout with no reservation redirects to the tickets page after
  // a delay - both are exempt, so the count stays 0 either way.
  for (const path of [`/events/checkout/${seed.paidEventId}`, `/events/tickets/${seed.paidEventId}`]) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `no footer expected on ${path}`).toHaveCount(0);
  }

  // Other exempt areas (logged out).
  for (const path of ['/chat', '/admin', '/validate']) {
    await page.goto(path);
    await expect(page.locator(FOOTER), `no footer expected on ${path}`).toHaveCount(0);
  }

  // The profile console, as the seeded (verified) member so the auth gate does not bounce us off
  // /users/profile; assert the URL held and the footer is absent.
  const memberContext = await browser.newContext({ baseURL, storageState: 'e2e/.auth/member.json' });
  try {
    const memberPage = await memberContext.newPage();
    await memberPage.goto('/users/profile');
    await expect(memberPage).toHaveURL(/\/users\/profile/, { timeout: 15_000 });
    await expect(memberPage.locator(FOOTER)).toHaveCount(0);
  } finally {
    await memberContext.close();
  }
});
