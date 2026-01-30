// components/adverts/fieldSystem/index.js

// Import from modules
import {
  CATEGORIES,
  getAllParentCategories,
  getSubcategories,
  getAllSubcategories,
  getParentForSubcategory,
  isServiceSubcategory,
  isValidCategoryCombo,
  NON_SERVICE_SUBCATEGORIES
} from './Categories';

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

import {
  WANTED_FIELDS_CONFIG,
  getWantedConfig,
  isSectionHiddenForWanted,
  isFieldHiddenForWanted,
  isFieldOptionalForWanted
} from './WantedFieldsConfig';

// Export everything individually
export {
  // Category management (new)
  CATEGORIES,
  getAllParentCategories,
  getSubcategories,
  getAllSubcategories,
  getParentForSubcategory,
  isServiceSubcategory,
  isValidCategoryCombo,
  NON_SERVICE_SUBCATEGORIES,
  // Field management
  getFieldsForCategory,
  getOrderedFieldsForCategory,
  getFormStructure,
  FORM_STRUCTURE,
  // Pricing management
  PRICING_CONFIG,
  getPricingOptionsForCategory,
  getAvailablePricingOptions,
  isPricingOptionValidForType,
  shouldShowPricingOption,
  // Engine
  FormEngine,
  getFormEngine,
  DependencyResolver,
  getDependencyResolver,
  // Wanted config
  WANTED_FIELDS_CONFIG,
  getWantedConfig,
  isSectionHiddenForWanted,
  isFieldHiddenForWanted,
  isFieldOptionalForWanted
};

// Export a unified API for the field system
export const FieldSystem = {
  // Category management (new two-level system)
  getAllParentCategories,
  getSubcategories,
  getAllSubcategories,
  getParentForSubcategory,
  isServiceSubcategory,
  isValidCategoryCombo,

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
  // Note: category parameter is now subcategory (the old flat category name)
  getFormConfiguration: (subcategory, userRole, formData = {}) => {
    const engine = getFormEngine(subcategory, userRole, formData);
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
      canAccess: true,
      fields: visibleFieldMap,
      orderedFields,
      pricingOptions,
      pricingConfig
    };
  },

  // New method for section-based rendering
  // Note: category parameter is now subcategory (the old flat category name)
  getFormSections: (subcategory, userRole, formData = {}) => {
    const engine = getFormEngine(subcategory, userRole, formData);
    return engine.getVisibleSections();
  }
};

// Default export for easy importing
export default FieldSystem;
