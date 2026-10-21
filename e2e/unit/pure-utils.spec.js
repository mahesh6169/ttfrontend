// Pure-function checks for small shared utilities (no page, no browser, no server).
import { test, expect } from '@playwright/test';
import { tidyUrl } from '../../utils/helpers/threads/richText.js';
import { isTravelRequest, getTravelCardLabel, getTravelFieldLabel } from '../../components/adverts/travelRequests.js';

// Tidied URL display for thread links - featureplans/threads-url-display.md.
test('tidyUrl strips scheme and www, never cuts the domain, and caps at the 60-char budget', () => {
  expect(tidyUrl('https://desify.com.au')).toBe('desify.com.au');
  expect(tidyUrl('https://www.example.com/path')).toBe('example.com/path');
  expect(tidyUrl('https://desify.com.au/events')).toBe('desify.com.au/events'); // fits -> no dots
  expect(tidyUrl('http://foo.com/bar')).toBe('foo.com/bar'); // scheme-agnostic display

  // Long path: domain intact, ends with "...", total exactly the budget, scheme gone.
  const long = 'https://desify.com.au/deals/view/abcdef1234567890/redeem-your-code-now-summer-2026';
  const t = tidyUrl(long);
  expect(t.startsWith('desify.com.au/deals/view')).toBeTruthy();
  expect(t.endsWith('...')).toBeTruthy();
  expect(t.length).toBe(60);
  expect(t).not.toContain('https://');

  // Over-budget domain: shown in FULL (rule 2 outranks the budget), path replaced by "...".
  expect(tidyUrl('https://' + 'a'.repeat(70) + '.com/some/path')).toBe('a'.repeat(70) + '.com...');

  // Query-string shape (raw href): scheme stripped, truncated with "...".
  const q = tidyUrl('https://x.io/p?v=1730000000000&campaign=spring-referral-longlonglonglong');
  expect(q.startsWith('x.io/p?v=')).toBeTruthy();
  expect(q).not.toContain('https://');
});

// Travel Requests cards show the budget kept in fields, e.g. "Wanted - $50".
test('travel request cards read "Wanted/Offered - budget" from the ad fields', () => {
  const ad = (adType, fields) => ({ subcategory: 'Parcel Carrying', adType, fields });
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Fixed amount', budgetAmount: 50 }))).toBe('Wanted - $50');
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Free (favour)' }))).toBe('Wanted - Free');
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Negotiable' }))).toBe('Wanted - Negotiable');
  expect(getTravelCardLabel(ad('offered', { budgetType: 'Fixed amount', budgetAmount: 30 }))).toBe('Offered - $30');
  expect(getTravelCardLabel(ad('wanted', {}))).toBe('Wanted');
  expect(isTravelRequest({ subcategory: 'Parcel Carrying' })).toBe(true);
  expect(isTravelRequest({ subcategory: 'Cars & Vehicles' })).toBe(false);
});

test('a wanted parcel request calls its date "Delivered By"; offered ads keep "Travel Date"', () => {
  const ad = (adType, subcategory) => ({ adType, subcategory });
  expect(getTravelFieldLabel(ad('wanted', 'Parcel Carrying'), 'travelDate', 'Travel Date')).toBe('Delivered By');
  expect(getTravelFieldLabel(ad('offered', 'Parcel Carrying'), 'travelDate', 'Travel Date')).toBe('Travel Date');
  expect(getTravelFieldLabel(ad('wanted', 'Travel Companion for Parents'), 'travelDate', 'Travel Date')).toBe('Travel Date');
});
