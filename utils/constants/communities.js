// Community/Language constants used across the application

export const COMMUNITIES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' }
];

// For validation purposes
export const COMMUNITY_VALUES = COMMUNITIES.map(c => c.value);

export default COMMUNITIES;