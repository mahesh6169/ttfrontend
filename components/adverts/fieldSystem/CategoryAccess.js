// components/advertsv2/fieldSystem/CategoryAccess.js

// This file remains mostly the same
export const CATEGORY_ACCESS = {
  'Books, Art & Collectables': ['user', 'admin'],
  'Baby & Children': ['user', 'admin'],
  'Music & Games': ['user', 'admin'],
  'Cars & Vehicles': ['user', 'admin'],
  'Fashion & Accessories': ['user', 'admin'],
  'Health, Sport & Fitness': ['user', 'admin'],
  'Home & Garden': ['user', 'admin'],
  'Electronics & Computers': ['user', 'admin'],
  'Miscellaneous': ['user', 'admin'],
  'Pets': ['user', 'admin'],
  'Real Estate': ['user', 'admin'],

  'Arts, Dance & Cultural Tutors': ['user', 'admin'],
  'Academic Tutors & Education': ['user', 'admin'],
  'Food & Catering Services': ['user', 'admin'],
  'Home Repairs & Improvements': ['user', 'admin'],
  'Party Hires & Services': ['user', 'admin'],
  'Jobs': ['user', 'admin'],
  'Business & Professional Services': ['user', 'admin'],
  'Retail Shops & Stores': ['user', 'admin'],
  'Transport & Ride Services': ['user', 'admin'],
  'Legal & Immigration Services': ['user', 'admin'],
  'Financial & Insurance Services': ['user', 'admin'],
  'Travel & Tourism Services': ['user', 'admin'],
  'Cleaning & Maintenance Services': ['user', 'admin'],
  'Construction & Renovation Services': ['user', 'admin'],
  'Marketing & Advertising Services': ['user', 'admin'],
  'IT & Software Services': ['user', 'admin'],
  'Travel Partner': ['user', 'admin'],

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