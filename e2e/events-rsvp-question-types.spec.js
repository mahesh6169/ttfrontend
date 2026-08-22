// featureplans/events-rsvp-question-types.md - browser journeys.
// Reflects the section-8 amendments (owner UX pass): AC20 (supersedes AC14) - ONE Add question button
// with an in-card type dropdown offering six types on free / two on paid, the scale label editor, the
// date "Also ask time", and the live Preview. AC15 - the attendee 360px journey (render, gating,
// blocking multiple-choice swaps to Browse Events, submit). AC21 - the scale tiers (stacked pills with
// inside labels at 360; five-across at 1024). AC16 - the CSV export + answers sheet.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { readSeed } from './helpers.js';

// Advance the edit wizard to step 3 (Registration).
const gotoStep3 = async (page, eventId) => {
  await page.goto(`/events/edit/${eventId}`);
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Attendee Information' })).toBeVisible({ timeout: 15_000 });
};

test.describe('AC20 builder - one Add question button with an in-card type dropdown', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC20 a free event offers six types, the scale editor, Also ask time, and Preview', async ({ page }) => {
    await gotoStep3(page, readSeed().qtypesFreeEventId);

    // One "+ Add question" button (not a per-type row). It opens the editor in a sheet (bottom sheet
    // on mobile / dialog on desktop), the same ResponsiveSheet the Preview uses.
    await page.getByRole('button', { name: 'Add question' }).click();
    await expect(page.getByTestId('question-editor-sheet')).toBeVisible();

    // The in-card type dropdown lists SIX types on a free event (text, dropdown, multiple choice,
    // checkboxes, linear scale, date) - Time and Yes/No are gone from the menu.
    await page.getByRole('button', { name: 'Text' }).click();
    await expect(page.getByRole('option')).toHaveCount(6);
    for (const label of [/Multiple choice/, /Checkboxes/, /Linear scale/, /^Date/]) {
      await expect(page.getByRole('option', { name: label })).toBeVisible();
    }

    // Choosing Linear scale reveals the per-number label editor.
    await page.getByRole('option', { name: /Linear scale/ }).click();
    await expect(page.getByText('Filled labels appear under the scale.')).toBeVisible();

    // Choosing Date reveals "Also ask time".
    await page.getByRole('button', { name: 'Linear scale' }).click();
    await page.getByRole('option', { name: /^Date/ }).click();
    await expect(page.getByText('Also ask time')).toBeVisible();

    // Name it and close the editor sheet (keeps the question), then Preview opens the live sheet.
    await page.getByPlaceholder(/Enter your question/).fill('When can you arrive');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.getByRole('heading', { name: 'Attendee view' })).toBeVisible();
  });

  test('AC20 a paid event offers only text and dropdown in the type dropdown', async ({ page }) => {
    await gotoStep3(page, readSeed().qtypesPaidEventId);

    await page.getByRole('button', { name: 'Add question' }).click();
    await page.getByRole('button', { name: 'Text' }).click();
    await expect(page.getByRole('option')).toHaveCount(2);
    await expect(page.getByRole('option', { name: /Multiple choice/ })).toHaveCount(0);
  });
});

test.describe('AC15 attendee RSVP form (360px)', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('AC15 the types render; Register gates; a blocking answer swaps to Browse Events', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`/events/rsvp/${readSeed().qtypesRsvpEventId}`);
    await page.waitForLoadState('networkidle');

    const section = page.locator('[data-attendee-section]');
    await expect(section).toBeVisible({ timeout: 20_000 });
    // A sampling of the controls renders: radio, checkboxes, scale.
    await expect(page.getByRole('radio', { name: 'Yes' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Painting' })).toBeVisible();
    await expect(section.getByRole('button', { name: '3', exact: true })).toBeVisible(); // scale 1..5

    // Optional questions read as skippable ("(optional)"); required ones carry the red asterisk.
    await expect(section.getByText('(optional)').first()).toBeVisible();

    const register = page.locator('[data-testid="rsvp-register"]');
    await expect(register).toBeDisabled(); // required multiple-choice not answered yet

    // A blocking answer: the organiser's reason rides the always-visible sticky bar (so it is seen
    // without scrolling), a small marker points at the blocking field, and the primary swaps to
    // Browse Events.
    await page.getByRole('radio', { name: 'No' }).check();
    const ctaBar = page.locator('[data-testid="rsvp-cta-bar"]');
    await expect(ctaBar.getByText('Sorry, 18+ only.')).toBeVisible();
    await expect(page.getByText('This answer blocks registration')).toBeVisible();
    await expect(page.locator('[data-testid="rsvp-browse"]')).toBeVisible();

    // Switching to a non-blocking answer restores Register and clears both markers.
    await page.getByRole('radio', { name: 'Yes' }).check();
    await expect(page.locator('[data-testid="rsvp-browse"]')).toHaveCount(0);
    await expect(page.getByText('This answer blocks registration')).toHaveCount(0);
    await expect(ctaBar.getByText('Sorry, 18+ only.')).toHaveCount(0);

    // Complete the required info and register.
    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Attendee Tester');
    await expect(register).toBeEnabled();
    await register.click();
    await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Date question uses the calendar-popover picker', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('the date+time question opens a calendar, writes a friendly value, and completes the required set', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    // The worst-case event's date question is REQUIRED; the member never registers here (AC21), so
    // its form always renders and we can assert Register only greens once the date is picked.
    await page.goto(`/events/rsvp/${readSeed().qtypesWorstEventId}`);
    await page.locator('[data-attendee-section]').waitFor({ timeout: 20_000 });

    // Fill every OTHER required field first (mobile, name, the required text, a non-blocking choice).
    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Picker Tester');
    await page.getByPlaceholder('Enter requested details').fill('No requirements');
    await page.getByRole('radio').first().check(); // first option is non-blocking

    // With the required date still empty, Register stays disabled.
    const register = page.locator('[data-testid="rsvp-register"]');
    await expect(register).toBeDisabled();

    // Open the calendar popover for the date-and-time question.
    const field = page.getByRole('button', { name: /When will you arrive/ });
    await field.scrollIntoViewIfNeeded();
    await field.click();
    const popover = page.getByTestId('datetime-popover');
    await expect(popover).toBeVisible();

    // Pick a day; with no time yet, it defaults to 9:00 AM.
    await popover.getByRole('button', { name: '20', exact: true }).click();
    await expect(field).toContainText('20');
    await expect(field).toContainText('9:00 AM');

    // Set a specific time via the hour/minute selects + PM pill.
    await popover.getByLabel('Hour').selectOption('2');
    await popover.getByLabel('Minute').selectOption('30');
    await popover.getByRole('button', { name: 'PM', exact: true }).click();
    await expect(field).toContainText('2:30 PM');

    await popover.getByRole('button', { name: 'Done' }).click();
    await expect(popover).toHaveCount(0);

    // Now every required field is answered - Register greens (enables).
    await expect(register).toBeEnabled();
  });
});

test.describe('AC21 scale renders per tier with inside labels', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  // Use the worst-case event (the member never registers there, so its form always renders) whose
  // scale carries labels on pills 1 and 5.
  const openScale = async (page, width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/events/rsvp/${readSeed().qtypesWorstEventId}`);
    await page.locator('[data-attendee-section]').waitFor({ timeout: 20_000 });
    const first = page.getByRole('button', { name: /Would not rec/ }); // scale pill 1 carries its label
    const last = page.getByRole('button', { name: /Would recommend/ }); // scale pill 5
    await first.scrollIntoViewIfNeeded();
    return { first, last };
  };

  test('AC21 at 360 the scale stacks full-width with labels inside the pills', async ({ page }) => {
    const { first, last } = await openScale(page, 360);
    await expect(first).toBeVisible();
    const b1 = await first.boundingBox();
    const b5 = await last.boundingBox();
    // Stacked: pill 5 sits well below pill 1 (not the same row).
    expect(b5.y).toBeGreaterThan(b1.y + 30);
    // Full-width-ish pills at the phone tier.
    expect(b1.width).toBeGreaterThan(200);
  });

  test('AC21 at 1024 the scale is five-across with labels under the numbers', async ({ page }) => {
    const { first, last } = await openScale(page, 1024);
    await expect(first).toBeVisible();
    const b1 = await first.boundingBox();
    const b5 = await last.boundingBox();
    // Five across: pills 1 and 5 share a row (same top), pill 5 is to the right of pill 1.
    expect(Math.abs(b5.y - b1.y)).toBeLessThan(6);
    expect(b5.x).toBeGreaterThan(b1.x);
  });
});

test.describe('AC16 CSV export + answers sheet', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC16 Download CSV produces one row per registration with a column per question', async ({ page }) => {
    await page.goto('/users/profile/checkinrsvp');
    const card = page.getByTestId('checkinrsvp-event-card').filter({ hasText: 'E2E QTypes CSV' });
    await expect(card).toBeVisible({ timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Download CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    const raw = fs.readFileSync(await download.path(), 'utf8');
    // UTF-8 BOM for Excel.
    expect(raw.charCodeAt(0)).toBe(0xfeff);
    const lines = raw.replace(/^\uFEFF/, '').split('\r\n'); // CRLF line ends
    const header = lines[0].split(',');
    // Columns: reg number, mobile, attendees, then one per question in builder order.
    expect(header.slice(0, 3)).toEqual(['Registration Number', 'Mobile', 'Attendees']);
    expect(header.slice(3)).toEqual(['Dietary needs', 'Workshops', 'T-shirt size', 'Arrival']);

    // The pick-many cell joins with "; " and the leading-zero mobile is preserved.
    const row1 = lines.find((l) => l.includes('RC-CSV-01'));
    expect(row1).toContain('Painting; Music');
    expect(row1).toContain('0412345678');
    // The date+time answer is rendered friendly with AM/PM, not the raw 24-hour ISO string.
    expect(row1).toContain('20 Aug 2026, 2:30 PM');
    expect(row1).not.toContain('2026-08-20T14:30');

    // Oldest registration on top: RC-CSV-01 (seeded first) comes before RC-CSV-02.
    const idx1 = lines.findIndex((l) => l.includes('RC-CSV-01'));
    const idx2 = lines.findIndex((l) => l.includes('RC-CSV-02'));
    expect(idx1).toBeGreaterThan(0);
    expect(idx1).toBeLessThan(idx2);
  });

  test('AC16 the answers expand inline under the row, friendly-formatted, and toggle shut', async ({ page }) => {
    await page.goto(`/users/profile/checkinrsvp/${readSeed().qtypesCsvEventId}`);
    const row = page.getByTestId('checkinrsvp-row').filter({ hasText: 'RC-CSV-01' });
    await expect(row).toBeVisible({ timeout: 20_000 });

    // Clicking the info icon opens the answers INLINE (no modal).
    await row.getByRole('button', { name: 'View attendee information' }).click();
    const answers = page.getByTestId('checkinrsvp-answers');
    await expect(answers).toBeVisible();
    await expect(answers).toContainText('Painting; Music');
    // The inline panel renders the date the same friendly way as the downloads.
    await expect(answers).toContainText('20 Aug 2026, 2:30 PM');
    await expect(answers).not.toContainText('2026-08-20T14:30');

    // Clicking again collapses it.
    await row.getByRole('button', { name: 'View attendee information' }).click();
    await expect(answers).toHaveCount(0);
  });
});
