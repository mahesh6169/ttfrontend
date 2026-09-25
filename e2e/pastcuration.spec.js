// featureplans/events-past-offline-curation.md - the Past strip widened to include OFFLINE
// (and organiser-deleted) finished events, and the free-RSVP registration-closed state proven
// through that same strip's own path.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

test('AC6 - /events shows the finished OFFLINE event in the Past events strip with its Ended tag; an unfeatured past event is absent', async ({ page }) => {
  await page.goto('/events');

  const section = page.getByTestId('past-events');
  await expect(section).toBeVisible({ timeout: 20_000 });
  await expect(section.getByText('E2E Past Offline Fest')).toBeVisible();
  await expect(section.getByText('Ended').first()).toBeVisible();
  // Admin curation gate (regression, shared with pastevents.spec.js AC1).
  await expect(section.getByText('E2E Past Unfeatured Fest')).toHaveCount(0);
});

test('AC7 - opening the finished FREE event from the strip shows a greyed, disabled Registrations Closed button and no active Register button', async ({ page }) => {
  await page.goto('/events');
  const section = page.getByTestId('past-events');
  await expect(section.getByText('E2E Past Offline Fest')).toBeVisible({ timeout: 20_000 });
  await section.getByText('E2E Past Offline Fest').click();

  await expect(page.getByRole('heading', { name: 'E2E Past Offline Fest' })).toBeVisible({ timeout: 20_000 });
  const closedButton = page.getByRole('button', { name: 'Registrations Closed' });
  await expect(closedButton).toBeVisible();
  await expect(closedButton).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Register for Event' })).toHaveCount(0);
});

test('AC8 - opening the finished PAID event from the strip shows the greyed, disabled Sales Closed button (existing paid behaviour, proven through the strip)', async ({ page }) => {
  await page.goto('/events');
  const section = page.getByTestId('past-events');
  await expect(section.getByText('E2E Past Featured Paid Fest')).toBeVisible({ timeout: 20_000 });
  await section.getByText('E2E Past Featured Paid Fest').click();

  await expect(page.getByRole('heading', { name: 'E2E Past Featured Paid Fest' })).toBeVisible({ timeout: 20_000 });
  const closedButton = page.getByRole('button', { name: 'Sales Closed' });
  await expect(closedButton).toBeVisible();
  await expect(closedButton).toBeDisabled();
});

test('AC9 - an upcoming free event still shows an active Register button (regression guard)', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);
  await expect(page.getByRole('button', { name: 'Register for Event' })).toBeVisible({ timeout: 20_000 });
});
