export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/tickets', priority: '0.9', changefreq: 'weekly' },
    { url: '/listings', priority: '0.8', changefreq: 'daily' },
    { url: '/events', priority: '0.8', changefreq: 'daily' },
    { url: '/threads', priority: '0.7', changefreq: 'daily' },
    { url: '/discountcode', priority: '0.7', changefreq: 'weekly' },
    { url: '/support/contact', priority: '0.4', changefreq: 'yearly' },
    { url: '/support/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/support/privacy', priority: '0.3', changefreq: 'yearly' },
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
