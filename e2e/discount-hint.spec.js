// Locks the discount-hint validity filter (ttfrontend/utils/events/discountCodes.js): on a
// customer-facing surface, only a USABLE discount code is shown as a redeemable hint. The event
// OWNER is sent the full, unfiltered codes array (for the edit wizard), so on the owner's own
// preview of the buy-tickets page, the client filter is what must hide a dead code. Retro-tracked
// add-on to featureplans/events-detail-conform.md.
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

// As the event owner (organiser) - the API keeps every code for them, so the display filter is the
// only thing hiding the used-up one here.
test.use({ storageState: 'e2e/.auth/organiser.json' });

test('discount hint shows a live code and hides a used-up one (owner view)', async ({ page }) => {
  const seed = readSeed();
  await page.goto(`/events/tickets/${seed.discountEventId}`);
  // LIVE10 renders in both the mobile and desktop ticket markups, so assert it is present in the
  // DOM (first match attached) rather than a single visible node; DEAD10 must be absent entirely.
  await expect(page.getByText('LIVE10').first()).toBeAttached({ timeout: 20_000 }); // remainingUses 5 -> shown
  await expect(page.getByText('DEAD10')).toHaveCount(0);                            // remainingUses 0 -> hidden
});
