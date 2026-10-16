// Pure-function checks for the SEO code (no page, no browser, no server).
// Plan: featureplans/fix-shared-environment-indexing.md - the environment indexing policy: a page
// is indexable only with the indexing flag on AND the exact production origin; anything else
// fails closed to noindex,nofollow. The build-based environment checks are in
// e2e/seo/environment.spec.js.
import { test, expect } from '@playwright/test';
import { resolveIndexingPolicy, PRODUCTION_ORIGIN } from '../../utils/seo/indexingPolicy.js';

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
