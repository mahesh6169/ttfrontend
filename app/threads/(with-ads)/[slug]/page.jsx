import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// If no backend URL is configured, we can't fetch metadata
if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_BASE_URL is not configured');
}

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const threadId = extractIdFromSlug(slug);
  
  if (!threadId || !API_BASE_URL) {
    return {
      title: 'Topic Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch thread data from public API endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_BASE_URL}/threads/public/${threadId}`, {
      next: { 
        revalidate: 3600,
        tags: [`thread-${threadId}`]
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Thread not found');
    }
    
    const data = await response.json();
    const thread = data.thread;
    
    // Generate meta tags
    const title = thread.title || 'Community Topic';
    
    // Simple call-to-action description
    const description = 'Join the conversation now!';
    
    // Get OG image or fallback (skip raw images to avoid >300KB issues)
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    let image = thread.ogImageUrl || process.env.NEXT_PUBLIC_FALLBACK_THREAD_IMAGE_URL;
    
    // Ensure image URL is absolute
    if (image && !image.startsWith('http')) {
      image = image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
    }
    
    // Add cache-busting parameter using updatedAt timestamp to force WhatsApp to refresh
    if (image && thread.updatedAt) {
      const timestamp = new Date(thread.updatedAt).getTime();
      const separator = image.includes('?') ? '&' : '?';
      image = `${image}${separator}v=${timestamp}`;
    }
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/threads/${slug}`;
    
    const metadata = {
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
    
    return metadata;
  } catch (error) {
    console.error('Error fetching thread for meta tags:', error);
    return {
      title: 'Topic - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default async function ThreadSlugPage({ params }) {
  const { slug } = await params;
  const threadId = extractIdFromSlug(slug);
  
  if (!threadId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Topic not found</p>
          <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
        </div>
        <meta httpEquiv="refresh" content="3; url=/threads" />
      </div>
    );
  }

  // Use meta refresh instead of JavaScript redirect
  // This allows crawlers to read the meta tags before following the redirect
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
      <meta httpEquiv="refresh" content={`3; url=/threads/views/${threadId}`} />
    </div>
  );
}