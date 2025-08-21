import { redirect } from 'next/navigation';
import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
  const listingId = extractIdFromSlug(slug);
  
  if (!listingId) {
    return {
      title: 'Listing Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch listing data from API
    const response = await fetch(`${API_BASE_URL}/adverts/${listingId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Listing not found');
    }
    
    const data = await response.json();
    const listing = data.advert || data;
    
    // Generate meta tags
    const title = listing.title ? `${listing.title} - Desify` : 'Listing - Desify';
    const description = listing.description 
      ? listing.description.substring(0, META_DEFAULTS.descriptionMaxLength) 
      : META_DEFAULTS.defaultDescription;
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    const image = listing.images?.[0]?.url || `${siteUrl}${META_DEFAULTS.defaultImage}`;
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/listings/${slug}`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: META_DEFAULTS.siteName,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: listing.title || 'Listing image',
          }
        ],
        locale: 'en_AU',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
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

export default function ListingSlugPage({ params }) {
  const { slug } = params;
  
  // Extract ID from the slug
  const listingId = extractIdFromSlug(slug);
  
  // If we couldn't extract a valid ID, redirect to listings page
  if (!listingId) {
    redirect('/listings');
  }
  
  // Redirect to the actual view page
  redirect(`/listings/views/${listingId}`);
}