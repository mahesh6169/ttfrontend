// Acceptance suite for featureplans/events-rsvp-ui.md (suite: rsvpui). The free-RSVP page is brought
// up to the paid flow-page standard: the mobile bottom nav is hidden and a sticky action bar owns the
// bottom edge (AC1), Register stays greyed with a reason until the required info is complete (AC2),
// custom questions render in the shared "Attendee Information" card (AC3), and a member can still RSVP
// end to end under the new layout (AC4). Runs as the seeded member (no guest fork).
import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from './helpers.js';

test.use({ storageState: 'e2e/.auth/member.json' });

const MOBILE = { width: 390, height: 800 };

test('AC1 mobile bottom nav is hidden and a sticky action bar shows "N attendees" + Register', async ({ page }) => {
  const seed = readSeed();
  await page.setViewportSize(MOBILE);
  await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
  await page.waitForLoadState('networkidle');

  // The mobile bottom nav is hidden on this flow page; the sticky action bar owns the bottom edge.
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
  const bar = page.locator('[data-testid="rsvp-cta-bar"]');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(/attendee/i);
  await expect(bar.locator('[data-testid="rsvp-register"]')).toBeVisible();
});

test('AC2 Register is disabled with a reason until the required info is complete, then enables', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
  await page.waitForLoadState('networkidle');

  const register = page.locator('[data-testid="rsvp-register"]');
  // Greyed with a reason before anything is filled.
  await expect(register).toBeDisabled();
  await expect(register).toContainText(/Fill Required Info/i);

  // Complete the required info: mobile number, the attendee name, and the required custom question.
  await page.getByPlaceholder('0412345678').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Member Tester');
  await page.getByPlaceholder('Enter requested details').fill('None');

  await expect(register).toBeEnabled();
  await expect(register).toContainText(/^Register$/);
});

test('AC3 custom questions render inside the shared "Attendee Information" card', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: 'Attendee Information' })).toBeVisible();
  // The custom question lives inside that card, not the old inline layout.
  await expect(page.locator('[data-attendee-section]')).toContainText('Dietary needs');
});

test('AC4 a member can still RSVP end to end under the new layout', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('0412345678').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Member Tester');
  await page.getByPlaceholder('Enter requested details').fill('None');
  await page.locator('[data-testid="rsvp-register"]').click();

  await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
  expect(dbCount('freeTickets', seed.rsvpUiEventId)).toBeGreaterThanOrEqual(1);
  // The guest half of AC4 (a guest completing under the new layout) is covered by guest-rsvp.spec.js.
});
