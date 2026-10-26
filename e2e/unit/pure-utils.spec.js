// Pure-function checks for small shared utilities (no page, no browser, no server).
import { test, expect } from '@playwright/test';
import { tidyUrl } from '../../utils/helpers/threads/richText.js';
import { isTravelRequest, isIndiaToIndia, getTravelCardLabel, getTravelFieldLabel, formatTravelDate, getTravelPlaceText } from '../../components/adverts/travelRequests.js';

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
  const ad = (adType, fields) => ({ subcategory: 'Parcel', adType, fields });
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Fixed amount', budgetAmount: 50 }))).toBe('Wanted - $50');
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Favour' }))).toBe('Wanted - Favour');
  expect(getTravelCardLabel(ad('wanted', { budgetType: 'Negotiable' }))).toBe('Wanted - Negotiable');
  expect(getTravelCardLabel(ad('offered', { budgetType: 'Fixed amount', budgetAmount: 30 }))).toBe('Offered - $30');
  expect(getTravelCardLabel(ad('wanted', {}))).toBe('Wanted');
  expect(isTravelRequest({ subcategory: 'Parcel' })).toBe(true);
  expect(isTravelRequest({ subcategory: 'Cars & Vehicles' })).toBe(false);
});

test('a wanted parcel request calls its date "Delivered By"; offered ads keep "Travel Date"', () => {
  const ad = (adType, subcategory) => ({ adType, subcategory });
  expect(getTravelFieldLabel(ad('wanted', 'Parcel'), 'travelDate', 'Travel Date')).toBe('Delivered By');
  expect(getTravelFieldLabel(ad('offered', 'Parcel'), 'travelDate', 'Travel Date')).toBe('Travel Date');
  expect(getTravelFieldLabel(ad('wanted', 'Travel Companion'), 'travelDate', 'Travel Date')).toBe('Travel Date');
  expect(getTravelFieldLabel(ad('wanted', 'Travel Companion'), 'numberOfParents', 'Number Of Parents')).toBe('Number of People');
  expect(getTravelFieldLabel(ad('offered', 'Travel Companion'), 'numberOfParents', 'Number Of Parents')).toBe('Number of People');
});

test('a travel date is shown exactly as picked, with no timezone shift', () => {
  expect(formatTravelDate('2026-12-20')).toBe('20 Dec 2026');
  expect(formatTravelDate('2026-01-05')).toBe('5 Jan 2026');
  expect(formatTravelDate('Flexible')).toBe('Flexible'); // old free-text values pass through
});

test('a travel place reads "Perth / WA" or "India / City"', () => {
  expect(getTravelPlaceText({ fromPlace: 'Perth / WA' }, 'from')).toBe('Perth / WA');
  expect(getTravelPlaceText({ toPlace: 'India', toCity: ' Hyderabad ' }, 'to')).toBe('India / Hyderabad');
  expect(getTravelPlaceText({}, 'from')).toBe('');
});

test('India to India is refused; one end must be in Australia', () => {
  expect(isIndiaToIndia({ fromPlace: 'India', toPlace: 'India' })).toBe(true);
  expect(isIndiaToIndia({ fromPlace: 'India', toPlace: 'Perth / WA' })).toBe(false);
  expect(isIndiaToIndia({})).toBe(false);
});
