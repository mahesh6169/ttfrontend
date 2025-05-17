// components/advertsv2/fieldSystem/index.js

// Import functions individually
import {
  CATEGORY_ACCESS,
  getCategoriesForRole,
  canAccessCategory,
  ADDRESS_OPTIONAL_CATEGORIES,
  isAddressOptional
} from './CategoryAccess';

import { 
  getFieldsForCategory,
  getOrderedFieldsForCategory 
} from './FieldRegistry';

import { 
  PRICING_CONFIG,
  getPricingOptionsForCategory,
  shouldShowPricingOption,
  getFieldVisibilityForProperty 
} from './PricingConfig';

import { 
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
  PRICING_CONFIG,
  getPricingOptionsForCategory,
  shouldShowPricingOption,
  getFieldVisibilityForProperty,
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
  
  // Pricing management
  getPricingOptionsForCategory,
  shouldShowPricingOption,
  
  // Dependency resolution
  getDependencyResolver,
  
  // Utility function to get complete form configuration
  getFormConfiguration: (category, userRole, formData = {}) => {
    const resolver = getDependencyResolver(category, userRole, formData);
      const visibleFieldMap = resolver.getVisibleFields();
    const pricingOptions = resolver.getVisiblePricingOptions();
    const pricingConfig = resolver.getPricingConfig();
  
    const pricingField = {
      id: 'pricing',
      type: 'pricing',
      label: pricingConfig?.label || 'Pricing',
      options: pricingOptions,
      order: pricingConfig?.order || 11
    };
    
    const orderedFields = [
      pricingField, // ✅ Inject pricing into field layout
      ...Object.entries(visibleFieldMap)
        .map(([id, config]) => {
          const deps = resolver.getFieldDependencies(id);
          return {
            id,
            ...config,
            dependencies: {
              showWhen: deps.showWhen,
              hideWhen: deps.hideWhen,
              requiredWhen: deps.requiredWhen
            }
          };
        })
    ].sort((a, b) => (a.order || 999) - (b.order || 999));
  
    return {
      canAccess: resolver.canAccessCategory(),
      fields: visibleFieldMap,           // Original object format
      orderedFields,                     // New: sorted with metadata
      pricingOptions,
      pricingConfig
    };
  }
  
};

// Default export for easy importing
export default FieldSystem;