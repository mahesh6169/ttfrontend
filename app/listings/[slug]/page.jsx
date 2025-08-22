import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import { headers } from 'next/headers';
import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
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
      next: { revalidate: 3600 }, // Cache for 1 hour
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
    
    // Build structured description with price and location
    let description = '';
    
    // Add price or "Request for quote"
    if (listing.pricing && listing.pricing.length > 0 && listing.pricing[0].amount > 0) {
      const price = listing.pricing[0];
      description = `$${price.amount}`;
      if (price.unit && price.unit !== 'item') {
        description += `/${price.unit}`;
      }
    } else {
      description = 'Request for quote';
    }
    
    // Add location (suburb, state)
    if (listing.address?.suburb && listing.address?.state) {
      description += ` • ${listing.address.suburb}, ${listing.address.state}`;
    }
    
    // Ensure it fits within 80 chars
    if (description.length > 80) {
      description = description.substring(0, 77) + '...';
    }
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = listing.images?.[0]?.url;
    
    // Check if it's the "No_image" placeholder and replace with branded image
    if (!image || image.includes('No_image')) {
      image = `${siteUrl}${META_DEFAULTS.defaultImage}`;
    }
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/listings/${slug}`;
    
    return {
      title: `${title} - ${META_DEFAULTS.siteName}`,
      description,
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

export default async function ListingSlugPage({ params }) {
  const { slug } = params;
  const listingId = extractIdFromSlug(slug);
  
  if (!listingId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Listing not found</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
        </div>
        {/* <meta httpEquiv="refresh" content="3; url=/listings" /> */}
        <meta httpEquiv="refresh" content="0; url=/listings" />
      </div>
    );
  }
  
  // Use meta refresh instead of JavaScript redirect
  // This allows crawlers to read the meta tags before following the redirect
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
      {/* <meta httpEquiv="refresh" content={`3; url=/listings/views/${listingId}`} /> */}
      <meta httpEquiv="refresh" content={`0; url=/listings/views/${listingId}`} />
    </div>
  );
}