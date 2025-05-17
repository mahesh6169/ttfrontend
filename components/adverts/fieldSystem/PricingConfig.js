// components/advertsv11/fieldSystem/PricingConfig.js

export const PRICING_CONFIG = {
  'Electronics & Computers': {
    order: 11,
    label: 'Pricing Options',
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
        units: null
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month']
      },
      hire: {
        enabled: true,
        label: 'Hire',
        units: ['hour', 'day', 'week']
      },
      share: {
        enabled: false,
        label: 'Share',
        units: null
      }
    }
  },

  'Real Estate': {
    order: 11,
    label: 'Pricing Options',
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
        units: null,
        showWhen: {
          propertyType: ['House', 'Land', 'Commercial']
        }
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month', 'year'],
        showWhen: {
          propertyType: ['Room', 'House', 'Commercial']
        }
      },
      share: {
        enabled: true,
        label: 'Share',
        units: ['week', 'month'],
        showWhen: {
          propertyType: ['Room', 'House']
        }
      },
      hire: {
        enabled: false,
        label: 'Hire',
        units: null
      }
    }
  },

  'Cars & Vehicles': {
    order: 11,
    label: 'Pricing Options',
    required: true,
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
        units: null
      },
      rent: {
        enabled: true,
        label: 'Rent',
        units: ['day', 'week', 'month']
      },
      hire: {
        enabled: false,
        label: 'Hire',
        units: null
      },
      share: {
        enabled: false,
        label: 'Share',
        units: null
      }
    }
  },

  'Overseas Goods': {
    order: 11,
    label: 'Pricing Options',    
    options: {
      sell: {
        enabled: true,
        label: 'Sell Price',
        units: null
      },
      rent: {
        enabled: false,
        label: 'Rent',
        units: null
      },
      hire: {
        enabled: false,
        label: 'Hire',
        units: null
      },
      share: {
        enabled: false,
        label: 'Share',
        units: null
      }
    }
  }
};

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

export const shouldShowPricingOption = (category, pricingType, formData) => {
  const config = PRICING_CONFIG[category];
  if (!config) return false;

  const option = config.options[pricingType];
  if (!option || !option.enabled) return false;

  // For Real Estate, if no property type is selected yet, show all enabled pricing options
  // so that the pricing type section appears initially
  if (category === 'Real Estate' && !formData.propertyType) {
    return true;
  }

  // Once a property type is selected, apply the proper filtering
  if (option.showWhen) {
    for (const [field, allowedValues] of Object.entries(option.showWhen)) {
      if (!allowedValues.includes(formData[field])) {
        return false;
      }
    }
  }
  return true;
};
