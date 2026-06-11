// components/dailydeals/dealCategories.js
// Single source of truth for the deals category hierarchy (parent group -> subcategory).
// A partner store saves BOTH: category = parent label, subcategory = leaf.
// Subcategory labels reuse /listings (Categories.js) where they exist, so taxonomies don't drift.

export const DEAL_CATEGORIES = [
  {
    label: 'Food & Dining',
    subcategories: ['Restaurants', 'Catering', 'Cakes', 'Sweets & Snacks', 'Chat & Street Food'],
  },
  {
    label: 'Fashion',
    subcategories: ['Clothing & Ethnic Wear', 'Jewellery & Accessories'],
  },
  {
    label: 'Beauty & Wellness',
    subcategories: ['Hair, Makeup & Waxing', 'Massage', 'Yoga'],
  },
  {
    label: 'Health & Medical',
    subcategories: ['Dental', 'Physiotherapy', 'Optometry', 'Pharmacy'],
  },
  {
    label: 'Fitness & Sport',
    subcategories: ['Gym', 'Personal Training', 'Coaching'],
  },
  {
    label: 'Electrical & Electronics',
    subcategories: ['Air Conditioners', 'Solar Panels', 'Laptops & Computers'],
  },
  {
    label: 'Home Services',
    subcategories: ['Landscaping & Gardening', 'Air Conditioning & Refrigeration', 'Cleaning & Maintenance', 'Pest Control'],
  },
  {
    label: 'Vehicle Services',
    subcategories: ['Car Servicing & Repairs'],
  },
  {
    label: 'Real Estate',
    subcategories: ['Real Estate & Buyers Agents', 'Mortgage Brokers'],
  },
  {
    label: 'Party & Entertainment',
    subcategories: ['Decorations', 'Photography & Videography', 'DJ & Audio Visual', 'Entertainers & Performers', 'Party Hire'],
  },
  {
    label: 'Tutoring & Lessons',
    subcategories: ['Driving Lessons', 'Academic Tutoring', 'Music Lessons', 'Dance Lessons', 'Art Classes'],
  },
  {
    label: 'Professional & Business Services',
    subcategories: ['Accounting & Taxation', 'Legal & Immigration', 'Finance', 'Insurance'],
  },
  {
    label: 'Groceries',
    subcategories: ['Indian Groceries', 'Fruit & Veg', 'Dairy'],
  },
  {
    label: 'Travel & Tourism',
    subcategories: ['Tour Guides & Operators', 'Travel Agents'],
  },
];

// All parent group labels
export function getAllParentCategories() {
  return DEAL_CATEGORIES.map((c) => c.label);
}

// Subcategories for a given parent label
export function getSubcategories(parentLabel) {
  const group = DEAL_CATEGORIES.find((c) => c.label === parentLabel);
  return group ? group.subcategories : [];
}

// Flat list of every subcategory across all groups
export function getAllSubcategories() {
  return DEAL_CATEGORIES.flatMap((c) => c.subcategories);
}

// Reverse lookup: given a subcategory, return its parent label (or null)
export function getParentForSubcategory(subcategory) {
  for (const group of DEAL_CATEGORIES) {
    if (group.subcategories.includes(subcategory)) {
      return group.label;
    }
  }
  return null;
}

// Validate a parent + subcategory combination
export function isValidCategoryCombo(parentLabel, subcategory) {
  return getSubcategories(parentLabel).includes(subcategory);
}
