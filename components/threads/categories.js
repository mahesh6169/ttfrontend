export const threadCategoryOptions = [
  "Migration & Visas",
  "General Enquiries",
  "Health & Medical",
  "Personal Finance",
  "Legal",
  "Education & Academics",
  "Career & Employment",
  "Family & Kids",
  "Community & Cultural",
  "Devotional & Spiritual",
  "Food & Dining",
  "Travel & Adventure",
  "Lifestyle & Hobbies",
  "Real Estate & Rentals",
  "Technology & Gadgets",
];

// Categories that require community/language selection
export const COMMUNITY_THREAD_CATEGORIES = [
  "Community & Cultural",
  "Devotional & Spiritual",
];

// Check if a category needs community/language field
export function needsCommunityField(category) {
  return COMMUNITY_THREAD_CATEGORIES.includes(category);
}
