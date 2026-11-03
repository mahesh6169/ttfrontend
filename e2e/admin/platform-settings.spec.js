// Platform Settings (admin): the Show Deals / Show Coupons switches take the section out of the
// desktop header nav and the mobile bottom nav, while its pages still open from a direct link.
// The switches are restored at the end so the other specs (which run after, on the same DB) see
// the normal menus.
import { test, expect } from '@playwright/test';

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 800 };

const navLabels = (page, testid) =>
  page.locator(`[data-testid="${testid}"] a`).evaluateAll((els) => els.map((e) => e.innerText.trim()));

// The menus come from a cached server read that the save clears at once; poll with reloads so a
// slow cache refresh does not fail the check.
async function expectNav(page, testid, check) {
  await expect(async () => {
    await page.reload();
    check(await navLabels(page, testid));
  }).toPass({ timeout: 75_000, intervals: [1_000, 3_000, 5_000] });
}

test.describe('platform settings', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test.afterEach(async ({ page }) => {
    await page.request.put(`${API}/admin/platform-settings`, {
      headers: KEY,
      data: { showDeals: true, showCoupons: true },
    });
  });

  test('switching Deals off on Platform Settings hides it from both navs, Coupons stays, and /deals still opens', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/admin/profile/settings');
    await expect(page.getByRole('heading', { name: 'Platform Settings' })).toBeVisible({ timeout: 20_000 });

    const deals = page.getByRole('switch', { name: 'Show Deals' });
    await expect(deals).toHaveAttribute('aria-checked', 'true');
    await deals.click();
    await expect(deals).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('status')).toContainText('Deals hidden');

    await page.goto('/');
    await expectNav(page, 'header-nav', (labels) => {
      expect(labels).not.toContain('Deals');
      expect(labels).toContain('Coupons');
      expect(labels).toContain('Events');
    });

    await page.setViewportSize(MOBILE);
    await expectNav(page, 'bottom-nav', (labels) => {
      expect(labels).not.toContain('Deals');
      expect(labels).toContain('Coupons');
    });

    // The page itself keeps working from a direct link.
    const res = await page.goto('/deals');
    expect(res.status()).toBe(200);
  });

  test('switching Coupons off hides it from the navs; switching both back on restores them', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/admin/profile/settings');
    const coupons = page.getByRole('switch', { name: 'Show Coupons' });
    await expect(coupons).toHaveAttribute('aria-checked', 'true', { timeout: 20_000 });
    await coupons.click();
    await expect(coupons).toHaveAttribute('aria-checked', 'false');

    await page.goto('/');
    await expectNav(page, 'header-nav', (labels) => {
      expect(labels).not.toContain('Coupons');
      expect(labels).toContain('Deals');
    });
    expect((await page.goto('/coupons')).status()).toBe(200);

    await page.goto('/admin/profile/settings');
    await coupons.click();
    await expect(coupons).toHaveAttribute('aria-checked', 'true');
    await page.goto('/');
    await expectNav(page, 'header-nav', (labels) => {
      expect(labels).toContain('Coupons');
      expect(labels).toContain('Deals');
    });
  });
});
