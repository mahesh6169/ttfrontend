// components/adverts/fieldSystem/WantedFieldsConfig.js

export const WANTED_FIELDS_CONFIG = {
  'Real Estate': {
    hiddenSections: ['pricingSection'],
    hiddenFields: [],
    optionalFields: ['bedrooms', 'parking']
  },
  
  'Cars & Vehicles': {
    hiddenSections: ['pricingSection'],
    hiddenFields: ['mileage', 'year'],
    optionalFields: ['make', 'model', 'fuelType', 'transmission']
  },
  
  'Jobs': {
    hiddenSections: [],
    hiddenFields: [],
    optionalFields: ['jobTitle']
  },
  
  'Books, Art & Collectables': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: []
  },
  
  'Miscellaneous': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: []
  },
  
  'Baby & Children': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Music & Games': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Fashion & Accessories': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Health, Sport & Fitness': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Home & Garden': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Pets': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Electronics & Computers': {
    hiddenSections: ['pricingSection', 'conditionSection'],
    hiddenFields: [],
    optionalFields: ['brand', 'model']
  },
  
  'Overseas Goods': {
    hiddenSections: [],
    hiddenFields: [],
    optionalFields: ['deliveryTime']
  },
  
  // Service categories - hide serviceArea for wanted ads
  'Transport & Ride Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Home Repairs & Improvements': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Vehicle Repairs & Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Electricians': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Plumbing & Gas Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Landscaping & Gardening Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Computer & Mobile Repairs': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Handyman Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Accounting & Taxation Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Real Estate & Buyers Agents': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Restaurants & Catering Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Party Hires & Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Cleaning & Maintenance Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Priest & Pooja Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Retail Stores & Shops': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Legal & Immigration Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Financial & Insurance Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Driving Instructors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },

  'Academic Tutors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Music Tutors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Dance Tutors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Arts Tutors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Sports Tutors': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Consultation & Professional Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Construction & Renovation Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Travel & Tourism Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Marketing & Advertising Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'IT & Software Services': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  },
  
  'Parents Travel Assistance': {
    hiddenSections: [],
    hiddenFields: ['serviceArea'],
    optionalFields: []
  }
};

// Get wanted configuration for a category
export const getWantedConfig = (category) => {
  return WANTED_FIELDS_CONFIG[category] || {
    hiddenSections: [],
    hiddenFields: [],
    optionalFields: []
  };
};

// Check if a section should be hidden for wanted ads
export const isSectionHiddenForWanted = (category, sectionId) => {
  const config = getWantedConfig(category);
  return config.hiddenSections.includes(sectionId);
};

// Check if a field should be hidden for wanted ads
export const isFieldHiddenForWanted = (category, fieldId) => {
  const config = getWantedConfig(category);
  return config.hiddenFields.includes(fieldId);
};

// Check if a field should be optional for wanted ads
export const isFieldOptionalForWanted = (category, fieldId) => {
  const config = getWantedConfig(category);
  return config.optionalFields.includes(fieldId);
};