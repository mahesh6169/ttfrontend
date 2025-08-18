// components/advertsv2/fieldSystem/PricingConfig.js

export const PRICING_CONFIG = {
  'Books, Art & Collectables': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell',
        units: null,
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month'],
      },
      hire: {
        enabled: true,
        label: 'Hire',
        units: ['hour', 'day', 'week'],
      }
    }
  },
  'Baby & Children': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell',
        units: null,
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month'],
      },
      hire: {
        enabled: true,
        label: 'Hire',
        units: ['hour', 'day', 'week'],
      }
    }
  },
  'Music & Games': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},
'Cars & Vehicles': {
  required: true,
  options: {
    sell: {
      enabled: true,
      label: 'Sell Price',
      units: null,
      validFor: ['*'] // Valid for all vehicle types
    },
    rent: {
      enabled: true,
      label: 'Rent',
      units: ['day', 'week', 'month'],
      validFor: ['*'] // Valid for all vehicle types
    },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'],  validFor: ['*'] }
  }
},

  'Fashion & Accessories': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Health, Sport & Fitness': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Home & Garden': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Pets': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},
'Electronics & Computers': {
  required: true,
  options: {
    sell: {
      enabled: true,
      label: 'Sell Price',
      units: null,
      validFor: ['*'] // Valid for all brands - the wildcard means no restrictions
    },
    rent: {
      enabled: true,
      label: 'Rent',
      units: ['day', 'week', 'month'],
      validFor: ['*'] // Valid for all brands
    },
    hire: {
      enabled: true,
      label: 'Hire',
      units: ['hour', 'day', 'week'],
      validFor: ['*'] // Valid for all brands
    }
  }
},
  'Real Estate': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell',
        units: null,
        validFor: ['House', 'Land', 'Commercial'] // Only valid for these property types
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month'],
        validFor: ['Room', 'House', 'Commercial'] // Only valid for these property types
      },
      share: {
        enabled: true,
        label: 'Share',
        units: ['week', 'month'],
        validFor: ['Room', 'House'] // Only valid for these property types
      }
    }
  },

  'Overseas Goods': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell',
        units: null,
        validFor: ['*'] // Valid for all goods types
      }
    }
  },

  'Miscellaneous': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell',
        units: null,
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month'],
      },
      hire: {
        enabled: true,
        label: 'Hire',
        units: ['hour', 'day', 'week'],
      }
    }
  },
};

// Get all pricing options for a category
export const getPricingOptionsForCategory = (category) => {
  const config = PRICING_CONFIG[category];
  if (!config) return {};
  
  return Object.entries(config.options)
    .filter(([_, option]) => option.enabled)
    .reduce((acc, [key, option]) => {
      acc[key] = option;
      return acc;
    }, {});
};

// Check if a pricing option is valid for the selected type
export const isPricingOptionValidForType = (category, priceType, typeValue) => {
  const config = PRICING_CONFIG[category];
  if (!config) return false;

  const option = config.options[priceType];
  if (!option || !option.enabled) return false;

  // If validFor contains a wildcard or the specific type value, it's valid
  return option.validFor.includes('*') || option.validFor.includes(typeValue);
};

// Get available pricing options based on the selected type
export const getAvailablePricingOptions = (category, typeValue) => {
  const allOptions = getPricingOptionsForCategory(category);
  
  if (!typeValue) return allOptions; // Return all if no type selected yet
  
  return Object.entries(allOptions)
    .filter(([priceType]) => isPricingOptionValidForType(category, priceType, typeValue))
    .reduce((acc, [key, option]) => {
      acc[key] = option;
      return acc;
    }, {});
};

// Legacy method for backward compatibility
export const shouldShowPricingOption = (category, priceType, formData) => {
  const typeField = FORM_STRUCTURE[category]?.typeField;
  if (!typeField) return true;
  
  const typeValue = formData[typeField];
  return isPricingOptionValidForType(category, priceType, typeValue);
};