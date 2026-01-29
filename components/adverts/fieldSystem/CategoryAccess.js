// components/advertsv2/fieldSystem/CategoryAccess.js

export const ADDRESS_OPTIONAL_CATEGORIES = [
  'Overseas Goods'
];

export function isAddressOptional(category) {
  return ADDRESS_OPTIONAL_CATEGORIES.includes(category);
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

// Get all categories as a flat list
export function getAllCategories() {
  return CATEGORY_GROUPS.flatMap((group) => group.categories);
}
