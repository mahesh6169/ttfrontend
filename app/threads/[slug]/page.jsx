import { redirect } from 'next/navigation';
import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Generate Open Graph meta tags for social media previews
export async function generateMetadata({ params }) {
  const { slug } = params;
  const threadId = extractIdFromSlug(slug);
  
  if (!threadId) {
    return {
      title: 'Topic Not Found - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
  
  try {
    // Fetch thread data from API
    const response = await fetch(`${API_BASE_URL}/threads/${threadId}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Thread not found');
    }
    
    const data = await response.json();
    const thread = data.thread || data;
    
    // Generate meta tags
    const title = thread.title ? `${thread.title} - Desify Community` : 'Topic - Desify';
    const description = thread.question 
      ? thread.question.substring(0, META_DEFAULTS.descriptionMaxLength) 
      : META_DEFAULTS.defaultDescription;
    
    // Get first image or use default
    const siteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || META_DEFAULTS.siteUrl;
    const image = thread.images?.[0]?.url || `${siteUrl}${META_DEFAULTS.defaultImage}`;
    
    // Build the canonical URL
    const url = `${META_DEFAULTS.siteUrl}/threads/${slug}`;
    
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
            alt: thread.title || 'Topic image',
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
    console.error('Error fetching thread for meta tags:', error);
    return {
      title: 'Topic - Desify',
      description: META_DEFAULTS.defaultDescription,
    };
  }
}

export default function ThreadSlugPage({ params }) {
  const { slug } = params;
  
  // Extract ID from the slug
  const threadId = extractIdFromSlug(slug);
  
  // If we couldn't extract a valid ID, redirect to threads page
  if (!threadId) {
    redirect('/threads');
  }
  
  // Redirect to the actual view page
  redirect(`/threads/views/${threadId}`);
}