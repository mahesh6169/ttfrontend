import fs from 'fs/promises';
import path from 'path';
import { fetchSitemapSummary, newestDate } from '@/utils/seo/sitemapSummary';

// Sitemap index (feature 1013): names a child sitemap only when it has at least one page, so
// Google is never pointed at an empty list (it flags those as errors). A list comes back by
// itself once content is added. <lastmod> is the real date the newest item in that list
// changed - never "now" - so Google can trust it. If the backend summary cannot be read, every
// database list is named without a date (safe fallback, same as before).
const DB_SITEMAPS = ['listings', 'events', 'deals', 'threads', 'coupons'];

async function hasBlogPosts() {
  try {
    const files = await fs.readdir(path.join(process.cwd(), 'public', 'blog'));
    return files.some((f) => f.endsWith('.md'));
  } catch {
    return false;
  }
}

const entry = (loc, lastmod) => `  <sitemap>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </sitemap>`;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  const summary = await fetchSitemapSummary();

  const entries = [];
  // The static pages (home + section landings) always exist; dated by the newest item anywhere.
  entries.push(entry(`${siteUrl}/sitemap-static.xml`,
    summary ? newestDate(...DB_SITEMAPS.map((k) => summary[k]?.lastmod)) : null));

  for (const key of DB_SITEMAPS) {
    if (!summary) {
      entries.push(entry(`${siteUrl}/sitemap-${key}.xml`, null));
      continue;
    }
    const info = summary[key];
    if (!info || !(info.count > 0)) continue; // empty list: leave it out
    entries.push(entry(`${siteUrl}/sitemap-${key}.xml`, info.lastmod));
  }

  // Blog posts are files; their dates are handled in the blog feature, so no <lastmod> here.
  if (await hasBlogPosts()) entries.push(entry(`${siteUrl}/sitemap-blog.xml`, null));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</sitemapindex>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
