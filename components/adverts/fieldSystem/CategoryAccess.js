// components/advertsv2/fieldSystem/CategoryAccess.js

// This file remains mostly the same.
export const CATEGORY_ACCESS = {
  'Real Estate': ['user', 'admin'],
  'Cars & Vehicles': ['user', 'admin'],
  'Electricians': ['user', 'admin'],
  'Painters': ['user', 'admin'],
  'Plumbing & Gas': ['user', 'admin'],
  'Vehicle Repairs': ['user', 'admin'],
  'Landscaping & Gardening': ['user', 'admin'],
  'Air Conditioning & Refrigeration': ['user', 'admin'],
  'Home Repairs & Improvements': ['user', 'admin'],
  'Handyman': ['user', 'admin'],
  'Removalists & Moving': ['user', 'admin'],
  'Computer & Mobile Repairs': ['user', 'admin'],
  'Sewing & Alteration': ['user', 'admin'],
  'Real Estate & Buyers Agents': ['user', 'admin'],
  'Accounting & Taxation': ['user', 'admin'],
  'Legal & Immigration': ['user', 'admin'],
  'Restaurants & Catering': ['user', 'admin'],
  'Cakes, Sweets & Snacks': ['user', 'admin'],
  'Decoration': ['user', 'admin'],
  'Photography & Videography': ['user', 'admin'],
  'DJ & Audio Visual': ['user', 'admin'],
  'Entertainers & Performers': ['user', 'admin'],
  'Party Hires': ['user', 'admin'],
  'Cleaning & Maintenance': ['user', 'admin'],
  'Pest Control': ['user', 'admin'],
  'Beauty, Hair & Makeup': ['user', 'admin'],
  'Priest & Pooja': ['user', 'admin'],
  'Babysitting & Childcare': ['user', 'admin'],

  'Driving Instructors': ['user', 'admin'],
  'Academic Tutors': ['user', 'admin'],
  'Music Tutors': ['user', 'admin'],
  'Dance Tutors': ['user', 'admin'],
  'Arts Tutors': ['user', 'admin'],
  'Sports Tutors': ['user', 'admin'],

  'Home & Garden': ['user', 'admin'],
  'Electronics & Computers': ['user', 'admin'],
  'Baby & Children': ['user', 'admin'],
  'Health, Sport & Fitness': ['user', 'admin'],
  'Music & Games': ['user', 'admin'],
  'Fashion & Accessories': ['user', 'admin'],
  'Books, Art & Collectables': ['user', 'admin'],
  'Pets': ['user', 'admin'],

  'Jobs': ['user', 'admin'],
  'Retail Stores & Shops': ['user', 'admin'],
  'Consultation & Professional': ['user', 'admin'],
  'Financial & Insurance': ['user', 'admin'],
  'Courier & Delivery': ['user', 'admin'],
  'Taxi & Ride': ['user', 'admin'],
  'Construction & Renovation': ['user', 'admin'],
  'Marketing & Advertising': ['user', 'admin'],
  'IT & Software': ['user', 'admin'],
  'Travel & Tourism': ['user', 'admin'],
  'Matrimony': ['user', 'admin'],

  'Parents Travel Assistance': ['user', 'admin'],
  'Miscellaneous': ['user', 'admin'],

  'Overseas Goods': ['admin']
};


export const ADDRESS_OPTIONAL_CATEGORIES = [
  'Overseas Goods'
];

export function isAddressOptional(role, category) {
  return role === 'admin' && ADDRESS_OPTIONAL_CATEGORIES.includes(category);
}

export function getCategoriesForRole(role) {
  return Object.entries(CATEGORY_ACCESS)
    .filter(([category, roles]) => roles.includes(role))
    .map(([category]) => category);
}

export function canAccessCategory(role, category) {
  const allowedRoles = CATEGORY_ACCESS[category];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

// Category groups for dropdown display
export const CATEGORY_GROUPS = [
  {
    label: 'Real Estate',
    categories: [
      'Real Estate',
      'Real Estate & Buyers Agents',
    ],
  },
  {
    label: 'Items',
    categories: [
      'Cars & Vehicles',
      'Home & Garden',
      'Electronics & Computers',
      'Baby & Children',
      'Health, Sport & Fitness',
      'Music & Games',
      'Fashion & Accessories',
      'Books, Art & Collectables',
      'Pets',
    ],
  },
  {
    label: 'Services',
    categories: [
      'Electricians',
      'Painters',
      'Plumbing & Gas',
      'Vehicle Repairs',
      'Landscaping & Gardening',
      'Air Conditioning & Refrigeration',
      'Home Repairs & Improvements',
      'Handyman',
      'Removalists & Moving',
      'Computer & Mobile Repairs',
      'Sewing & Alteration',
      'Accounting & Taxation',
      'Legal & Immigration',
      'Restaurants & Catering',
      'Cakes, Sweets & Snacks',
      'Decoration',
      'Photography & Videography',
      'DJ & Audio Visual',
      'Entertainers & Performers',
      'Party Hires',
      'Cleaning & Maintenance',
      'Pest Control',
      'Beauty, Hair & Makeup',
      'Priest & Pooja',
      'Babysitting & Childcare',
      'Retail Stores & Shops',
      'Consultation & Professional',
      'Financial & Insurance',
      'Courier & Delivery',
      'Taxi & Ride',
      'Construction & Renovation',
      'Marketing & Advertising',
      'IT & Software',
      'Travel & Tourism',
    ],
  },
  {
    label: 'Tutors',
    categories: [
      'Driving Instructors',
      'Academic Tutors',
      'Music Tutors',
      'Dance Tutors',
      'Arts Tutors',
      'Sports Tutors',
    ],
  },
  {
    label: 'Other',
    categories: [
      'Jobs',
      'Matrimony',
      'Parents Travel Assistance',
      'Miscellaneous',
      'Overseas Goods',
    ],
  },
];

// Get grouped categories filtered by role
export function getGroupedCategoriesForRole(role) {
  return CATEGORY_GROUPS.map((group) => ({
    label: group.label,
    categories: group.categories.filter((cat) => {
      const allowedRoles = CATEGORY_ACCESS[cat];
      return allowedRoles ? allowedRoles.includes(role) : false;
    }),
  })).filter((group) => group.categories.length > 0);
}
