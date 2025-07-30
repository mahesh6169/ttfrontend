// components/advertsv2/fieldSystem/PricingConfig.js

export const PRICING_CONFIG = {
  'Books, Art & Collectables': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
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
        label: 'Sell Price',
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
    sell: { enabled: true, label: 'Sell Price', units: null },
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
    sell: { enabled: true, label: 'Sell Price', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Health, Sport & Fitness': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell Price', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Home & Garden': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell Price', units: null },
    rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day', 'week'] }
  }
},

'Pets': {
  required: true,
  options: {
    sell: { enabled: true, label: 'Sell Price', units: null },
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
        label: 'Sell Price',
        units: null,
        validFor: ['House', 'Land', 'Commercial'] // Only valid for these property types
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month', 'year'],
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

  'Jobs': {
    required: false,
    options: {
      salary: {
        enabled: true,
        label: 'Salary',
        units: ['hour', 'month', 'year'],
        validFor: ['Full-time', 'Part-time', 'Contract']
      },
      stipend: {
        enabled: true,
        label: 'Stipend',
        units: ['week', 'month'],
        validFor: ['Internship']
      }
    }
  },

  'Overseas Goods': {
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
        units: null,
        validFor: ['*'] // Valid for all goods types
      }
    }
  },

  // Service categories - pricing is optional
  'Home Repairs & Improvements': {
    required: false,
    options: {
      quote: {
        enabled: true,
        label: 'Quote Price',
        units: null
      },
      hourly: {
        enabled: true,
        label: 'Hourly Rate',
        units: ['hour']
      }
    }
  },

  'Food & Catering Services': {
    required: false,
    options: {
      perperson: {
        enabled: true,
        label: 'Per Person',
        units: null
      },
      perorder: {
        enabled: true,
        label: 'Per Order',
        units: null
      }
    }
  },

  'Party Hires & Services': {
    required: false,
    options: {
      hire: {
        enabled: true,
        label: 'Hire',
        units: ['hour', 'day', 'event']
      },
      package: {
        enabled: true,
        label: 'Package Price',
        units: null
      }
    }
  },

  // Additional service categories - all optional pricing
  'Cleaning & Maintenance Services': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      quote: { enabled: true, label: 'Quote Price', units: null }
    }
  },
  'Senior Travel Support': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      pertrip: { enabled: true, label: 'Per Trip', units: null }
    }
  },
  'Retail Shops & Stores': {
    required: false,
    options: {
      sell: { enabled: true, label: 'Sell Price', units: null }
    }
  },
  'Transport & Ride Services': {
    required: false,
    options: {
      pertrip: { enabled: true, label: 'Per Trip', units: null },
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] }
    }
  },
  'Legal & Immigration Services': {
    required: false,
    options: {
      consultation: { enabled: true, label: 'Consultation', units: ['hour'] },
      fixedfee: { enabled: true, label: 'Fixed Fee', units: null }
    }
  },
  'Financial & Insurance Services': {
    required: false,
    options: {
      consultation: { enabled: true, label: 'Consultation', units: ['hour'] },
      commission: { enabled: true, label: 'Commission', units: null }
    }
  },
  'Academic Tutors & Education': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      perlesson: { enabled: true, label: 'Per Lesson', units: null }
    }
  },
  'Arts, Dance & Cultural Tutors': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      perlesson: { enabled: true, label: 'Per Lesson', units: null }
    }
  },
  'Business & Professional Services': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      project: { enabled: true, label: 'Project Rate', units: null }
    }
  },
  'Construction & Renovation Services': {
    required: false,
    options: {
      quote: { enabled: true, label: 'Quote Price', units: null },
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] }
    }
  },
  'Travel & Tourism Services': {
    required: false,
    options: {
      pertrip: { enabled: true, label: 'Per Trip', units: null },
      package: { enabled: true, label: 'Package Price', units: null }
    }
  },
  'Marketing & Advertising Services': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      project: { enabled: true, label: 'Project Rate', units: null }
    }
  },
  'IT & Software Services': {
    required: false,
    options: {
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] },
      project: { enabled: true, label: 'Project Rate', units: null }
    }
  },
  'Miscellaneous': {
    required: false,
    options: {
      sell: { enabled: true, label: 'Sell Price', units: null },
      hourly: { enabled: true, label: 'Hourly Rate', units: ['hour'] }
    }
  }
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