import { createSlugUrl } from '@/utils/slugUtils';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    return new Response('API URL not configured', { status: 500 });
  }

  try {
    // Fetch all events from API
    const response = await fetch(`${apiUrl}/events/sitemap`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const events = await response.json();
    const eventsArray = Array.isArray(events) ? events : events.data || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eventsArray.map(event => {
  const slug = createSlugUrl(event.title, event._id);
  const lastmod = event.updatedAt ? new Date(event.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return `  <url>
    <loc>${siteUrl}/events/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating events sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
