// Feature 1012: 18 categories, the same list on the user and admin pages. Must match
// ttbackendflyio utils/constants/threadCategories.js. ("Health & Medical" was renamed
// "Health & Wellbeing"; older threads keep the old name.)
export const threadCategoryOptions = [
  "Migration & Visas",
  "General Enquiries",
  "Health & Wellbeing",
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
  "Politics & Current Affairs",
  "Coming Soon & New Openings",
  "Arts & Entertainment",
];

// Categories that require community/language selection
export const COMMUNITY_THREAD_CATEGORIES = [
  "Community & Cultural",
  "Devotional & Spiritual",
  "Arts & Entertainment",
];

// Check if a category needs community/language field
export function needsCommunityField(category) {
  return COMMUNITY_THREAD_CATEGORIES.includes(category);
}
