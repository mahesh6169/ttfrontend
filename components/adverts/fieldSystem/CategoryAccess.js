// components/advertsv2/fieldSystem/CategoryAccess.js

// This file remains mostly the same.
export const CATEGORY_ACCESS = {
  'Real Estate': ['user', 'admin'],
  'Cars & Vehicles': ['user', 'admin'],
  'Electricians': ['user', 'admin'],
  'Painters': ['user', 'admin'],
  'Plumbing & Gas Services': ['user', 'admin'],
  'Vehicle Repairs & Services': ['user', 'admin'],
  'Landscaping & Gardening Services': ['user', 'admin'],
  'Air Conditioning & Refrigeration Services': ['user', 'admin'],
  'Home Repairs & Improvements': ['user', 'admin'],
  'Handyman Services': ['user', 'admin'],
  'Removalists & Moving Services': ['user', 'admin'],
  'Computer & Mobile Repairs': ['user', 'admin'],
  'Sewing & Alteration Services': ['user', 'admin'],
  'Real Estate & Buyers Agents': ['user', 'admin'],
  'Accounting & Taxation Services': ['user', 'admin'],
  'Legal & Immigration Services': ['user', 'admin'],
  'Restaurants & Catering Services': ['user', 'admin'],
  'Cakes, Sweets & Snacks': ['user', 'admin'],
  'Decoration Services': ['user', 'admin'],
  'Photography & Videography Services': ['user', 'admin'],
  'DJ & Audio Visual Services': ['user', 'admin'],
  'Entertainers & Performers': ['user', 'admin'],
  'Party Hires & Services': ['user', 'admin'],
  'Cleaning & Maintenance Services': ['user', 'admin'],
  'Pest Control Services': ['user', 'admin'],
  'Beauty, Hair & Makeup Services': ['user', 'admin'],
  'Priest & Pooja Services': ['user', 'admin'],
  'Babysitting & Childcare Services': ['user', 'admin'],
  
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
  'Consultation & Professional Services': ['user', 'admin'],
  'Financial & Insurance Services': ['user', 'admin'],
  'Courier & Delivery Services': ['user', 'admin'],
  'Taxi & Ride Services': ['user', 'admin'],
  'Construction & Renovation Services': ['user', 'admin'],
  'Marketing & Advertising Services': ['user', 'admin'],
  'IT & Software Services': ['user', 'admin'],
  'Travel & Tourism Services': ['user', 'admin'],
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