// components/advertsv2/fieldSystem/FieldRegistry.js

export const CATEGORY_FIELDS = {
  _common: {
  },

  'Electronics & Computers': {
    brand: {
      type: 'text',
      label: 'Brand',
      placeholder: 'e.g., Apple, Samsung',
      order: 21
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'e.g., iPhone 12 Pro',
      order: 22
    },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      order: 23,
      showWhen: {
        priceType: ['sell']
      }
    }
  },
  'Jobs': {
    jobTitle: {
      type: 'text',
      label: 'Job Title',
      placeholder: 'e.g., Software Engineer',
      order: 21
    },
    jobType: {
      type: 'select',
      label: 'Job Type',
      options: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      order: 21
    },
  },
    
  'Real Estate': {
    propertyType: {
      type: 'select',
      label: 'Property Type',
      options: ['Room', 'House', 'Commercial', 'Land'],

      order: 21
    },
    bedrooms: {
      type: 'number',
      label: 'Bedrooms',
      min: 0,
      max: 6,
      order: 22,
      showWhen: {
        priceType: ['sell', 'rent', 'share'],
        propertyType: ['Room', 'House', 'Commercial']
      }
    },
    parking: {
      type: 'number',
      label: 'Parking',
      min: 0,
      max: 2,
      order: 23,
      showWhen: {
        priceType: ['sell', 'rent', 'share'],
        propertyType: ['Room', 'House', 'Commercial']
      }
    }
  },

  'Cars & Vehicles': {
    vehicleType: {
      type: 'select',
      label: 'Vehicle Type',
      options: ['Car', 'Motorcycle', 'Truck', 'Boat'],
      order: 21
    },
    make: {
      type: 'text',
      label: 'Make',
      placeholder: 'e.g., Toyota',
      order: 22
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'e.g., Camry',
      order: 23
    },
    year: {
      type: 'number',
      label: 'Year',
      min: 1900,
      max: new Date().getFullYear() + 1,

      order: 24
    },
    mileage: {
      type: 'number',
      label: 'Mileage (km)',
      min: 0,
      order: 25,
      showWhen: {
        priceType: ['sell']
      }
    },
    transmission: {
      type: 'select',
      label: 'Transmission',
      options: ['Manual', 'Automatic', 'Semi-Automatic'],
      order: 26
    }
  },

  'Overseas Goods': {
    goodsType: {
      type: 'select',
      label: 'Goods Type',
      options: ['Electronics', 'Clothes', 'Groceries'],
      order: 21
    },
    deliveryTime: {
      type: 'number',
      label: 'Delivery Time (weeks)',
      placeholder: 'e.g., 2',
      min: 1,
      max: 12,
      order: 22,
      showWhen: {
        priceType: ['sell']
      }
    }
  }
};

export const getFieldsForCategory = (category) => {
  const commonFields = CATEGORY_FIELDS._common || {};
  const categoryFields = CATEGORY_FIELDS[category] || {};
  return { ...commonFields, ...categoryFields };
};

export const getOrderedFieldsForCategory = (category) => {
  const fields = getFieldsForCategory(category);
  return Object.entries(fields)
    .map(([id, config]) => ({ id, ...config }))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
};
