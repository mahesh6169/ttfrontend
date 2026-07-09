// Single source of truth for the coupons store category hierarchy (parent group -> subcategory).
// A store saves BOTH: category = parent label, subcategory = leaf.
// This is a curated subset of the /deals taxonomy (dealCategories.js) — only business
// types that suit in-store QR coupon redemption — so shared labels don't drift.

export const STORE_CATEGORIES = [
  {
    label: 'Food & Dining',
    subcategories: ['Restaurants & Cafes', 'Cakes', 'Chat & Street Food', 'Sweets & Snacks'],
  },
  {
    label: 'Groceries & Shops',
    subcategories: ['Indian Groceries', 'Fruit & Veg', 'Butchers', 'Dairy'],
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
    label: 'Fitness & Sport',
    subcategories: ['Gym'],
  },
  {
    label: 'Electrical & Electronics',
    subcategories: ['Laptops & Computers'],
  },
];

// All parent group labels
export function getAllParentCategories() {
  return STORE_CATEGORIES.map((c) => c.label);
}

// Subcategories for a given parent label
export function getSubcategories(parentLabel) {
  const group = STORE_CATEGORIES.find((c) => c.label === parentLabel);
  return group ? group.subcategories : [];
}

// Flat list of every subcategory across all groups
export function getAllSubcategories() {
  return STORE_CATEGORIES.flatMap((c) => c.subcategories);
}

// Reverse lookup: given a subcategory, return its parent label (or null)
export function getParentForSubcategory(subcategory) {
  for (const group of STORE_CATEGORIES) {
    if (group.subcategories.includes(subcategory)) {
      return group.label;
    }
  }
  return null;
}
