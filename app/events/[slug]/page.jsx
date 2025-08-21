import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
  const eventId = extractIdFromSlug(slug);
  
  if (!eventId || !API_BASE_URL) {
    return {
      title: 'Event Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch event data from API
    const response = await fetch(`${API_BASE_URL}/api/events/views/${eventId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Event not found');
    }
    
    const data = await response.json();
    const event = data.event || data;
    
    // Generate meta tags
    const title = event.title ? `${event.title} - Desify Events` : 'Event - Desify';
    
    // Build description with event details
    let description = event.description || '';
    if (event.dateTime) {
      const eventDate = format(new Date(event.dateTime), 'EEE dd MMM yyyy');
      description = `${eventDate} - ${description}`;
    }
    description = description.substring(0, META_DEFAULTS.descriptionMaxLength) || META_DEFAULTS.defaultDescription;
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    // const image = event.images?.[0]?.url || `${siteUrl}${META_DEFAULTS.defaultImage}`;
    let image = event.images?.[0]?.url || null; // Comment out default image for now
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/events/${slug}`;
    
    return {
      title,
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
            alt: event.title || 'Event image',
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
    console.error('Error fetching event for meta tags:', error);
    return {
      title: 'Event - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default async function EventSlugPage({ params }) {
  const { slug } = params;
  const eventId = extractIdFromSlug(slug);
  
  if (!eventId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Event not found</p>
        <meta httpEquiv="refresh" content="3; url=/events" />
      </div>
    );
  }
  
  // Use meta refresh instead of JavaScript redirect
  // This allows crawlers to read the meta tags before following the redirect
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Loading event...</p>
      <meta httpEquiv="refresh" content={`3; url=/events/views/${eventId}`} />
    </div>
  );
}