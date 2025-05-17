// components/advertsv2/fieldSystem/CategoryAccess.js

export const CATEGORY_ACCESS = {
  'Electronics & Computers': ['user', 'admin'],
  'Real Estate': ['user', 'admin'],
  'Cars & Vehicles': ['user', 'admin'],
  'Jobs': ['user', 'admin'],
  'Overseas Goods': ['admin']
};


export const ADDRESS_OPTIONAL_CATEGORIES = [
  'Overseas Goods'
  // Add more categories here in the future without changing implementation code
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
