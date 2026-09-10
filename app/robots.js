import { currentIndexingPolicy } from '@/utils/seo/indexingPolicy';

// Environment-aware robots.txt (featureplans/fix-shared-environment-indexing.md, Stage 2).
// Replaces the old static public/robots.txt, which served the production Sitemap: line
// byte-for-byte in every environment. /chat stays disallowed everywhere - it is auth-gated
// and client-rendered, so it cannot carry its own noindex meta tag. Crawling itself is never
// blocked wholesale: staging just withholds the sitemap so Google is not invited to index it,
// while still reading the noindex meta tag on every page (removal-crawl requirement).
export default function robots() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  const { index: shouldIndex } = currentIndexingPolicy();

  const rules = {
    userAgent: '*',
    allow: '/',
    disallow: ['/chat'],
  };

  if (!shouldIndex) {
    return { rules };
  }

  return {
    rules,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
