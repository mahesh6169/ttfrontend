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
      id: 'conditionSection',
      order: 15,
      title: null,
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    {
      id: 'fieldsSection',
      order: 20,
      title: null,
      fields: []
    }
  ],
  fields: {
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
    id: 'conditionSection',
    order: 15,
    title: null,
    specialField: 'condition',
    dependencies: {
      priceType: ['sell']
    }
  },
  {
    id: 'fieldsSection',
    order: 20,
    title: null,
    fields: ['brand', 'model']
  }
],
fields: {
  brand: {
    type: 'text',
    label: 'Brand',
    placeholder: 'e.g., Baby Love , Mothers Choice',
  },
  model: {
    type: 'text',
    label: 'Model',
    placeholder: 'e.g., Maxi Cosi, Britax',
  }
}
},

'Music & Games': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'conditionSection', order: 15, title: null, specialField: 'condition' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Yamaha, Fender, Sony' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Stratocaster, PlayStation 5' }
  }
},

'Cars & Vehicles': {
  typeField: 'vehicleType',
  sections: [
    {
      id: 'pricingSection',
      order: 10,
      title: 'Pricing Options',
      specialField: 'pricing'
    },
    {
      id: 'vehicleDetailsSection',
      order: 20,
      title: 'Vehicle Details',
      fields: ['vehicleType', 'make', 'model', 'year', 'fuelType', 'mileage', 'transmission']
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
    { id: 'conditionSection', order: 15, title: null, specialField: 'condition' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Nike, Gucci, Zara' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Air Max, Marmont Bag' }
  }
},

'Health, Sport & Fitness': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'conditionSection', order: 15, title: null, specialField: 'condition' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Adidas, Fitbit, Schwinn' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Versa 2, IC4' }
  }
},

'Home & Garden': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'conditionSection', order: 15, title: null, specialField: 'condition' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Weber, IKEA, Makita' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Genesis II, MALM, DHP482' }
  }
},

'Pets': {
  sections: [
    { id: 'pricingSection', order: 10, title: 'Pricing Options', specialField: 'pricing' },
    { id: 'conditionSection', order: 15, title: null, specialField: 'condition' },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Pedigree, Royal Canin' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Puppy Food, Maxi Adult' }
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
    id: 'conditionSection',
    order: 15,
    title: null,
    specialField: 'condition',
    dependencies: {
      priceType: ['sell']
    }
  },
  {
    id: 'fieldsSection',
    order: 20,
    title: null,
    fields: ['brand', 'model']
  }
],
fields: {
  brand: {
    type: 'text',
    label: 'Brand',
    placeholder: 'e.g., Apple, Samsung',
  },
  model: {
    type: 'text',
    label: 'Model',
    placeholder: 'e.g., iPhone 12 Pro'
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
        requiresSection: 'typeSection',
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
          propertyType: ['House' ],
          priceType: ['sell', 'rent', 'share']
        }
      },
      parking: {
        type: 'number',
        label: 'Parking',
        min: 0,
        max: 2,
        dependencies: {
          propertyType: ['House', 'Commercial'],
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

  'Miscellaneous': {
    sections: [
      {
        id: 'pricingSection',
        order: 10,
        title: 'Pricing Options',
        specialField: 'pricing'
      },
      {
        id: 'conditionSection',
        order: 15,
        title: null,
        specialField: 'condition',
        dependencies: {
          priceType: ['sell']
        }
      },
      {
        id: 'fieldsSection',
        order: 20,
        title: null,
        fields: []
      }
    ],
    fields: {}
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