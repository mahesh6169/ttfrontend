import { createSlugUrl } from '@/utils/slugUtils';
import axios from '@/utils/axiosConfig';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

  try {
    const response = await axios.get('/dailydeals/sitemap');
    const deals = response.data;
    const dealsArray = Array.isArray(deals) ? deals : deals.data || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${dealsArray.map(deal => {
  const slug = createSlugUrl(deal.title, deal._id);
  const lastmod = deal.updatedAt ? new Date(deal.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return `  <url>
    <loc>${siteUrl}/deals/${slug}</loc>
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
    console.error('Error generating deals sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
