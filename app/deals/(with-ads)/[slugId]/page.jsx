import { extractIdFromSlug, META_DEFAULTS } from '@/utils/slugUtils';
import { notFound, unstable_rethrow } from 'next/navigation';
import { detailPageRobots, isDealIndexable } from '@/utils/seo/pageRobots';
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

    // Deleted: the page answers a real 404 (feature 1013).
    if (response.status === 404) notFound();

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
      // Ended or switched off: page stays but is hidden from search.
      robots: detailPageRobots(isDealIndexable(deal)),
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
    unstable_rethrow(error); // let notFound() through
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

// The not-found view lives in ./not-found.jsx: notFound() renders it with a real 404.
export default async function DealSlugPage({ params }) {
  const { slugId } = await params;
  const dealId = extractIdFromSlug(slugId);

  if (!dealId || !API_BASE_URL) {
    notFound();
  }

  // Fetch the deal on the server so its content is in the HTML (SEO).
  // Same public endpoint + revalidate as generateMetadata, so the two fetches dedupe.
  let deal = null;
  let gone = false;
  try {
    const response = await fetch(`${API_BASE_URL}/dailydeals/view/${dealId}`, {
      next: { revalidate: 3600, tags: [`deal-${dealId}`] },
    });
    if (response.status === 404) {
      gone = true;
    } else if (response.ok) {
      const json = await response.json();
      deal = json?.deal || null;
    }
  } catch (error) {
    console.error('Error fetching deal:', error);
  }

  // Deleted (backend 404): real 404 status with the not-found view, so Google drops the page.
  if (gone) notFound();
  // Backend down or unreadable answer: an error (5xx), never a 404 - Google retries later.
  if (!deal) throw new Error(`Deal ${dealId} could not be loaded`);

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
