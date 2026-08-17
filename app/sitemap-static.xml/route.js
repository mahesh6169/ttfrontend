export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  
  // Priorities aligned with brand-brief Section 5 vertical rank order.
  // See designGuides/SEO/Google-SEO.md (Good-to-have step 9) for source.
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },           // homepage
    { url: '/listings', priority: '0.9', changefreq: 'daily' },  // rank 1 vertical
    { url: '/tickets', priority: '0.9', changefreq: 'weekly' },  // landing — high conversion
    { url: '/events', priority: '0.85', changefreq: 'daily' },   // rank 2 vertical
    { url: '/threads', priority: '0.8', changefreq: 'daily' },   // rank 4 vertical
    { url: '/deals', priority: '0.75', changefreq: 'daily' }, // rank 5 vertical
    { url: '/coupons', priority: '0.7', changefreq: 'weekly' }, // rank 6 vertical
    // /support/contact, /support/terms, /support/privacy are intentionally omitted:
    // those pages are noindex, so listing them in a sitemap would contradict that.
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
