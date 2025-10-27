import { createSlugUrl } from '@/utils/slugUtils';
import axios from '@/utils/axiosConfig';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

  try {
    const response = await axios.get('/events/sitemap');
    const events = response.data;
    const eventsArray = Array.isArray(events) ? events : events.data || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eventsArray.map(event => {
  const slug = createSlugUrl(event.title, event._id);
  const lastmod = event.updatedAt ? new Date(event.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return `  <url>
    <loc>${siteUrl}/events/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
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
