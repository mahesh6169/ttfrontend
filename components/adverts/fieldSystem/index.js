// components/advertsv2/fieldSystem/index.js

// Import from modules
import {
  CATEGORY_ACCESS,
  getCategoriesForRole,
  canAccessCategory,
  ADDRESS_OPTIONAL_CATEGORIES,
  isAddressOptional
} from './CategoryAccess';

import {
  getFieldsForCategory,
  getOrderedFieldsForCategory,
  getFormStructure,
  FORM_STRUCTURE
} from './FieldRegistry';

import {
  PRICING_CONFIG,
  getPricingOptionsForCategory,
  getAvailablePricingOptions,
  isPricingOptionValidForType,
  shouldShowPricingOption
} from './PricingConfig';

import {
  FormEngine,
  getFormEngine,
  DependencyResolver,
  getDependencyResolver
} from './DependencyResolver';

// Export everything individually
export {
  CATEGORY_ACCESS,
  getCategoriesForRole,
  canAccessCategory,
  ADDRESS_OPTIONAL_CATEGORIES,
  isAddressOptional,
  getFieldsForCategory,
  getOrderedFieldsForCategory,
  getFormStructure,
  FORM_STRUCTURE,
  PRICING_CONFIG,
  getPricingOptionsForCategory,
  getAvailablePricingOptions,
  isPricingOptionValidForType,
  shouldShowPricingOption,
  FormEngine,
  getFormEngine,
  DependencyResolver,
  getDependencyResolver
};

// Export a unified API for the field system
export const FieldSystem = {
  // Category management
  getCategoriesForRole,
  canAccessCategory,
  isAddressOptional,
  
  // Field management
  getFieldsForCategory,
  getOrderedFieldsForCategory,
  getFormStructure,
  
  // Pricing management
  getPricingOptionsForCategory,
  getAvailablePricingOptions,
  
  // Engine access
  getFormEngine,
  getDependencyResolver,
  
  // Legacy method for backward compatibility
  getFormConfiguration: (category, userRole, formData = {}) => {
    const engine = getFormEngine(category, userRole, formData);
    const visibleFieldMap = engine.getVisibleFields();
    const pricingOptions = engine.getAvailablePricingOptions();
    const pricingConfig = engine.getPricingConfig();
    
    const pricingField = {
      id: 'pricing',
      type: 'pricing',
      label: pricingConfig?.label || 'Pricing',
      options: pricingOptions,
      order: 10
    };
    
    const orderedFields = [
      pricingField,
      ...Object.entries(visibleFieldMap)
        .map(([id, config]) => {
          return {
            id,
            ...config,
            dependencies: {
              showWhen: config.dependencies || {},
              hideWhen: {},
              requiredWhen: {}
            }
          };
        })
    ].sort((a, b) => (a.order || 999) - (b.order || 999));
    
    return {
      canAccess: engine.canAccessCategory(),
      fields: visibleFieldMap,
      orderedFields,
      pricingOptions,
      pricingConfig
    };
  },
  
  // New method for section-based rendering
  getFormSections: (category, userRole, formData = {}) => {
    const engine = getFormEngine(category, userRole, formData);
    return engine.getVisibleSections();
  }
};

// Default export for easy importing
export default FieldSystem;