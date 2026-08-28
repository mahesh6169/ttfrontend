import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import EventDetailContent from '@/components/events/eventcomponents/EventDetailContent';
import { buildEventJsonLd } from '@/utils/helpers/events/eventJsonLd';

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
      next: { 
        revalidate: 300,
        tags: [`event-${eventId}`]
      }
    });
    
    if (!response.ok) {
      throw new Error('Event not found');
    }
    
    const data = await response.json();
    const event = data.event || data;
    
    // Row 3 (title): the platform seoTitle when set, else the organiser's event title.
    // Emitted in absolute form below so the events layout's "%s | Desify" template is
    // bypassed and no brand appears (see designguide/06-seo/events.md).
    const resolvedTitle = event.seoTitle || event.title || 'Event';

    // Row 4 (description): the platform seoDescription when set, else a one-liner built
    // ONLY from structured fields (never the free-text body, which can run thousands of
    // chars). Capped at ~155 chars (Google's snippet length).
    const MAX_DESCRIPTION = 155;
    const capDescription = (text) => {
      if (!text || text.length <= MAX_DESCRIPTION) return text || '';
      const cut = text.slice(0, MAX_DESCRIPTION);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
    };

    // M9: strip markdown markers to plain text (events use plain text, not HTML)
    const stripMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/^#+\s*/gm, '')
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        .replace(/^>\s*/gm, '')
        .replace(/^[-*]\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // M4: three-level description fallback
    let description;
    if (event.seoDescription) {
      // Level 1: explicit platform seoDescription
      description = event.seoDescription;
    } else {
      const stripped = stripMarkdown(event.description);
      const wordCount = stripped ? stripped.trim().split(/\s+/).filter(Boolean).length : 0;
      if (wordCount >= 5) {
        // Level 2: body text when present and long enough
        description = capDescription(stripped);
      } else {
        // Level 3: CTA fallback
        description = event.isPaid ? 'Get your tickets now at Desify!!' : 'Register at Desify!!';
      }
    }
    
    // Get OG image or fallback (skip raw images to avoid >300KB issues)
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = event.ogImageUrl || process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Add cache-busting parameter using updatedAt timestamp to force WhatsApp to refresh
    if (image && event.updatedAt) {
      const timestamp = new Date(event.updatedAt).getTime();
      const separator = image.includes('?') ? '&' : '?';
      image = `${image}${separator}v=${timestamp}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/events/${slug}`;
    
    return {
      // Absolute form: bypasses the layout's "%s | Desify" template, so the title
      // carries NO brand (Desify already appears in result Row 1).
      title: { absolute: resolvedTitle },
      description,
      // Canonical grouping (events-seo-canonical.md): when this event points at a hero
      // via seoCanonicalEventId, the backend resolves the hero's URL into seoCanonicalUrl;
      // use it so multi-part events consolidate onto the hero. Else self-canonical.
      alternates: { canonical: event.seoCanonicalUrl || url },
      openGraph: {
        title: resolvedTitle, // No branding for WhatsApp
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
        title: resolvedTitle,
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

// Simple not-found view (server-rendered, no redirect)
function EventNotFound() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
      <div className="text-center">
        <p className="text-slate-700">Event not found</p>
        <a href="/events" className="text-sm text-teal-700 hover:text-teal-800 mt-2 inline-block">
          Browse events
        </a>
      </div>
    </div>
  );
}

export default async function EventSlugPage({ params }) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);

  if (!eventId || !API_BASE_URL) {
    return <EventNotFound />;
  }

  // Fetch the event on the server so its content is in the HTML (SEO).
  // Same public endpoint + revalidate as generateMetadata, so the two fetches dedupe.
  // fetchEventById returns the event object directly.
  let event = null;
  try {
    const response = await fetch(`${API_BASE_URL}/events/views/${eventId}`, {
      next: { revalidate: 300, tags: [`event-${eventId}`] },
    });
    if (response.ok) {
      const json = await response.json();
      event = json?._id ? json : (json?.event || null);
    }
  } catch (error) {
    console.error('Error fetching event:', error);
  }

  if (!event) {
    return <EventNotFound />;
  }

  // Structured data — Event JSON-LD (Google rich event results)
  const jsonLd = buildEventJsonLd(event, `${META_DEFAULTS.siteUrl}/events/${slug}`);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailContent event={event} />
    </>
  );
}