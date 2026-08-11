// events-terms-conditions.md - the organiser Terms & Conditions field and how it follows the refund
// policy through the buyer journey. AC1 (the wizard's 4th step + T&C box), AC3 (checkout shows the T&C
// and the acceptance covers both), AC6 (an event with no T&C renders nothing extra at checkout).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const API = 'http://localhost:5100/api';
const KEY = { 'x-api-key': 'test-api-key' };
const T_AND_C = 'E2E TERMS: no outside food or drink; entry subject to venue conditions.';

test.describe('config (organiser edit)', () => {
  test.use({ storageState: 'e2e/.auth/organiser.json' });

  test('AC1 the 4th step is "Refund & Terms" with an optional Terms and Conditions box after Additional Refund Policy', async ({ page }) => {
    await page.goto(`/events/edit/${readSeed().termsEventId}`);
    await expect(page.getByPlaceholder('Enter event title')).toBeVisible({ timeout: 20_000 });

    // Advance to the last step (Refund & Terms).
    let guard = 0;
    while ((await page.getByRole('button', { name: 'Next' }).count()) > 0 && guard < 6) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible({ timeout: 15_000 });
      guard++;
    }

    // The step is titled "Refund & Terms" (the stepper label).
    await expect(page.getByText('Refund & Terms').first()).toBeVisible();

    // A "Terms and Conditions" textarea, optional, capped at 2000, sits after "Additional Refund Policy".
    await expect(page.getByText('Additional Refund Policy')).toBeVisible();
    const tcBox = page.getByPlaceholder(/venue conditions/i);
    await expect(page.getByText('Terms and Conditions')).toBeVisible();
    await expect(tcBox).toHaveAttribute('maxlength', '2000');
    // It sits AFTER the Additional Refund Policy field.
    const arpY = (await page.getByText('Additional Refund Policy').boundingBox()).y;
    const tcY = (await page.getByText('Terms and Conditions').boundingBox()).y;
    expect(tcY).toBeGreaterThan(arpY);
    // Optional: it carries an "(optional)" tag and the seeded value loads (editable, no requirement).
    await expect(tcBox).toHaveValue(T_AND_C);
  });
});

test.describe('checkout (member)', () => {
  test.use({ storageState: 'e2e/.auth/member.json' });

  const clearReservation = async (page, eventId) => {
    const res = await page.request.get(`${API}/events/${eventId}/reservation`, { headers: KEY });
    if (res.ok()) {
      const body = await res.json();
      if (body?.reservation?._id) {
        await page.request.delete(`${API}/events/${eventId}/reservation/${body.reservation._id}`, { headers: KEY });
      }
    }
  };
  const gotoCheckoutNonSeated = async (page, eventId) => {
    await page.goto(`/events/tickets/${eventId}`);
    await page.getByRole('button', { name: 'Add one Standard' }).click();
    await expect(page.getByText(/1 ticket selected/)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Purchase Tickets' }).click();
    await expect(page).toHaveURL(new RegExp(`/events/checkout/${eventId}`), { timeout: 15_000 });
  };

  test('AC3 checkout shows the T&C after the refund policy, and the organiser acceptance covers both', async ({ page }) => {
    await clearReservation(page, readSeed().termsEventId);
    await gotoCheckoutNonSeated(page, readSeed().termsEventId);

    // The refund-policy display shows the refund policy AND the organiser T&C.
    await expect(page.getByText(/Refund Policy/i).first()).toBeVisible();
    await expect(page.getByText(T_AND_C)).toBeVisible();

    // The organiser acceptance now covers both; the platform terms checkbox is separate and unchanged.
    await expect(page.getByText(/refund policy and terms & conditions/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible(); // platform terms link, unchanged
    // Both acceptances are present (required to proceed).
    expect(await page.getByRole('checkbox').count()).toBeGreaterThanOrEqual(2);
  });

  test('AC6 an event with no T&C renders nothing extra at checkout', async ({ page }) => {
    await clearReservation(page, readSeed().paidEventId);
    await gotoCheckoutNonSeated(page, readSeed().paidEventId);

    // No organiser T&C: the seeded T&C text is absent and no "Terms & Conditions:" block from the refund display.
    await expect(page.getByText(T_AND_C)).toHaveCount(0);
    await expect(page.getByText('Terms & Conditions:')).toHaveCount(0);
    // The platform terms checkbox (with its "Terms" link) is still there - that acceptance is unchanged.
    await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
  });
});
