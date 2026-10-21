// components/advertsv2/fieldSystem/FieldRegistry.js

// Shared field configurations that multiple categories use
const SHARED_FIELDS = {
  condition: {
    type: 'select',
    label: 'Condition',
    options: ['New', 'Used', 'Refurbished'],
    placeholder: 'Select Condition',
    required: true
  },
  serviceArea: {
    type: 'textarea',
    label: 'Service Areas',
    placeholder: 'e.g., Perth Metro areas, South of River, Eastern suburbs, Northern suburbs',
    helpText: 'Describe all the areas where you provide your services',
    required: false,
    rows: 3,
    resize: true
  }
};

// Define the form structure with sections and dependencies
// Travel Requests (Parcel Carrying, Travel Companion for Parents) share a route and a budget.
// The budget is kept in fields (budgetType / budgetAmount), not in the pricing list.
const TRAVEL_ROUTE_FIELDS = {
  fromPlace: {
    type: 'text',
    label: 'From',
    placeholder: 'e.g., Sydney NSW',
    required: true
  },
  toPlace: {
    type: 'text',
    label: 'To',
    placeholder: 'e.g., Melbourne VIC, or Hyderabad India',
    required: true
  },
  // Stored as "YYYY-MM-DDTHH:MM" wall-clock time (no timezone), shown exactly as picked
  travelDate: {
    type: 'datetime',
    label: 'Travel Date',
    required: true
  }
};

const TRAVEL_BUDGET_FIELDS = {
  budgetType: {
    type: 'select',
    label: 'Budget / Payment',
    options: ['Free (favour)', 'Fixed amount', 'Negotiable'],
    required: true
  },
  budgetAmount: {
    type: 'number',
    label: 'Amount (AUD)',
    placeholder: 'e.g., 50',
    min: 0,
    required: true,
    dependencies: {
      budgetType: ['Fixed amount']
    }
  }
};

export const FORM_STRUCTURE = {
  'Books, Art & Collectables': {
    sections: [
    {
      id: 'pricingSection',
      order: 10,
      title: null,
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

'Baby & Kids': {
  sections: [
  {
    id: 'pricingSection',
    order: 10,
    title: null,
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
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    { 
      id: 'conditionSection', 
      order: 15, 
      title: null, 
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
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
      title: null,
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
      placeholder: 'e.g., Petrol, Diesel, Electric',
      dependencies: {
        vehicleType: ['Car', 'Motorcycle', 'Truck']  // Hide for Boat
      }
    },
    mileage: {
      type: 'number',
      label: 'Mileage (km)',
      min: 0
    },
    transmission: {
      type: 'select',
      label: 'Transmission',
      options: ['Manual', 'Automatic'],
      dependencies: {
        vehicleType: ['Car', 'Motorcycle', 'Truck']  // Hide for Boat
      }
    }
  }
},

'Fashion & Accessories': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    { 
      id: 'conditionSection', 
      order: 15, 
      title: null, 
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Nike, Gucci, Zara' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Air Max, Marmont Bag' }
  }
},

'Health, Sport & Fitness': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    { 
      id: 'conditionSection', 
      order: 15, 
      title: null, 
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Adidas, Fitbit, Schwinn' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Versa 2, IC4' }
  }
},

'Home & Decor': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    {
      id: 'conditionSection',
      order: 15,
      title: null,
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., IKEA, West Elm, Freedom' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., MALM, Billy, Hemnes' }
  }
},

'Garden & Outdoor': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    {
      id: 'conditionSection',
      order: 15,
      title: null,
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    { id: 'fieldsSection', order: 20, title: null, fields: ['brand', 'model'] }
  ],
  fields: {
    brand: { type: 'text', label: 'Brand', placeholder: 'e.g., Weber, Ryobi, Makita' },
    model: { type: 'text', label: 'Model', placeholder: 'e.g., Genesis II, One+, LXT' }
  }
},

'Building Materials': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    {
      id: 'conditionSection',
      order: 15,
      title: null,
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
    { id: 'fieldsSection', order: 20, title: null, fields: [] }
  ],
  fields: {}
},

'Pet Supplies': {
  sections: [
    { id: 'pricingSection', order: 10, title: null, specialField: 'pricing' },
    { 
      id: 'conditionSection', 
      order: 15, 
      title: null, 
      specialField: 'condition',
      dependencies: {
        priceType: ['sell']
      }
    },
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
    title: null,
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

'Sell, Rent & Share': {
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
        title: null,
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
        max: 4,
        dependencies: {
          propertyType: ['House', 'Commercial'],
          priceType: ['sell', 'rent', 'share']
        }
      }
    }
  },

  
'Full Time': {
    sections: [
      {
        id: 'fieldsSection',
        order: 10,
        title: null,
        fields: ['jobTitle']
      }
    ],
    fields: {
      jobTitle: {
        type: 'text',
        label: 'Job Title',
        placeholder: 'e.g., Software Engineer',
        required: true
      }
    }
  },

  'Casual': {
    sections: [
      {
        id: 'fieldsSection',
        order: 10,
        title: null,
        fields: ['jobTitle']
      }
    ],
    fields: {
      jobTitle: {
        type: 'text',
        label: 'Job Title',
        placeholder: 'e.g., Kitchen Hand',
        required: true
      }
    }
  },

  'Part Time': {
    sections: [
      {
        id: 'fieldsSection',
        order: 10,
        title: null,
        fields: ['jobTitle']
      }
    ],
    fields: {
      jobTitle: {
        type: 'text',
        label: 'Job Title',
        placeholder: 'e.g., Receptionist',
        required: true
      }
    }
  },


  'Courier & Delivery': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Taxi & Transfers': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Home Repairs & Improvements': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Car Servicing & Repairs': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Electricians': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Painters': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Plumbing & Gas': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Landscaping & Gardening': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Air Conditioning & Refrigeration': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Water Filtration & Purification': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Computer & Mobile Repairs': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Cabinet Makers': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Handyman & Flatpacks': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Sewing & Alterations': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Packers & Movers': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Accounting & Taxation': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Real Estate & Buyers Agents': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Restaurants & Cafes': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Catering': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Cakes': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Chat & Street Food': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Sweets & Snacks': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'DJ & Audio Visual': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Entertainers & Performers': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Decorations': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Party Hire': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Cleaning & Maintenance': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Pest Control': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Photography & Videography': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Hair, Makeup & Waxing': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Massage': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Yoga': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Priest & Pooja': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Marriage Celebrants': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Childcare & Babysitting': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Aged Parent Care': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Domestic Help': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Matrimony': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Indian Groceries': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Fruit & Veg': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Butchers': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Plant Nursery': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Legal & Immigration': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Financial & Insurance': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Driving Lessons': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: ['serviceArea']
      }
    ]
  },

  'Academic Tutoring': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Music Lessons': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Dance Lessons': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Art Classes': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Sports Coaching': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },


  'Tour Guides & Operators': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Travel Agents': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Logo Services': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Business IT': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Website Design': {
    sections: [
      {
        id: 'serviceDetailsSection',
        order: 10,
        fields: []
      }
    ]
  },

  'Parcel Carrying': {
    sections: [
      {
        id: 'travelDetailsSection',
        order: 10,
        title: null,
        fields: ['fromPlace', 'toPlace', 'travelDate', 'parcelSize', 'parcelContents', 'budgetType', 'budgetAmount']
      }
    ],
    fields: {
      ...TRAVEL_ROUTE_FIELDS,
      travelDate: {
        ...TRAVEL_ROUTE_FIELDS.travelDate,
        wantedLabel: 'Delivered By'
      },
      parcelSize: {
        type: 'text',
        label: 'Parcel Size / Weight',
        placeholder: 'e.g., Small box, about 2 kg',
        required: true
      },
      parcelContents: {
        type: 'text',
        label: 'What Is Inside',
        placeholder: 'e.g., Clothes and a book (can be opened and checked)',
        required: true
      },
      ...TRAVEL_BUDGET_FIELDS
    }
  },

  'Travel Companion for Parents': {
    sections: [
      {
        id: 'travelDetailsSection',
        order: 10,
        title: null,
        fields: ['fromPlace', 'toPlace', 'travelDate', 'numberOfParents', 'helpNeeded', 'budgetType', 'budgetAmount']
      }
    ],
    fields: {
      ...TRAVEL_ROUTE_FIELDS,
      numberOfParents: {
        type: 'number',
        label: 'Number of Parents',
        placeholder: 'e.g., 1',
        min: 1,
        max: 6,
        required: true
      },
      helpNeeded: {
        type: 'textarea',
        label: 'Help Needed',
        placeholder: 'e.g., Wheelchair, language help, airport assistance',
        required: false,
        rows: 3
      },
      ...TRAVEL_BUDGET_FIELDS
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

// Function to get shared field configurations
export const getSharedField = (fieldName) => {
  return SHARED_FIELDS[fieldName] || null;
};