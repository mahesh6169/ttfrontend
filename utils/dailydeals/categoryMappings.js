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

// Keys are taxonomy values (parent labels or subcategory labels) from
// components/dailydeals/dealCategories.js. Search matches either field.
const CATEGORY_MAPPINGS = {
  // Food & Dining
  'Restaurants': ['restaurants', 'restaurant', 'food', 'dining'],
  'Catering': ['catering', 'caterer'],
  'Cakes': ['cake', 'cupcakes', 'macarons', 'donuts', 'cookies'],
  'Sweets & Snacks': ['sweets', 'snacks', 'pani', 'puri', 'samosa'],
  'Chat & Street Food': ['chat', 'chaat'],

  // Fashion
  'Clothing & Ethnic Wear': ['clothing', 'clothes', 'saree', 'sari', 'ethnic', 'kurta', 'lehenga'],
  'Jewellery & Accessories': ['jewellery', 'jewelry', 'jewel', 'gold', 'accessories'],

  // Beauty & Wellness
  'Hair, Makeup & Waxing': [
    'threading', 'tinting', 'facial', 'makeup', 'make-up',
    'hair', 'waxing', 'skin', 'bleach', 'manicure', 'pedicure'
  ],
  'Massage': ['massage', 'spa'],
  'Yoga': ['yoga'],

  // Health & Medical
  'Dental': ['dental', 'dentist', 'teeth'],
  'Physiotherapy': ['physio', 'physiotherapy'],
  'Optometry': ['optometry', 'optometrist', 'glasses'],
  'Pharmacy': ['pharmacy', 'chemist', 'medicine'],

  // Fitness & Sport
  'Gym': ['gym', 'fitness', 'workout'],
  'Personal Training': ['trainer', 'pt'],
  'Coaching': ['coaching', 'coach'],

  // Electrical & Electronics
  'Air Conditioners': ['aircon', 'ac', 'cooling'],
  'Solar Panels': ['solar'],
  'Laptops & Computers': ['laptop', 'laptops', 'computer', 'computers', 'pc'],

  // Home Services
  'Landscaping & Gardening': ['landscaping', 'gardening', 'garden', 'lawn'],
  'Cleaning & Maintenance': ['cleaning', 'cleaner', 'maintenance'],
  'Pest Control': ['pest'],

  // Vehicle Services
  'Car Servicing & Repairs': ['mechanic'],

  // Real Estate
  'Real Estate & Buyers Agents': ['property', 'realestate'],
  'Mortgage Brokers': ['mortgage', 'broker'],

  // Party & Entertainment
  'Decorations': ['decoration', 'decorations', 'decor'],
  'Photography & Videography': ['photography', 'photographer', 'videography'],
  'DJ & Audio Visual': ['dj'],
  'Entertainers & Performers': ['entertainer', 'performer', 'entertainment'],
  'Party Hire': ['party'],

  // Tutoring & Lessons
  'Academic Tutoring': ['tutor', 'tutoring', 'academic', 'maths', 'english'],
  'Music Lessons': ['music', 'singing', 'guitar', 'piano'],
  'Dance Lessons': ['dance', 'dancing'],
  'Art Classes': ['art', 'painting'],
  'Driving Lessons': ['driving'],

  // Professional & Business Services
  'Accounting & Taxation': ['accounting', 'accountant', 'tax', 'taxation'],
  'Legal & Immigration': ['legal', 'lawyer', 'immigration', 'visa', 'migration'],
  'Finance': ['finance', 'financial'],
  'Insurance': ['insurance'],

  // Groceries
  'Indian Groceries': ['groceries', 'grocery'],
  'Fruit & Veg': ['fruit', 'vegetables', 'produce'],
  'Dairy': ['dairy', 'milk'],

  // Travel & Tourism
  'Tour Guides & Operators': ['tour', 'tours'],
  'Travel Agents': ['travel', 'flights', 'holiday'],
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
