// Organiser page Share button - see featureplans/events-organiser-share-meta.md (share-button follow-up).
// The organiser page reuses the event detail page's Share popover (shared ShareIcons component) to
// share the page's own /events/by/{slug} URL. Runs logged out (the page is public).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// Reading the clipboard back needs these permissions; localhost is a secure context so the copy works.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('AC6 the organiser page has a Share button that opens the copy/whatsapp popover', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);
  await expect(page.getByRole('heading', { name: `Events by ${seed.orgPageName}` })).toBeVisible({ timeout: 20_000 });

  const shareBtn = page.getByRole('button', { name: 'Share' });
  await expect(shareBtn).toBeVisible();
  await shareBtn.click();

  // The shared ShareIcons controls appear in the popover.
  await expect(page.getByTitle('Copy link')).toBeVisible();
  await expect(page.getByTitle('Share on WhatsApp')).toBeVisible();
});

test('AC7 Copy puts this organiser page slug URL on the clipboard', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);
  await expect(page.getByRole('heading', { name: `Events by ${seed.orgPageName}` })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Share' }).click();
  await page.getByTitle('Copy link').click();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  // It shares the page's own /events/by/{slug} URL (project rule: share the clean slug URL), not /views/[id].
  expect(copied).toContain(`/events/by/${seed.orgPageSlug}`);
  expect(copied).not.toContain('/views/');
});
