import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  
  if (!eventId || !API_BASE_URL) {
    return {
      title: 'Event Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch event data from API
    const response = await fetch(`${API_BASE_URL}/events/views/${eventId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Event not found');
    }
    
    const data = await response.json();
    const event = data.event || data;
    
    // Generate meta tags
    const title = event.title || 'Event';
    
    // Build description with event details and call-to-action
    let description = '';
    
    // Add date if available
    if (event.dateTime) {
      const eventDate = format(new Date(event.dateTime), 'dd MMM');
      description = `${eventDate}`;
    }
    
    // Add venue if available
    if (event.venue) {
      description += description ? ` - ${event.venue}. ` : `${event.venue}. `;
    } else if (description) {
      description += ' - ';
    }
    
    // Add call-to-action based on event type
    const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify';
    if (event.isPaid) {
      description += `Don't wait—get your ticket now at ${siteName}!`;
    } else if (event.isAdvertiseOnly) {
      description += `Learn more at ${siteName}!`;
    } else {
      description += `Don't wait—RSVP now at ${siteName}!`;
    }
    
    // Ensure it fits within 80 chars
    if (description.length > 80) {
      // If too long, use shorter version without venue
      if (event.dateTime) {
        const eventDate = format(new Date(event.dateTime), 'dd MMM');
        description = event.isPaid 
          ? `${eventDate} - Get your ticket at ${siteName}!`
          : event.isAdvertiseOnly
          ? `${eventDate} - Learn more at ${siteName}!`
          : `${eventDate} - RSVP now at ${siteName}!`;
      } else {
        // No date available, just call-to-action
        description = event.isPaid 
          ? `Get your ticket now at ${siteName}!`
          : event.isAdvertiseOnly
          ? `Learn more at ${siteName}!`
          : `RSVP now at ${siteName}!`;
      }
    }
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = event.images?.[0]?.url;
    
    // Check if it's the "No_image" placeholder and replace with branded image
    if (!image || image.includes('No_image')) {
      image = `${siteUrl}${META_DEFAULTS.defaultImage}`;
    }
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/events/${slug}`;
    
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
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  
  if (!eventId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
        </div>
        {/* <meta httpEquiv="refresh" content="3; url=/events" /> */}
        <meta httpEquiv="refresh" content="0; url=/events" />
      </div>
    );
  }
  
  // Use meta refresh instead of JavaScript redirect
  // This allows crawlers to read the meta tags before following the redirect
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
      {/* <meta httpEquiv="refresh" content={`3; url=/events/views/${eventId}`} /> */}
      <meta httpEquiv="refresh" content={`0; url=/events/views/${eventId}`} />
    </div>
  );
}