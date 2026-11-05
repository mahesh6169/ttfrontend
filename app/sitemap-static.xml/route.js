import { fetchSitemapSummary, newestDate } from '@/utils/seo/sitemapSummary';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  
  // Priorities aligned with brand-brief Section 5 vertical rank order.
  // See designGuides/SEO/Google-SEO.md (Good-to-have step 9) for source.
  const staticPages = [
    // `from` = which list's newest item dates the page (feature 1013); 'all' = newest anywhere.
    // /tickets is a fixed landing page with no list behind it, so it carries no <lastmod>.
    { url: '', priority: '1.0', changefreq: 'daily', from: 'all' },             // homepage
    { url: '/listings', priority: '0.9', changefreq: 'daily', from: 'listings' }, // rank 1 vertical
    { url: '/tickets', priority: '0.9', changefreq: 'weekly' },                 // landing — high conversion
    { url: '/events', priority: '0.85', changefreq: 'daily', from: 'events' },   // rank 2 vertical
    { url: '/threads', priority: '0.8', changefreq: 'daily', from: 'threads' },  // rank 4 vertical
    { url: '/deals', priority: '0.75', changefreq: 'daily', from: 'deals' },     // rank 5 vertical
    { url: '/coupons', priority: '0.7', changefreq: 'weekly', from: 'coupons' }, // rank 6 vertical
    // /support/contact, /support/terms, /support/privacy are intentionally omitted:
    // those pages are noindex, so listing them in a sitemap would contradict that.
  ];

  // Real "last changed" dates: the newest item behind each page, never "today" (feature 1013).
  const summary = await fetchSitemapSummary();
  const lastmodFor = (from) => {
    if (!summary || !from) return null;
    const iso = from === 'all'
      ? newestDate(...['listings', 'events', 'threads', 'deals', 'coupons'].map((k) => summary[k]?.lastmod))
      : summary[from]?.lastmod;
    return iso ? iso.split('T')[0] : null;
  };

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => {
  const lastmod = lastmodFor(page.from);
  return `  <url>
    <loc>${siteUrl}${page.url}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
