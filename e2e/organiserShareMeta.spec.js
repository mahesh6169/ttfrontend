// Organiser page share card - see featureplans/events-organiser-share-meta.md.
// The organiser page /events/by/{slug} emits an Open Graph card: defaults built from the organiser
// name + the site default OG image when the organiser has no share fields, the custom values when set.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// The site default OG image, made absolute against the test site URL (.env.test:
// NEXT_PUBLIC_WEBSITE_URL=http://localhost:3120, META_DEFAULTS.defaultImage=/desify-og-default.jpg).
const DEFAULT_OG_IMAGE = 'http://localhost:3120/desify-og-default.jpg';

const ogContent = (page, property) =>
  page.locator(`meta[property="${property}"]`).getAttribute('content');

test('AC3 an organiser with no share fields gets the default share card in its head', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgPageSlug}`);

  await expect(await ogContent(page, 'og:title')).toBe(`Events by ${seed.orgPageName}`);
  await expect(await ogContent(page, 'og:description')).toBe(
    `Book upcoming events by ${seed.orgPageName} on Desify!!`
  );
  await expect(await ogContent(page, 'og:image')).toBe(DEFAULT_OG_IMAGE);
});

test('AC4 an organiser with custom share fields uses those in its head', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgShareSlug}`);

  await expect(await ogContent(page, 'og:title')).toBe(seed.orgShareTitle);
  await expect(await ogContent(page, 'og:description')).toBe(seed.orgShareDescription);
  await expect(await ogContent(page, 'og:image')).toBe(seed.orgShareImage);
});

test('AC4b the visible page heading uses the share title as the organiser name', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/by/${seed.orgShareSlug}`);

  // organiserShareTitle wins over the event's own organiser name, so the on-screen heading reads it.
  await expect(
    page.getByRole('heading', { name: `Events by ${seed.orgShareTitle}` })
  ).toBeVisible({ timeout: 20_000 });
});
