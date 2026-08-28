import { extractIdFromSlug, META_DEFAULTS } from '@/utils/slugUtils';
import { format } from 'date-fns';
import { formatValidDays } from '@/utils/couponSchedule';
import DealDetailContent from '@/components/dailydeals/dealcomponents/DealDetailContent';
import { buildDealJsonLd } from '@/utils/helpers/dailydeals/dealJsonLd';

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

    // M7: "Valid {days} until {endDate} at {businessName}"
    let description = '';
    const days = formatValidDays(deal.validDays);
    const endDateStr = deal.endDate ? format(new Date(deal.endDate), 'dd MMM yyyy') : '';
    const businessName = deal.partnerstoreId?.businessName || '';
    if (days) {
      description = `Valid ${days} until ${endDateStr} at ${businessName}`;
    } else {
      description = `Valid until ${endDateStr} at ${businessName}`;
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
    const url = `${META_DEFAULTS.siteUrl}/deals/${slugId}`;

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

// Simple not-found view (server-rendered, no redirect)
function DealNotFound() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
      <div className="text-center">
        <p className="text-slate-700">Deal not found</p>
        <a href="/deals" className="text-sm text-teal-700 hover:text-teal-800 mt-2 inline-block">
          Browse deals
        </a>
      </div>
    </div>
  );
}

export default async function DealSlugPage({ params }) {
  const { slugId } = await params;
  const dealId = extractIdFromSlug(slugId);

  if (!dealId || !API_BASE_URL) {
    return <DealNotFound />;
  }

  // Fetch the deal on the server so its content is in the HTML (SEO).
  // Same public endpoint + revalidate as generateMetadata, so the two fetches dedupe.
  let deal = null;
  try {
    const response = await fetch(`${API_BASE_URL}/dailydeals/view/${dealId}`, {
      next: { revalidate: 3600, tags: [`deal-${dealId}`] },
    });
    if (response.ok) {
      const json = await response.json();
      deal = json?.deal || null;
    }
  } catch (error) {
    console.error('Error fetching deal:', error);
  }

  if (!deal) {
    return <DealNotFound />;
  }

  // Structured data — Offer JSON-LD (seller = partner store LocalBusiness)
  const jsonLd = buildDealJsonLd(deal, `${META_DEFAULTS.siteUrl}/deals/${slugId}`);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <DealDetailContent deal={deal} />
    </>
  );
}
