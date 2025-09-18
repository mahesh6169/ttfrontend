// Category display names mapping
export const CATEGORY_DISPLAY_MAP = {
  'jobs': 'Jobs',
  'housing': 'Housing',
  'services': 'Services',
  'forsale': 'For Sale',
  'community': 'Community',
  'gigs': 'Gigs',
  'resumes': 'Resumes',
  'discussion': 'Discussion',
  // Add more mappings as needed based on actual category values from the backend
};

// Function to get display name for a category
export const getCategoryDisplayName = (category) => {
  return CATEGORY_DISPLAY_MAP[category] || category;
};