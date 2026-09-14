import { test } from '@playwright/test';
import { readSeed } from './helpers.js';
import fs from 'fs';

test.use({ storageState: 'e2e/.auth/member.json' });

const WIDTHS = [360, 768, 1024];

test('visual - sales-closed event detail page', async ({ page }) => {
  const seed = readSeed();
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`/events/views/${seed.salesCutoffEventId}`);
    await page.waitForLoadState('load');
    await page.getByRole('button', { name: 'Sales Closed' }).waitFor({ state: 'visible', timeout: 25_000 });
    fs.mkdirSync('test-results/salescutoff-visual', { recursive: true });
    await page.screenshot({ path: `test-results/salescutoff-visual/detail-${w}.png`, fullPage: true });
  }
});

test('visual - tickets page for closed event', async ({ page }) => {
  const seed = readSeed();
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`/events/tickets/${seed.salesCutoffEventId}`);
    await page.waitForLoadState('load');
    await page.getByText('Ticket sales for this event have closed.').first().waitFor({ state: 'visible', timeout: 25_000 });
    fs.mkdirSync('test-results/salescutoff-visual', { recursive: true });
    await page.screenshot({ path: `test-results/salescutoff-visual/tickets-${w}.png`, fullPage: true });
  }
});
