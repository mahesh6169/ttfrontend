import fs from 'fs/promises';
import path from 'path';

// Blog sitemap — one <url> per markdown file in public/blog. Blog posts are flat
// files (no DB), so we list the directory directly and use each file's mtime as
// <lastmod>. Referenced from the sitemap index (app/sitemap.xml/route.js).
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  const dir = path.join(process.cwd(), 'public', 'blog');

  try {
    let files = [];
    try {
      files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'));
    } catch {
      files = []; // no blog dir yet → empty (but valid) sitemap
    }

    const entries = await Promise.all(
      files.map(async (file) => {
        const slug = file.replace(/\.md$/, '');
        const stat = await fs.stat(path.join(dir, file));
        const lastmod = stat.mtime.toISOString().split('T')[0];
        return `  <url>
    <loc>${siteUrl}/blog/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
    );

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating blog sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
