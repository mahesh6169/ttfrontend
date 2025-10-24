import { META_DEFAULTS } from '@/utils/slugUtils';
import CampaignDetailClient from './CampaignDetailClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_BASE_URL is not configured');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  if (!slug || !API_BASE_URL) {
    return {
      title: 'Campaign Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/coupons/campaigns/slug/${slug}`, {
      next: { revalidate: 3600 },
      signal: controller.signal,
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY || ''
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Campaign not found');
    }
    
    const data = await response.json();
    const campaign = data.campaign;
    
    const title = `${campaign.discount} on ${campaign.discountProduct}`;
    const description = campaign.storeId?.storeName || 'Discount offer available';
    
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = campaign.storeId?.logo?.url;
    
    if (!image || image.includes('No_image')) {
      image = `${siteUrl}${META_DEFAULTS.defaultImage}`;
    }
    
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    const url = `${siteUrl}/discountcode/${slug}`;
    
    return {
      title: `${title} - ${META_DEFAULTS.siteName}`,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: META_DEFAULTS.siteName,
        images: image ? [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `${campaign.storeId?.storeName} logo`,
          }
        ] : [],
        locale: 'en_AU',
        type: 'website',
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch (error) {
    console.error('Error fetching campaign for meta tags:', error);
    return {
      title: 'Discount Campaign - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default function CampaignDetailPage({ params }) {
  return <CampaignDetailClient params={params} />;
}
