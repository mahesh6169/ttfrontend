// Australian states configuration
export const AUSTRALIAN_STATES = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' }
];

// For quick lookups
export const STATE_CODES = AUSTRALIAN_STATES.map(state => state.code);

// Helper to get state name from code
export const getStateName = (code) => {
  const state = AUSTRALIAN_STATES.find(s => s.code === code);
  return state ? state.name : code;
};