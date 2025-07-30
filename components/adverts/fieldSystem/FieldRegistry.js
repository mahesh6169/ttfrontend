// components/advertsv2/fieldSystem/FieldRegistry.js

// Define the form structure with sections and dependencies
export const FORM_STRUCTURE = {
  'Books, Art & Collectables': {
    sections: [
    {
      id: 'pricingSection',
      order: 10,
      title: 'Pricing Options',
      specialField: 'pricing'
    },
    {
      id: 'fieldsSection',
      order: 20,
      title: null,
      fields: ['condition']
    }
  ],
  fields: {
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: {
        priceType: ['sell']
      }
    }
  }
},

'Baby & Children': {
  sections: [
  {
    id: 'pricingSection',
    order: 10,
    title: 'Pricing Options',
    specialField: 'pricing'
  },
  {
    id: 'fieldsSection',
    order: 20,
    title: null,
    fields: ['brand', 'model', 'condition']
  }
],
fields: {
  brand: {
    type: 'text',
    label: 'Brand',
    placeholder: 'e.g., Baby Love , Mothers Choice',
    required: true
  },
  model: {
    type: 'text',
    label: 'Model',
    placeholder: 'e.g., Maxi Cosi, Britax',
  },
  condition: {
    type: 'select',
    label: 'Condition',
    options: ['New', 'Used', 'Refurbished'],
    required: true,
    dependencies: {
      priceType: ['sell']
    }
  }
}
},

'Music & Games': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model', 'condition'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Yamaha, Fender, Sony' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Stratocaster, PlayStation 5' },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: { priceType: ['sell'] }
    }
  }
},

'Cars & Vehicles': {
  typeField: 'vehicleType',
  sections: [
    {
      id: 'typeSection',
      order: 10,
      title: null,
      fields: ['vehicleType']
    },
    {
      id: 'basicDetailsSection',
      order: 15,
      title: null,
      requiresSection: 'typeSection',
      fields: ['make', 'model', 'year']
    },
    {
      id: 'pricingSection',
      order: 20,
      title: 'Pricing Options',
      specialField: 'pricing',
      requiresSection: 'basicDetailsSection'
    },
    {
      id: 'detailsSection',
      order: 30,
      title: 'Vehicle Details',
      requiresSection: 'basicDetailsSection',
      fields: ['fuelType','mileage', 'transmission']
    }
  ],
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
      placeholder: 'e.g., Toyota'
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'e.g., Camry'
    },
    year: {
      type: 'number',
      label: 'Year',
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    fuelType: {
      type: 'text',
      label: 'Fuel Type',
      placeholder: 'e.g., Petrol, Diesel, Electric'
    },
    mileage: {
      type: 'number',
      label: 'Mileage (km)',
      min: 0
    },
    transmission: {
      type: 'select',
      label: 'Transmission',
      options: ['Manual', 'Automatic']
    }
  }
},

'Fashion & Accessories': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model', 'condition'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Nike, Gucci, Zara' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Air Max, Marmont Bag' },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: { priceType: ['sell'] }
    }
  }
},

'Health, Sport & Fitness': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model', 'condition'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Adidas, Fitbit, Schwinn' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Versa 2, IC4' },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: { priceType: ['sell'] }
    }
  }
},

'Home & Garden': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model', 'condition'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Weber, IKEA, Makita' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Genesis II, MALM, DHP482' },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: { priceType: ['sell'] }
    }
  }
},

'Pets': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model', 'condition'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Pedigree, Royal Canin' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Puppy Food, Maxi Adult' },
    condition: {
      type: 'select',
      label: 'Condition',
      options: ['New', 'Used', 'Refurbished'],
      required: true,
      dependencies: { priceType: ['sell'] }
    }
  }
},

'Electronics & Computers': {
  sections: [
  {
    id: 'pricingSection',
    order: 10,
    title: 'Pricing Options',
    specialField: 'pricing'
  },
  {
    id: 'fieldsSection',
    order: 20,
    title: null,
    fields: ['brand', 'model', 'condition']
  }
],
fields: {
  brand: {
    type: 'text',
    label: 'Brand',
    placeholder: 'e.g., Apple, Samsung',
    required: true
  },
  model: {
    type: 'text',
    label: 'Model',
    placeholder: 'e.g., iPhone 12 Pro'
  },
  condition: {
    type: 'select',
    label: 'Condition',
    options: ['New', 'Used', 'Refurbished'],
    required: true,
    dependencies: {
      priceType: ['sell']
    }
  }
}
},

'Real Estate': {
    typeField: 'propertyType',
    sections: [
      {
        id: 'typeSection',
        order: 10,
        title: null,
        fields: ['propertyType']
      },
      {
        id: 'pricingSection',
        order: 20,
        title: 'Pricing Options',
        specialField: 'pricing',
        requiresSection: 'typeSection'
      },
      {
        id: 'detailsSection',
        order: 30,
        title: 'Property Details',
        requiresSection: 'pricingSection',
        fields: ['bedrooms', 'parking']
      }
    ],
    fields: {
      propertyType: {
        type: 'select',
        label: 'Property Type',
        options: ['Room', 'House', 'Commercial', 'Land'],
        required: true
      },
      bedrooms: {
        type: 'number',
        label: 'Bedrooms',
        min: 0,
        max: 6,
        dependencies: {
          propertyType: ['Room', 'House' ],
          priceType: ['sell', 'rent', 'share']
        }
      },
      parking: {
        type: 'number',
        label: 'Parking',
        min: 0,
        max: 2,
        dependencies: {
          propertyType: ['Room', 'House', 'Commercial'],
          priceType: ['sell', 'rent', 'share']
        }
      }
    }
  },

  
'Jobs': {
    typeField: 'jobType',
    sections: [
      {
        id: 'typeSection',
        order: 10,
        title: null,
        fields: ['jobType', 'jobTitle']
      },
      {
        id: 'pricingSection',
        order: 20,
        title: 'Compensation',
        specialField: 'pricing',
        requiresSection: 'typeSection'
      }
    ],
    fields: {
      jobTitle: {
        type: 'text',
        label: 'Job Title',
        placeholder: 'e.g., Software Engineer',
        required: true
      },
      jobType: {
        type: 'select',
        label: 'Job Type',
        options: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        required: true
      }
    }
  },

'Overseas Goods': {
    typeField: 'goodsType',
    sections: [
      {
        id: 'typeSection',
        order: 10,
        title: null,
        fields: ['goodsType']
      },
      {
        id: 'pricingSection',
        order: 20,
        title: 'Pricing Options',
        specialField: 'pricing',
        requiresSection: 'typeSection'
      },
      {
        id: 'detailsSection',
        order: 30,
        title: 'Delivery Details',
        requiresSection: 'pricingSection',
        fields: ['deliveryTime']
      }
    ],
    fields: {
      goodsType: {
        type: 'select',
        label: 'Goods Type',
        options: ['Electronics', 'Clothes', 'Groceries'],
        required: true
      },
      deliveryTime: {
        type: 'number',
        label: 'Delivery Time (weeks)',
        placeholder: 'e.g., 2',
        min: 1,
        max: 12,
        dependencies: {
          priceType: ['sell']
        }
      }
    }
  }
};

// Keep the original functions for backward compatibility
export const getFieldsForCategory = (category) => {
  const structure = FORM_STRUCTURE[category] || {};
  return structure.fields || {};
};

export const getOrderedFieldsForCategory = (category) => {
  const fields = getFieldsForCategory(category);
  return Object.entries(fields)
    .map(([id, config]) => ({ id, ...config }))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
};

// New function to get form structure
export const getFormStructure = (category) => {
  return FORM_STRUCTURE[category] || null;
};