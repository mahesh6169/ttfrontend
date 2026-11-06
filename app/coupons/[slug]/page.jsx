import { META_DEFAULTS } from '@/utils/slugUtils';
import { notFound, unstable_rethrow } from 'next/navigation';
import { format } from 'date-fns';
import { formatValidDays } from '@/utils/couponSchedule';
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
      next: { 
        revalidate: 3600,
        tags: [`campaign-${slug}`]
      },
      signal: controller.signal,
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY || ''
      }
    });
    
    clearTimeout(timeoutId);
    
    // Deleted or expired coupon: the page answers a real 404 (feature 1013).
    if (response.status === 404) notFound();

    if (!response.ok) {
      throw new Error('Campaign not found');
    }
    
    const data = await response.json();
    const campaign = data.campaign;
    
    // M3: "{discount} {discountProduct} at {storeName}"
    const title = `${campaign.discount} ${campaign.discountProduct} at ${campaign.storeId?.storeName || 'store'}`;

    // M8: "Valid {days} until {expiryDate}. Show QR code in-store to redeem."
    const days = formatValidDays(campaign.validDays);
    const expiryStr = campaign.expiryDate ? format(new Date(campaign.expiryDate), 'dd MMM yyyy') : '';
    const description = days
      ? `Valid ${days} until ${expiryStr}. Show QR code in-store to redeem.`
      : `Valid until ${expiryStr}. Show QR code in-store to redeem.`;
    
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = campaign.ogImageUrl || campaign.storeId?.logo?.url || process.env.NEXT_PUBLIC_FALLBACK_CAMPAIGN_IMAGE_URL;
    
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    if (image) {
      const storeTime = campaign.storeId?.updatedAt ? new Date(campaign.storeId.updatedAt).getTime() : 0;
      const campaignTime = campaign.updatedAt ? new Date(campaign.updatedAt).getTime() : 0;
      const timestamp = Math.max(storeTime, campaignTime);
      if (timestamp > 0) {
        const separator = image.includes('?') ? '&' : '?';
        image = `${image}${separator}v=${timestamp}`;
      }
    }
    
    const url = `${siteUrl}/coupons/${slug}`;
    
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: url },
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
    unstable_rethrow(error); // let notFound() through
    console.error('Error fetching campaign for meta tags:', error);
    return {
      title: 'Discount Campaign - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

// The body is still drawn in the browser (CampaignDetailClient), but the server first asks the
// backend whether the coupon exists: deleted or expired -> real 404 with ./not-found.jsx, so
// Google drops the page (feature 1013). Same request + cache tag as generateMetadata (deduped).
// Any other failure falls through to the client, which shows its own message as before.
export default async function CampaignDetailPage({ params }) {
  const { slug } = await params;
  if (!slug || !API_BASE_URL) notFound();

  let gone = false;
  try {
    const response = await fetch(`${API_BASE_URL}/coupons/campaigns/slug/${slug}`, {
      next: { revalidate: 3600, tags: [`campaign-${slug}`] },
      headers: { 'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY || '' },
    });
    gone = response.status === 404;
  } catch (error) {
    console.error('Error checking campaign:', error);
  }
  if (gone) notFound();

  return <CampaignDetailClient params={params} />;
}
