import axios from '@/utils/axiosConfig';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';

  try {
    const response = await axios.get('/coupons/campaigns/sitemap');
    const campaigns = response.data;
    const campaignsArray = Array.isArray(campaigns) ? campaigns : campaigns.data || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${campaignsArray.map(campaign => {
  const lastmod = campaign.updatedAt ? new Date(campaign.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  return `  <url>
    <loc>${siteUrl}/coupons/${campaign.slug}</loc>
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
    console.error('Error generating coupon sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
