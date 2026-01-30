/**
 * Category Mappings for Daily Deals Search
 * Used for autocomplete suggestions and backend search
 *
 * Add new terms as you learn what users search for
 */

// Suggested terms shown when search returns no results
export const SUGGESTED_SEARCH_TERMS = [
  'restaurants',
  'facial',
  'groceries',
  'cake',
  'catering'
];

const CATEGORY_MAPPINGS = {
  'Restaurants': [
    'restaurants', 'restaurant', 'food', 'dining'
  ],

  'Catering': [
    'catering', 'caterer'
  ],

  'Cakes': [
    'cake', 'cupcakes', 'macarons', 'donuts', 'cookies'
  ],

  'Sweets & Snacks': [
    'sweets', 'snacks', 'pani', 'puri', 'samosa'
  ],

  'Chat & Street Food': [
    'chat', 'chaat', 'street food'
  ],

  'Hair, Makeup & Waxing': [
    'threading', 'tinting', 'facial', 'makeup', 'make-up',
    'hair', 'waxing', 'skin', 'bleach',
    'manicure', 'pedicure'
  ],

  'Massage': [
    'massage', 'spa'
  ],

  'Yoga': [
    'yoga'
  ],

  'Retail Stores & Shops': [
    'groceries', 'grocery', 'store', 'shop'
  ],
};

/**
 * Get all search terms for autocomplete
 * @returns {string[]} - All terms from all categories
 */
export const getAllSearchTerms = () => {
  const allTerms = [];
  for (const terms of Object.values(CATEGORY_MAPPINGS)) {
    allTerms.push(...terms);
  }
  return allTerms;
};

/**
 * Get autocomplete suggestions based on user input
 * @param {string} input - User's partial input
 * @param {number} limit - Max suggestions to return
 * @returns {string[]} - Matching suggestions
 */
export const getAutocompleteSuggestions = (input, limit = 8) => {
  if (!input || input.length < 3) return [];

  const searchTerm = input.toLowerCase().trim();
  const allTerms = getAllSearchTerms();

  // Find terms that start with or contain the input
  const startsWithMatches = [];
  const containsMatches = [];

  for (const term of allTerms) {
    if (term.startsWith(searchTerm)) {
      startsWithMatches.push(term);
    } else if (term.includes(searchTerm)) {
      containsMatches.push(term);
    }
  }

  // Prioritize "starts with" matches, then "contains" matches
  return [...startsWithMatches, ...containsMatches].slice(0, limit);
};

/**
 * Get category for a term (for display purposes)
 * @param {string} term - Search term
 * @returns {string|null} - Category name or null
 */
export const getCategoryForTerm = (term) => {
  const searchTerm = term.toLowerCase().trim();
  for (const [category, terms] of Object.entries(CATEGORY_MAPPINGS)) {
    if (terms.includes(searchTerm)) {
      return category;
    }
  }
  return null;
};

export default CATEGORY_MAPPINGS;
