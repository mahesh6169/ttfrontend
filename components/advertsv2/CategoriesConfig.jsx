// config/categoryConfiguration.js

export const CATEGORY_CONFIG = {
  'Electronics & Computers': {
    fields: {
      brand: {
        type: 'text',
        label: 'Brand',
        placeholder: 'e.g., Apple, Samsung',
        hint: 'Enter the manufacturer name',
        required: true,
        validation: {
          pattern: /^[a-zA-Z0-9\s&-]+$/,
          maxLength: 50
        },
        errorMessages: {
          required: 'Brand name is required',
          pattern: 'Brand can only contain letters, numbers, spaces, & and -',
          maxLength: 'Brand name is too long (max 50 characters)'
        },
        showWhen: { adType: 'offered' }
      },
      model: {
        type: 'text',
        label: 'Model',
        placeholder: 'e.g., iPhone 14 Pro',
        required: false
      },
      condition: {
        type: 'select',
        label: 'Condition',
        options: ['New', 'Used', 'Refurbished'],
        required: true,
        showWhen: { adType: 'offered' }
      },
    },
    pricing: {
      sell: { enabled: true, label: 'Sell Price' },
      rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
      hire: false,
      share: false
    },
    validation: {
      minImages: 1,
      maxImages: 10,
      requiresAddress: true,
      minDescriptionLength: 20
    }
  },

  'Cars & Vehicles': {
    fields: {
      vehicleType: {
        type: 'select',
        label: 'Vehicle Type',
        options: ['Car', 'Motorcycle', 'Truck', 'Boat'],
        required: true
      },
      make: {
        type: 'text',
        label: 'Make',
        placeholder: 'e.g., Toyota',
        required: true
      },
      model: {
        type: 'text',
        label: 'Model',
        placeholder: 'e.g., Camry',
        required: true
      },
      year: {
        type: 'number',
        label: 'Year',
        min: 1900,
        max: new Date().getFullYear() + 1,
        required: true
      },
      mileage: {
        type: 'number',
        label: 'Mileage (km)',
        min: 0,
        showWhen: { adType: 'offered' }
      },
      transmission: {
        type: 'select',
        label: 'Transmission',
        options: ['Manual', 'Automatic', 'Semi-Automatic'],
        showWhen: { vehicleType: 'Car' }
      },
      condition: {
        type: 'select',
        label: 'Condition',
        options: ['Excellent', 'Good', 'Fair', 'Needs Work'],
        showWhen: { adType: 'offered' }
      }
    },
    pricing: {
      sell: { enabled: true, label: 'Sell Price' },
      rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
      hire: { enabled: true, label: 'Hire', units: ['hour', 'day'] },
      share: false
    },
    validation: {
      minImages: 3,
      maxImages: 20,
      requiresAddress: true
    }
  },

  'Real Estate': {
    fields: {
      propertyType: {
        type: 'select',
        label: 'Property Type',
        options: ['House', 'Room','Commercial', 'Land'],
        required: true
      },
      bedrooms: {
        type: 'number',
        label: 'Bedrooms',
        min: 0,
        max: 6,
        showWhen: { propertyType: ['House', 'Room']}
      },
      bathrooms: {
        type: 'number',
        label: 'Bathrooms',
        min: 0,
        max: 6,
        showWhen: { propertyType: ['House', 'Room'] }
      },
      parkingSpaces: {
        type: 'number',
        label: 'Parking Spaces',
        min: 0,
        max: 6,
        showWhen: { propertyType: ['House', 'Room'] }
      },
      landSize: {
        type: 'number',
        label: 'Land Size (m²)',
        min: 0,
        showWhen: { propertyType: ['House', 'Land'] }
      }
    },
    pricing: {
      sell: { enabled: true, label: 'Sell Price' },
      rent: { enabled: true, label: 'Rent', units: ['day', 'week', 'month'] },
      hire: false,
      share: { enabled: true, label: 'Share', units: ['week', 'month'] }
    },
    validation: {
      minImages: 5,
      maxImages: 30,
      requiresAddress: true
    }
  },

  'Jobs': {
    fields: {
      jobType: {
        type: 'select',
        label: 'Job Type',
        options: ['Full-time', 'Part-time', 'Contract', 'Casual'],
        required: true
      },
      industry: {
        type: 'text',
        label: 'Industry',
        placeholder: 'e.g., Technology, Healthcare'
      },
      experienceRequired: {
        type: 'select',
        label: 'Experience Required',
        options: ['Entry Level', '1-3 years', '3-5 years', '5+ years']
      },
      salaryRange: {
        type: 'text',
        label: 'Salary Range',
        placeholder: 'e.g., $60k - $80k'
      }
    },
    pricing: false, // Jobs typically don't have pricing
    validation: {
      minImages: 0,
      maxImages: 3,
      requiresAddress: true
    }
  },

  'Services': {
    fields: {
      serviceType: {
        type: 'text',
        label: 'Service Type',
        placeholder: 'e.g., Plumbing, Tutoring',
        required: true
      },
      availability: {
        type: 'multiselect',
        label: 'Availability',
        options: ['Weekdays', 'Weekends', 'Evenings', 'Emergency']
      },
      experienceYears: {
        type: 'number',
        label: 'Years of Experience',
        min: 0
      }
    },
    pricing: {
      sell: false,
      rent: false,
      hire: { enabled: true, label: 'Service Rate', units: ['hour', 'job', 'quote'] },
      share: false
    },
    validation: {
      minImages: 0,
      maxImages: 5,
      requiresAddress: false // Services might not need exact address
    }
  }
};

// Default configuration for categories not explicitly defined
export const DEFAULT_CONFIG = {
  fields: {
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used'],
      showWhen: { adType: 'offered' }
    }
  },
  pricing: {
    sell: { enabled: true, label: 'Price' },
    rent: { enabled: true, label: 'Rent', units: ['week', 'month'] },
    hire: { enabled: true, label: 'Hire', units: ['hour', 'day'] },
    share: { enabled: true, label: 'Share', units: ['week', 'month'] }
  },
  validation: {
    minImages: 0,
    maxImages: 10,
    requiresAddress: true,
    minDescriptionLength: 10
  }
};

// Helper functions
export const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category] || DEFAULT_CONFIG;
};

export const shouldShowField = (field, formData) => {
  if (!field.showWhen) return true;
  
  return Object.entries(field.showWhen).every(([key, value]) => {
    if (Array.isArray(value)) {
      return value.includes(formData[key]);
    }
    return formData[key] === value;
  });
};

export const getCategoryNames = () => {
  return Object.keys(CATEGORY_CONFIG);
};

// Validation helper
export const validateField = (fieldKey, fieldConfig, value) => {
  const errors = [];
  
  if (fieldConfig.required && !value) {
    errors.push(`${fieldConfig.label} is required`);
  }
  
  if (fieldConfig.type === 'number') {
    if (fieldConfig.min !== undefined && value < fieldConfig.min) {
      errors.push(`${fieldConfig.label} must be at least ${fieldConfig.min}`);
    }
    if (fieldConfig.max !== undefined && value > fieldConfig.max) {
      errors.push(`${fieldConfig.label} must be at most ${fieldConfig.max}`);
    }
  }
  
  return errors;
};