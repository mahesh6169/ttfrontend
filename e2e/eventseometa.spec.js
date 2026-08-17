// Plan: featureplans/events-seo-detail.md - AC3..AC9 (event detail title + meta description).
import { test, expect } from '@playwright/test';
import { readSeed } from './helpers.js';

const MAX_DESCRIPTION = 155;

// The <title> text and the meta description content for /events/{id} (the id tail routes the page).
async function metaFor(page, id) {
  await page.goto(`/events/${id}`);
  const title = await page.title();
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  return { title, description };
}

test('AC3 an event with seoTitle uses it verbatim as the document title', async ({ page }) => {
  const seed = readSeed();
  const { title } = await metaFor(page, seed.seoFullEventId);
  expect(title).toBe(seed.seoFullEventTitle); // "TAP Vinayaka Pooja in Perth"
});

test('AC4 an event with no seoTitle falls back to the organiser event title verbatim', async ({ page }) => {
  const seed = readSeed();
  const { title } = await metaFor(page, seed.seoFreeEventId);
  expect(title).toBe(seed.seoFreeEventTitle); // "SEO Free Event"
});

test('AC5 the string "Desify" never appears in the document title', async ({ page }) => {
  const seed = readSeed();
  for (const id of [seed.seoFullEventId, seed.seoFreeEventId, seed.seoPaidEventId]) {
    const { title } = await metaFor(page, id);
    expect(title, `title "${title}" should not contain the brand`).not.toContain('Desify');
  }
});

test('AC6 an event with seoDescription uses it verbatim as the meta description', async ({ page }) => {
  const seed = readSeed();
  const { description } = await metaFor(page, seed.seoFullEventId);
  expect(description).toBe(seed.seoFullEventDescription);
});

test('AC7 a free event with no seoDescription gets the generated one-liner ending "Free RSVP."', async ({ page }) => {
  const seed = readSeed();
  const { description } = await metaFor(page, seed.seoFreeEventId);
  expect(description).toBe('SEO Free Event - Willetton, WA, 14 Sep 2026. Free RSVP.');
});

test('AC8 a paid event with no seoDescription ends the generated one-liner with "Get tickets."', async ({ page }) => {
  const seed = readSeed();
  const { description } = await metaFor(page, seed.seoPaidEventId);
  expect(description).toBe('SEO Paid Event - Willetton, WA, 14 Sep 2026. Get tickets.');
});

test('AC9 the meta description never exceeds ~155 chars, even for a very long title', async ({ page }) => {
  const seed = readSeed();
  for (const id of [seed.seoFullEventId, seed.seoFreeEventId, seed.seoPaidEventId, seed.seoLongEventId]) {
    const { description } = await metaFor(page, id);
    expect(description.length, `description "${description}" should be <= ${MAX_DESCRIPTION}`).toBeLessThanOrEqual(MAX_DESCRIPTION);
  }
});
