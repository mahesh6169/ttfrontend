import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import { headers } from 'next/headers';
import AdvertDetailContent from '@/components/adverts/advertcomponents/AdvertDetailContent';
import { buildListingJsonLd } from '@/utils/helpers/adverts/listingJsonLd';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listingId = extractIdFromSlug(slug);
  
  if (!listingId || !API_BASE_URL) {
    return {
      title: 'Listing Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch listing data from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/adverts/byid/${listingId}`, {
      next: { 
        revalidate: 3600,
        tags: [`listing-${listingId}`]
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Listing not found');
    }
    
    const data = await response.json();
    const listing = data.data?.advert || data.data || data.advert || data;
    
    // Generate meta tags
    const title = listing.title || 'Listing';

    // M9: strip markdown markers and HTML tags to plain text
    const stripMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/^#+\s*/gm, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/^>\s*/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // M10: cap at 155 chars at the nearest word boundary
    const MAX_DESC = 155;
    const capDescription = (text) => {
      if (!text || text.length <= MAX_DESC) return text || '';
      const cut = text.slice(0, MAX_DESC);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
    };

    // M5: price, location, description - cap at 155
    const parts = [];
    if (listing.adType !== 'wanted') {
      const pricing = listing.pricing;
      if (pricing && pricing.length > 0 && pricing[0].amount > 0) {
        const price = pricing[0];
        let priceStr = `$${price.amount}`;
        if (price.priceType !== 'sell' && price.unit) priceStr += `/${price.unit}`;
        parts.push(priceStr);
      } else {
        parts.push('Request for quote');
      }
    }
    if (listing.address?.isNationwide) {
      parts.push('Nationwide');
    } else if (listing.address?.suburb || listing.address?.state) {
      parts.push([listing.address.suburb, listing.address.state].filter(Boolean).join(', '));
    }
    const strippedBody = stripMarkdown(listing.description);
    if (strippedBody) parts.push(strippedBody);

    let description = capDescription(parts.join('. '));
    const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) description = 'Check the listing at Desify!!';
    
    // Get OG image or fallback (skip raw images to avoid >300KB issues)
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = listing.ogImageUrl || process.env.NEXT_PUBLIC_FALLBACK_ADVERT_IMAGE_URL;
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Add cache-busting parameter using updatedAt timestamp to force WhatsApp to refresh
    if (image && listing.updatedAt) {
      const timestamp = new Date(listing.updatedAt).getTime();
      const separator = image.includes('?') ? '&' : '?';
      image = `${image}${separator}v=${timestamp}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/listings/${slug}`;
    
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: url },
      openGraph: {
        title, // No branding for WhatsApp
        description,
        url,
        siteName: META_DEFAULTS.siteName,
        images: image ? [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: listing.title || 'Listing image',
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
    console.error('Error fetching listing for meta tags:', error);
    return {
      title: 'Listing - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

// Simple not-found view (server-rendered, no redirect)
function ListingNotFound() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
      <div className="text-center">
        <p className="text-slate-700">Listing not found</p>
        <a href="/listings" className="text-sm text-teal-700 hover:text-teal-800 mt-2 inline-block">
          Browse listings
        </a>
      </div>
    </div>
  );
}

export default async function ListingSlugPage({ params }) {
  const { slug } = await params;
  const listingId = extractIdFromSlug(slug);

  if (!listingId || !API_BASE_URL) {
    return <ListingNotFound />;
  }

  // Fetch the listing on the server so its content is in the HTML (SEO).
  // Same public endpoint + revalidate as generateMetadata, so the two fetches dedupe.
  let advert = null;
  try {
    const response = await fetch(`${API_BASE_URL}/adverts/byid/${listingId}`, {
      next: { revalidate: 3600, tags: [`listing-${listingId}`] },
    });
    if (response.ok) {
      const json = await response.json();
      advert = json?.data?.advert || json?.advert || null;
    }
  } catch (error) {
    console.error('Error fetching listing:', error);
  }

  if (!advert) {
    return <ListingNotFound />;
  }

  // Structured data (LocalBusiness for services/businesses, Product for items)
  const jsonLd = buildListingJsonLd(advert, `${META_DEFAULTS.siteUrl}/listings/${slug}`);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <AdvertDetailContent advert={advert} />
    </>
  );
}