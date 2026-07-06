import { extractIdFromSlug, META_DEFAULTS } from '@/utils/slugUtils';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slugId } = await params;
  const dealId = extractIdFromSlug(slugId);

  if (!dealId || !API_BASE_URL) {
    return {
      title: 'Deal Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }

  try {
    // Fetch deal data from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/dailydeals/view/${dealId}`, {
      next: {
        revalidate: 3600,
        tags: [`deal-${dealId}`]
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Deal not found');
    }

    const data = await response.json();
    const deal = data.deal;

    // Generate meta tags
    const title = deal.dealTitle || 'Daily Deal';

    // Build description: Until {date}. {location} {businessName}
    let description = '';

    // Add end date
    if (deal.endDate) {
      const endDate = format(new Date(deal.endDate), 'dd MMM');
      description = `Until ${endDate}`;
    }

    // Add location (suburb, state)
    const address = deal.partnerstoreId?.address;
    if (address?.suburb && address?.state) {
      description += description ? `. ${address.suburb}, ${address.state}` : `${address.suburb}, ${address.state}`;
    }

    // Add business name
    if (deal.partnerstoreId?.businessName) {
      description += description ? ` - ${deal.partnerstoreId.businessName}` : deal.partnerstoreId.businessName;
    }

    // Get OG image or fallback (skip raw images to avoid >300KB issues)
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = deal.ogImageUrl || process.env.NEXT_PUBLIC_FALLBACK_DEAL_IMAGE_URL;

    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }

    // Add cache-busting parameter using updatedAt timestamp
    if (image && deal.updatedAt) {
      const timestamp = new Date(deal.updatedAt).getTime();
      const separator = image.includes('?') ? '&' : '?';
      image = `${image}${separator}v=${timestamp}`;
    }

    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/dailydeals/${slugId}`;

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
            alt: deal.dealTitle || 'Deal image',
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
    console.error('Error fetching deal for meta tags:', error);
    const fallbackImage = process.env.NEXT_PUBLIC_FALLBACK_DEAL_IMAGE_URL;
    return {
      title: 'Daily Deal - Desify',
      description: META_DEFAULTS.defaultDescription,
      openGraph: {
        title: 'Daily Deal',
        description: META_DEFAULTS.defaultDescription,
        siteName: META_DEFAULTS.siteName,
        images: fallbackImage ? [{ url: fallbackImage, width: 1200, height: 630 }] : [],
        locale: 'en_AU',
        type: 'website',
      },
      twitter: {
        card: fallbackImage ? 'summary_large_image' : 'summary',
        title: 'Daily Deal',
        description: META_DEFAULTS.defaultDescription,
        images: fallbackImage ? [fallbackImage] : [],
      },
    };
  }
}

export default async function DealSlugPage({ params }) {
  const { slugId } = await params;
  const dealId = extractIdFromSlug(slugId);

  if (!dealId) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
        <div className="text-center">
          <p className="text-slate-700">Deal not found</p>
          <p className="text-sm text-slate-500 mt-2">Redirecting...</p>
        </div>
        <meta httpEquiv="refresh" content="3; url=/dailydeals" />
      </div>
    );
  }

  // Use meta refresh instead of a JavaScript redirect
  // This lets crawlers read the meta tags before following the redirect
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[calc(100vh-9rem)]">
      <div
        className="h-8 w-8 rounded-full border-2 border-teal-100 border-t-teal-600 animate-spin"
        role="status"
        aria-label="Redirecting"
      ></div>
      <p className="text-sm text-slate-500">Redirecting...</p>
      <meta httpEquiv="refresh" content={`3; url=/dailydeals/views/${dealId}`} />
    </div>
  );
}
