// Acceptance suite for featureplans/events-wizard-layout.md — the wizard frame: a sticky header
// (persistent "Add/Edit Event" title + stepper), a scrolling form, and a STATIC bottom toolbar at the
// end of the form (left Cancel/Previous, right Next / last-step Add / Update); footer-exempt; compact
// social links. The toolbar is no longer fixed - a fixed bar rode up over the fields when the mobile
// keyboard opened, so the actions now sit at the natural end of the form. Reached by editing a seeded
// event as the owning organiser (edit bypasses the Stripe gate + Google Places).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test.use({ storageState: 'e2e/.auth/organiser.json' });

// AC1 — the persistent title is visible on every step (edit: "Edit Event"; create: "Add Event").
test('AC1 the persistent title stays visible across steps', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible(); // still there on step 2

  // Create mode shows "Add Event".
  await page.goto('/events/add');
  await expect(page.getByRole('heading', { name: 'Add Event' })).toBeVisible({ timeout: 20_000 });
});

// AC2 — the header (title + stepper) stays pinned at the top; the action toolbar is NOT fixed - it
// sits at the end of the form and scrolls away with the content (below the form card).
test('AC2 header pinned at top; toolbar is static at the end of the form', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.setViewportSize({ width: 1024, height: 600 }); // short viewport -> the form overflows
  await page.goto(`/events/edit/${id}`);

  const header = page.getByTestId('wizard-header');
  const toolbar = page.getByTestId('wizard-toolbar');
  await expect(header).toBeVisible({ timeout: 20_000 });

  await page.evaluate(() => window.scrollBy(0, 900));
  const hb = await header.boundingBox();
  expect(hb.y).toBeLessThanOrEqual(70); // header stuck just below the 68px site nav

  // The toolbar is a static block at the very end of the form (after the form card), not a fixed bar.
  const notFixed = await toolbar.evaluate((el) => getComputedStyle(el).position !== 'fixed');
  expect(notFixed).toBe(true);
  const card = page.locator('[data-testid="wizard-header"] ~ div').first();
  const tb = await toolbar.boundingBox();
  const cb = await card.boundingBox();
  expect(tb.y).toBeGreaterThan(cb.y); // toolbar sits below the form card, not pinned to the viewport edge
});

// AC3 — bottom-left is "Cancel" on step 1, "Previous" on step 2+, and there is no separate top Cancel.
test('AC3 left slot morphs Cancel (step 1) -> Previous (step 2+); no separate top Cancel', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.goto(`/events/edit/${id}`);

  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(1); // the only Cancel is in the toolbar

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0); // Cancel is gone on step 2
});

// AC4 — the last step's primary button reads "Update" (edit) / "Add Event" (create), not "Next".
test('AC4 last step primary reads Update', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible({ timeout: 20_000 });

  // Advance until Next is gone (reached the last step).
  let guard = 0;
  while ((await page.getByRole('button', { name: 'Next' }).count()) > 0 && guard < 6) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
    guard++;
  }
  await expect(page.getByRole('button', { name: 'Update', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
});

// AC5 — the wizard renders no footer (it is footer-exempt).
test('AC5 no footer on the wizard', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByTestId('wizard-toolbar')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#Footer')).toHaveCount(0);
});

// AC6 — each social link is a single row (platform + URL + trash) with Add in the section title row.
test('AC6 social links are compact single rows with Add in the title row', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.goto(`/events/edit/${id}`);
  await page.getByRole('button', { name: 'Next' }).click(); // step 2 (Organiser)

  const section = page.getByTestId('social-links');
  const add = section.getByRole('button', { name: 'Add Social Link' });
  await expect(add).toBeVisible({ timeout: 15_000 });

  await add.click();
  const row = page.getByTestId('social-link-row').first();
  await expect(row).toBeVisible();
  // One row holds the platform control, the URL input, and a Remove trash — all on the one line.
  await expect(row.locator('input[type="url"]')).toBeVisible();
  await expect(row.getByRole('button', { name: 'Remove' })).toBeVisible();

  // Add sits in the title row, above the link rows.
  const addBox = await add.boundingBox();
  const rowBox = await row.boundingBox();
  expect(addBox.y).toBeLessThan(rowBox.y);
});

// AC7 — at 360px there is no horizontal scroll and the stepper is the compact "Step N of M".
test('AC7 360px: no horizontal scroll, compact "Step N of M" stepper', async ({ page }) => {
  const id = readSeed().builderEmptyEventId;
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/events/edit/${id}`);
  await expect(page.getByTestId('wizard-header')).toBeVisible({ timeout: 20_000 });

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await expect(page.getByText(/Step \d+ of \d+/)).toBeVisible();
});
