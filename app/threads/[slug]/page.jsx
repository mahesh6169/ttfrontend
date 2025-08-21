import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_BACKEND_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
  const threadId = extractIdFromSlug(slug);
  
  if (!threadId || !API_BASE_URL) {
    return {
      title: 'Topic Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch thread data from API
    const response = await fetch(`${API_BASE_URL}/api/threads/${threadId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Thread not found');
    }
    
    const data = await response.json();
    const thread = data.thread || data;
    
    // Generate meta tags
    const title = thread.title || 'Community Topic';
    const description = thread.question 
      ? thread.question.substring(0, 80) 
      : 'Join the community discussion';
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    // const image = thread.images?.[0]?.url || `${siteUrl}${META_DEFAULTS.defaultImage}`;
    let image = thread.images?.[0]?.url || null; // Comment out default image for now
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/threads/${slug}`;
    
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
            alt: thread.title || 'Topic image',
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
    console.error('Error fetching thread for meta tags:', error);
    return {
      title: 'Topic - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default async function ThreadSlugPage({ params }) {
  const { slug } = params;
  const threadId = extractIdFromSlug(slug);
  
  if (!threadId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Topic not found</p>
        <meta httpEquiv="refresh" content="3; url=/threads" />
      </div>
    );
  }
  
  // Use meta refresh instead of JavaScript redirect
  // This allows crawlers to read the meta tags before following the redirect
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>Loading topic...</p>
      <meta httpEquiv="refresh" content={`3; url=/threads/views/${threadId}`} />
    </div>
  );
}