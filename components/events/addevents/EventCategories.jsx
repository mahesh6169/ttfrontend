export const CATEGORY_OPTIONS = [
  "Festivals & Cultural",
  "Devotional & Spiritual",
  "Music & Concerts",
  "Expos & Exhibitions",
  "Charity & Fundraisers",
  "Community & Social",
  "Sports & Fitness",
  "Seminars & Workshops",
];

// Categories that require community/language selection
export const COMMUNITY_EVENT_CATEGORIES = [
  "Festivals & Cultural",
  "Devotional & Spiritual",
  "Community & Social",
  "Music & Concerts",
];

// Check if a category needs community/language field
export function needsCommunityField(category) {
  return COMMUNITY_EVENT_CATEGORIES.includes(category);
}
