/**
 * Utility functions for handling URL slugs
 */

const MAX_SLUG_LENGTH = 50; // Maximum characters for slug portion

/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @param {number} maxLength - Maximum length for the slug (default 50)
 * @returns {string} - The URL-friendly slug
 */
export const generateSlug = (title, maxLength = MAX_SLUG_LENGTH) => {
  if (!title || typeof title !== 'string') return 'untitled';
  
  // Convert to lowercase and trim
  let slug = title.toLowerCase().trim();

  // 3-step slugify (keeps words apart instead of gluing them):
  //   1) strip apostrophes so "mum's" -> "mums" (not "mum-s")
  //   2) turn every other non-alphanumeric run into a single dash, so
  //      "fish&chips" -> "fish-chips" and "chicken/veg/mutton" -> "chicken-veg-mutton"
  //   3) trim dashes off the ends
  slug = slug
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Handle empty result after cleaning
  if (!slug) return 'untitled';
  
  // Truncate if too long, but try to break at word boundary
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    
    // Try to find last hyphen to break at word boundary
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > maxLength * 0.7) { // Only break if we're keeping at least 70% of max length
      slug = slug.substring(0, lastHyphen);
    }
    
    // Clean up any trailing hyphens from truncation
    slug = slug.replace(/-+$/, '');
  }
  
  return slug || 'untitled';
};

/**
 * Create a full slug URL combining slug and ID
 * @param {string} title - The title to convert to slug
 * @param {string} id - The item ID
 * @returns {string} - The combined slug-id format
 */
export const createSlugUrl = (title, id) => {
  if (!id) return '';
  
  const slug = generateSlug(title);
  return `${slug}-${id}`;
};

/**
 * Extract ID from a slug URL
 * @param {string} slugUrl - The slug URL (format: "slug-text-id")
 * @returns {string|null} - The extracted ID or null if invalid
 */
export const extractIdFromSlug = (slugUrl) => {
  if (!slugUrl || typeof slugUrl !== 'string') return null;
  
  // Handle case where entire param might just be an ID (backward compatibility)
  if (isValidObjectId(slugUrl)) {
    return slugUrl;
  }
  
  // Split by hyphen and get the last part (should be the ID)
  const parts = slugUrl.split('-');
  if (parts.length === 0) return null;
  
  const potentialId = parts[parts.length - 1];
  
  // Validate it looks like a MongoDB ObjectId
  if (isValidObjectId(potentialId)) {
    return potentialId;
  }
  
  return null;
};

/**
 * Build a slug URL for different content types
 * @param {string} type - The content type ('listing', 'event', 'thread')
 * @param {string} title - The item title
 * @param {string} id - The item ID
 * @returns {string} - The full slug URL path
 */
export const buildSlugUrl = (type, title, id) => {
  if (!type || !id) return '';
  
  const slugPart = createSlugUrl(title, id);
  
  switch (type) {
    case 'listing':
    case 'listings':
      return `/listings/${slugPart}`;
    case 'event':
    case 'events':
      return `/events/${slugPart}`;
    case 'thread':
    case 'threads':
      return `/threads/${slugPart}`;
    case 'deal':
    case 'dailydeals':
      return `/deals/${slugPart}`;
    default:
      return `/${type}/${slugPart}`;
  }
};

/**
 * Check if a string is a valid MongoDB ObjectId
 * @param {string} str - The string to check
 * @returns {boolean} - True if valid ObjectId format
 */
export const isValidObjectId = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(str);
};

/**
 * Build a regular view URL (non-slug) for fallback
 * @param {string} type - The content type
 * @param {string} id - The item ID
 * @returns {string} - The regular URL path
 */
export const buildRegularUrl = (type, id) => {
  if (!type || !id) return '';
  
  switch (type) {
    case 'listing':
    case 'listings':
      return `/listings/views/${id}`;
    case 'event':
    case 'events':
      return `/events/views/${id}`;
    case 'thread':
    case 'threads':
      return `/threads/views/${id}`;
    case 'deal':
    case 'dailydeals':
      return `/deals/views/${id}`;
    default:
      return `/${type}/views/${id}`;
  }
};

// For Open Graph implementation with environment variables
export const META_DEFAULTS = {
  siteName: process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify',
  defaultImage: '/desify-og-default.jpg',
  titleMaxLength: 60,
  descriptionMaxLength: 160,
  siteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au',
  defaultDescription: `Buy and sell items on ${process.env.NEXT_PUBLIC_WEBSITE_NAME || 'Desify'} - Your local marketplace`
};