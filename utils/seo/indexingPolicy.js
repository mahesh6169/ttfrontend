// Environment indexing policy - featureplans/fix-shared-environment-indexing.md (Stage 1).
// A page is indexable only when indexing is explicitly enabled AND the configured public
// origin exactly matches the production origin. Anything else - missing, malformed,
// localhost, preview, or any other origin - fails closed to noindex,nofollow. This is the
// one place that decision is made; every route imports it rather than hardcoding robots.

export const PRODUCTION_ORIGIN = 'https://desify.com.au';

export function resolveIndexingPolicy({ allowIndexing, origin }) {
  const isEnabled = allowIndexing === true || allowIndexing === 'true';
  const normalizedOrigin = typeof origin === 'string' ? origin.replace(/\/+$/, '') : '';
  const isProductionOrigin = normalizedOrigin === PRODUCTION_ORIGIN;
  const shouldIndex = isEnabled && isProductionOrigin;

  return {
    index: shouldIndex,
    follow: shouldIndex,
  };
}

// Reads the two controlling env vars directly - the shape every call site needs.
export function currentIndexingPolicy() {
  return resolveIndexingPolicy({
    allowIndexing: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
    origin: process.env.NEXT_PUBLIC_WEBSITE_URL,
  });
}
