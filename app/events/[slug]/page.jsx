import { redirect } from 'next/navigation';
import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
  const eventId = extractIdFromSlug(slug);
  
  if (!eventId) {
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
    const image = event.images?.[0]?.url || `${siteUrl}${META_DEFAULTS.defaultImage}`;
    
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
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: event.title || 'Event image',
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
    console.error('Error fetching event for meta tags:', error);
    return {
      title: 'Event - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default function EventSlugPage({ params }) {
  const { slug } = params;
  
  // Extract ID from the slug
  const eventId = extractIdFromSlug(slug);
  
  // If we couldn't extract a valid ID, redirect to events page
  if (!eventId) {
    redirect('/events');
  }
  
  // Redirect to the actual view page
  redirect(`/events/views/${eventId}`);
}