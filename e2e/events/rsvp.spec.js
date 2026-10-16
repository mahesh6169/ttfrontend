// Free-event RSVP journeys: guest and member registration, the RSVP page layout and gating,
// blocking answers, the date picker, and registration closed vs open.
import { test, expect } from '@playwright/test';
import { readSeed, dbCount } from '../helpers.js';

const MOBILE = { width: 390, height: 800 };

// Flagship guest journey (zero Stripe): open a free event, Continue as guest with an email, fill
// the RSVP form, see the success card. Anonymous context (no member storage state).
test('a guest RSVPs to a free event end to end', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);

  await page.getByRole('button', { name: 'Register for Event' }).click();
  await page.getByRole('button', { name: 'Continue as guest' }).click();

  await page.getByPlaceholder('you@email.com').fill('guest-e2e@test.dev');

  // reCAPTCHA test widget: click the checkbox in its iframe (Google's test key auto-passes).
  await page.frameLocator('iframe[title="reCAPTCHA"]').getByRole('checkbox').click();
  await expect(page.frameLocator('iframe[title="reCAPTCHA"]').locator('.recaptcha-checkbox-checked')).toBeVisible({ timeout: 10_000 });

  // Bot dwell-time trap: the form rejects submits faster than 1500ms. Wait past it.
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: /Continue to RSVP/ }).click();

  await expect(page).toHaveURL(new RegExp(`/events/rsvp/${seed.freeEventId}`), { timeout: 15_000 });
  await page.getByPlaceholder('0412345678').fill('0412345678');
  await page.getByPlaceholder('Enter full name').fill('Guest Tester');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
});

test.describe('as a member', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  test('a member registers for free events without the guest fork, with a sticky bar, the questions card and gated Register', async ({ page }) => {
    const seed = readSeed();

    // 1. Straight from the event page to the RSVP page - no email/reCAPTCHA fork.
    await page.goto(`/events/views/${seed.freeEventId}`);
    // Let the on-load validate call settle so the member is recognised.
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Register for Event' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/rsvp/${seed.freeEventId}`), { timeout: 15_000 });
    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Member Tester');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
    expect(dbCount('freeTickets', seed.freeEventId)).toBeGreaterThanOrEqual(1);

    // 2. On mobile the bottom nav is hidden and a sticky bar shows "N attendees" + Register.
    await page.setViewportSize(MOBILE);
    await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeHidden();
    const bar = page.locator('[data-testid="rsvp-cta-bar"]');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText(/attendee/i);
    await expect(bar.locator('[data-testid="rsvp-register"]')).toBeVisible();

    // 3. Back on desktop: custom questions sit in the shared "Attendee Information" card.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/events/rsvp/${seed.rsvpUiEventId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Attendee Information' })).toBeVisible();
    await expect(page.locator('[data-attendee-section]')).toContainText('Dietary needs');

    // 4. Register is greyed with a reason until the required info is complete, then enables.
    const register = page.locator('[data-testid="rsvp-register"]');
    await expect(register).toBeDisabled();
    await expect(register).toContainText(/Fill Required Info/i);
    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Member Tester');
    await page.getByPlaceholder('Enter requested details').fill('None');
    await expect(register).toBeEnabled();
    await expect(register).toContainText(/^Register$/);

    // 5. Submit end to end under the new layout.
    await register.click();
    await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
    expect(dbCount('freeTickets', seed.rsvpUiEventId)).toBeGreaterThanOrEqual(1);
  });

  test('a blocking answer stops registration with a message until a safe answer is picked', async ({ page }) => {
    const seed = readSeed();

    // 1. Dropdown question (desktop): the blocking answer swaps Register for Browse Events.
    await page.goto(`/events/rsvp/${seed.blockingRsvpEventId}`);
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Member Tester');

    // Custom questions use the shared Attendee Information card (Headless UI Listbox): the trigger is
    // a button, the choices are role="option".
    await page.getByRole('button', { name: 'Select' }).click();
    await page.getByRole('option', { name: 'No', exact: true }).click();
    await expect(page.getByText('Sorry, this event is 18+ only.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Events' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register', exact: true })).toHaveCount(0);

    // Switch to the safe answer "Yes" -> the message clears and Register returns.
    await page.getByRole('button', { name: 'No', exact: true }).click(); // the trigger now shows "No"; reopen
    await page.getByRole('option', { name: 'Yes', exact: true }).click();
    await expect(page.getByText('Sorry, this event is 18+ only.')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Register', exact: true })).toBeEnabled();

    await page.getByRole('button', { name: 'Register', exact: true }).click();
    await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
    expect(dbCount('freeTickets', seed.blockingRsvpEventId)).toBeGreaterThanOrEqual(1);

    // 2. Multiple-choice question at 360px: the question types render, Register gates, and the
    // blocking reason rides the sticky bar.
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`/events/rsvp/${seed.qtypesRsvpEventId}`);
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

    // A blocking answer: the organiser's reason rides the always-visible sticky bar, a small marker
    // points at the blocking field, and the primary swaps to Browse Events.
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

    await page.getByPlaceholder('0412345678').fill('0412345678');
    await page.getByPlaceholder('Enter full name').fill('Attendee Tester');
    await expect(register).toBeEnabled();
    await register.click();
    await expect(page.getByText('Registration successful')).toBeVisible({ timeout: 20_000 });
  });

  test('the date and time question opens a calendar, writes a friendly value and completes the required set', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    // The worst-case event's date question is REQUIRED; the member never registers here, so
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

test('a finished free event shows Registrations Closed while an upcoming one still offers Register', async ({ page }) => {
  // Opened from the Past events strip: greyed, disabled Registrations Closed and no Register button.
  await page.goto('/events');
  const section = page.getByTestId('past-events');
  await expect(section.getByText('E2E Past Offline Fest')).toBeVisible({ timeout: 20_000 });
  await section.getByText('E2E Past Offline Fest').click();

  await expect(page.getByRole('heading', { name: 'E2E Past Offline Fest' })).toBeVisible({ timeout: 20_000 });
  const closedButton = page.getByRole('button', { name: 'Registrations Closed' });
  await expect(closedButton).toBeVisible();
  await expect(closedButton).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Register for Event' })).toHaveCount(0);

  // Regression guard: an upcoming free event still shows an active Register button.
  const seed = readSeed();
  await page.goto(`/events/views/${seed.freeEventId}`);
  await expect(page.getByRole('button', { name: 'Register for Event' })).toBeVisible({ timeout: 20_000 });
});
