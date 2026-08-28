import { extractIdFromSlug, isValidObjectId, META_DEFAULTS } from '@/utils/slugUtils';
import ThreadDetailContent from '@/components/threads/ThreadDetailContent';
import { buildThreadJsonLd } from '@/utils/helpers/threads/threadJsonLd';

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

    // M9: strip HTML tags and markdown markers to plain text
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

    // M6: question stripped of markdown, capped at 155
    const description = capDescription(stripMarkdown(thread.question));
    
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

// Simple not-found view (server-rendered, no redirect)
function ThreadNotFound() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-9rem)]">
      <div className="text-center">
        <p className="text-slate-700">Topic not found</p>
        <a href="/threads" className="text-sm text-teal-700 hover:text-teal-800 mt-2 inline-block">
          Browse threads
        </a>
      </div>
    </div>
  );
}

export default async function ThreadSlugPage({ params }) {
  const { slug } = await params;
  const threadId = extractIdFromSlug(slug);

  if (!threadId || !API_BASE_URL) {
    return <ThreadNotFound />;
  }

  // Fetch the thread on the server so its title + question are in the HTML (SEO).
  // Same public endpoint + revalidate as generateMetadata, so the two fetches dedupe.
  let thread = null;
  try {
    const response = await fetch(`${API_BASE_URL}/threads/public/${threadId}`, {
      next: { revalidate: 3600, tags: [`thread-${threadId}`] },
    });
    if (response.ok) {
      const json = await response.json();
      thread = json?.thread || null;
    }
  } catch (error) {
    console.error('Error fetching thread:', error);
  }

  if (!thread) {
    return <ThreadNotFound />;
  }

  // Structured data — DiscussionForumPosting JSON-LD (forum content)
  const jsonLd = buildThreadJsonLd(thread, `${META_DEFAULTS.siteUrl}/threads/${slug}`);

  // Seed the client detail component with the server-fetched thread; live replies
  // load client-side.
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ThreadDetailContent threadId={threadId} initialThread={thread} />
    </>
  );
}