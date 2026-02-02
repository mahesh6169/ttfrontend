// components/adverts/fieldSystem/Categories.js
// Single source of truth for category hierarchy

export const CATEGORIES = [
  {
    label: 'Real Estate',
    subcategories: [
      'Sell, Rent & Share',
      'Real Estate & Buyers Agents',
    ],
  },
  {
    label: 'Buy & Sell',
    subcategories: [
      'Cars & Vehicles',
      'Home & Garden',
      'Electronics & Computers',
      'Baby & Kids',
      'Health, Sport & Fitness',
      'Music & Games',
      'Fashion & Accessories',
      'Books, Art & Collectables',
      'Pet Supplies',
    ],
  },
  {
    label: 'Home & Vehicle Services',
    subcategories: [
      'Electricians',
      'Painters',
      'Plumbing & Gas',
      'Vehicle Repairs',
      'Landscaping & Gardening',
      'Air Conditioning & Refrigeration',
      'Home Repairs & Improvements',
      'Cabinet Makers',
      'Handyman & Flatpacks',
      'Removalists & Moving',
      'Sewing & Alteration',
      'Cleaning & Maintenance',
      'Pest Control',
    ],
  },
  {
    label: 'Transport & Logistics',
    subcategories: [
      'Courier & Delivery',
      'Taxi & Ride',
    ],
  },
  {
    label: 'Digital & IT Services',
    subcategories: [
      'Computer & Mobile Repairs',
      'Business IT',
      'Website Design',
    ],
  },
  {
    label: 'Professional & Business Services',
    subcategories: [
      'Accounting & Taxation',
      'Legal & Immigration',
      'Financial & Insurance',
    ],
  },
  {
    label: 'Marketing & Advertising',
    subcategories: [
      'Logo Services',
    ],
  },
  {
    label: 'Beauty & Wellness',
    subcategories: [
      'Hair, Makeup & Waxing',
      'Massage',
      'Yoga',
    ],
  },
  {
    label: 'Household Services & Care',
    subcategories: [
      'Babysitting',
      'Aged Parent Care',
      'Domestic Help',
    ],
  },
  {
    label: 'Food & Hospitality',
    subcategories: [
      'Restaurants',
      'Catering',
      'Cakes',
      'Chat & Street Food',
      'Sweets & Snacks',
    ],
  },
  {
    label: 'Events & Entertainment',
    subcategories: [
      'Decoration',
      'Photography & Videography',
      'DJ & Audio Visual',
      'Entertainers & Performers',
      'Party Hires',
    ],
  },
  {
    label: 'Retail & Local Businesses',
    subcategories: [
      'Retail Stores & Shops',
    ],
  },
  {
    label: 'Travel',
    subcategories: [
      'Travel & Tourism',
    ],
  },
  {
    label: 'Tutors',
    subcategories: [
      'Driving Lessons',
      'Academic',
      'Music',
      'Dance',
      'Arts',
      'Sports',
    ],
  },
  {
    label: 'Employment',
    subcategories: [
      'Full Time',
      'Casual',
      'Part Time',
    ],
  },
  {
    label: 'Cultural & Community',
    subcategories: [
      'Matrimony',
      'Priest & Pooja',
    ],
  },
];

// Subcategories that are items/listings, not services
// Used to determine if "Notify me" checkbox should appear (Step 3)
const NON_SERVICE_SUBCATEGORIES = [
  // Buy & Sell (all items)
  'Cars & Vehicles',
  'Home & Garden',
  'Electronics & Computers',
  'Baby & Kids',
  'Health, Sport & Fitness',
  'Music & Games',
  'Fashion & Accessories',
  'Books, Art & Collectables',
  'Pet Supplies',
  // Real Estate (property listings)
  'Sell, Rent & Share',
  // Employment (job listings)
  'Full Time',
  'Casual',
  'Part Time',
  // Food & Hospitality (fixed location - customers come to them)
  'Restaurants',
];

// Get all parent category names
export function getAllParentCategories() {
  return CATEGORIES.map((cat) => cat.label);
}

// Get subcategories for a given parent category
export function getSubcategories(parentCategory) {
  const category = CATEGORIES.find((cat) => cat.label === parentCategory);
  return category ? category.subcategories : [];
}

// Get all subcategories as a flat list
export function getAllSubcategories() {
  return CATEGORIES.flatMap((cat) => cat.subcategories);
}

// Reverse lookup: given a subcategory, find its parent category
export function getParentForSubcategory(subcategory) {
  for (const cat of CATEGORIES) {
    if (cat.subcategories.includes(subcategory)) {
      return cat.label;
    }
  }
  return null;
}

// Check if a subcategory represents a service (vs items/listings)
export function isServiceSubcategory(subcategory) {
  return !NON_SERVICE_SUBCATEGORIES.includes(subcategory);
}

// Check if a category + subcategory combo is valid
export function isValidCategoryCombo(category, subcategory) {
  const validSubcategories = getSubcategories(category);
  return validSubcategories.includes(subcategory);
}

// Subcategories that need Community/Language field
const COMMUNITY_SUBCATEGORIES = [
  'Matrimony',
  'Priest & Pooja',
];

// Check if a subcategory needs community/language field
export function needsCommunityField(subcategory) {
  return COMMUNITY_SUBCATEGORIES.includes(subcategory);
}

// Export arrays for reference
export { NON_SERVICE_SUBCATEGORIES, COMMUNITY_SUBCATEGORIES };
