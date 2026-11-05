// Pure-function checks for the SEO code (no page, no browser, no server).
// Plan: featureplans/fix-shared-environment-indexing.md - the environment indexing policy: a page
// is indexable only with the indexing flag on AND the exact production origin; anything else
// fails closed to noindex,nofollow. The build-based environment checks are in
// e2e/seo/environment.spec.js.
import { test, expect } from '@playwright/test';
import { resolveIndexingPolicy, PRODUCTION_ORIGIN } from '../../utils/seo/indexingPolicy.js';
import { isListingIndexable, isDealIndexable, isEventIndexable } from '../../utils/seo/pageRobots.js';
import { eventStatusFor } from '../../utils/helpers/events/eventStatus.js';
import { buildEventJsonLd } from '../../utils/helpers/events/eventJsonLd.js';

const FAIL_CLOSED_CASES = [
  { name: 'missing origin', allowIndexing: true, origin: undefined },
  { name: 'empty origin', allowIndexing: true, origin: '' },
  { name: 'malformed origin', allowIndexing: true, origin: 'not-a-url' },
  { name: 'localhost origin', allowIndexing: true, origin: 'http://localhost:3120' },
  { name: 'vercel preview origin', allowIndexing: true, origin: 'https://desify-git-feature-xyz.vercel.app' },
  { name: 'unrelated unknown origin', allowIndexing: true, origin: 'https://example.com' },
  { name: 'telugufy origin even with indexing enabled', allowIndexing: true, origin: 'https://telugufy.com.au' },
  { name: 'exact desify origin with indexing disabled', allowIndexing: false, origin: PRODUCTION_ORIGIN },
];

for (const c of FAIL_CLOSED_CASES) {
  test(`indexing policy fails closed: ${c.name}`, () => {
    expect(resolveIndexingPolicy({ allowIndexing: c.allowIndexing, origin: c.origin })).toEqual({
      index: false,
      follow: false,
    });
  });
}

test('indexing policy: the exact desify origin with indexing enabled is the only eligible combination', () => {
  expect(resolveIndexingPolicy({ allowIndexing: true, origin: PRODUCTION_ORIGIN })).toEqual({
    index: true,
    follow: true,
  });
});

test('indexing policy: a trailing slash on the production origin still normalises to eligible', () => {
  expect(resolveIndexingPolicy({ allowIndexing: true, origin: `${PRODUCTION_ORIGIN}/` })).toEqual({
    index: true,
    follow: true,
  });
});

// Feature 1013 - which detail pages stay out of Google, and what an event page says when it is over.

const DAY = 24 * 3600 * 1000;
const NOW = Date.parse('2026-11-05T12:00:00Z');

test('hidden from Google: a listing that is switched off or past its expiry date; a live one stays in', () => {
  expect(isListingIndexable({ status: 'active', expiresAt: new Date(NOW + DAY) }, NOW)).toBe(true);
  expect(isListingIndexable({ status: 'active', expiresAt: new Date(NOW - DAY) }, NOW)).toBe(false);
  expect(isListingIndexable({ status: 'inactive', expiresAt: new Date(NOW + DAY) }, NOW)).toBe(false);
});

test('hidden from Google: a deal that is switched off or has ended; a running one stays in', () => {
  expect(isDealIndexable({ isOnline: true, endDate: new Date(NOW + DAY) }, NOW)).toBe(true);
  expect(isDealIndexable({ isOnline: false, endDate: new Date(NOW + DAY) }, NOW)).toBe(false);
  expect(isDealIndexable({ isOnline: true, endDate: new Date(NOW - 3 * DAY) }, NOW)).toBe(false);
});

test('hidden from Google: an event the organiser switched off; finished and cancelled events stay in', () => {
  expect(isEventIndexable({ goLive: true })).toBe(true);
  expect(isEventIndexable({ goLive: false })).toBe(false);
  expect(isEventIndexable({ goLive: true, deletedByOrganiser: true })).toBe(true);
});

test('event page note: cancelled beats ended, ended goes by the end date, upcoming has none', () => {
  expect(eventStatusFor({ dateTime: new Date(NOW + DAY), expiryDate: new Date(NOW + 2 * DAY) }, NOW)).toBe(null);
  expect(eventStatusFor({ dateTime: new Date(NOW - 2 * DAY), expiryDate: new Date(NOW - DAY) }, NOW)).toBe('ended');
  // Started but still running (multi-day): not ended yet.
  expect(eventStatusFor({ dateTime: new Date(NOW - DAY), expiryDate: new Date(NOW + DAY) }, NOW)).toBe(null);
  expect(eventStatusFor({ deletedByOrganiser: true, dateTime: new Date(NOW + DAY) }, NOW)).toBe('cancelled');
  expect(eventStatusFor({ deletedByOrganiser: true, dateTime: new Date(NOW - 2 * DAY) }, NOW)).toBe('cancelled');
});

test('event structured data says cancelled for an organiser-cancelled event, scheduled otherwise', () => {
  const base = { title: 'Diwali Night', dateTime: new Date(NOW + DAY), venue: 'Hall' };
  expect(buildEventJsonLd(base, 'https://desify.com.au/events/x').eventStatus).toBe('https://schema.org/EventScheduled');
  expect(buildEventJsonLd({ ...base, deletedByOrganiser: true }, 'https://desify.com.au/events/x').eventStatus)
    .toBe('https://schema.org/EventCancelled');
});
