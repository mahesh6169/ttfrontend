import { getFieldsForCategory } from './FieldRegistry';
import { shouldShowPricingOption, PRICING_CONFIG } from './PricingConfig';
import { canAccessCategory } from './CategoryAccess';

export class DependencyResolver {
  constructor(category, userRole, formData = {}) {
    this.category = category;
    this.userRole = userRole;
    this.formData = formData;
  }

  canAccessCategory() {
    return canAccessCategory(this.userRole, this.category);
  }

  getVisibleFields() {
    if (!this.canAccessCategory()) return [];

    const allFields = getFieldsForCategory(this.category);
    const visibleFields = {};

    for (const [fieldId, fieldConfig] of Object.entries(allFields)) {
      if (this.isFieldVisible(fieldId, fieldConfig)) {
        visibleFields[fieldId] = fieldConfig;
      }
    }

    return visibleFields;
  }

  isFieldVisible(fieldId, fieldConfig) {
    
  
    const deps = this.getFieldDependencies(fieldId);
  
    // Apply showWhen logic
    for (const [depField, valuesToShow] of Object.entries(deps.showWhen)) {
      let currentValue;
      
      // Special handling for priceType dependency
      if (depField === 'priceType') {
        // Always check the pricing array for the priceType value
        currentValue = this.formData.pricing?.[0]?.priceType;
      } else {
        // For other fields, check in the usual places
        currentValue = 
          this.formData.fields?.[depField] ??
          this.formData[depField];
      }
  
      if (!valuesToShow.includes(currentValue)) return false;
    }
  
    // Apply hideWhen logic (similar change needed here)
    for (const [depField, valuesToHide] of Object.entries(deps.hideWhen)) {
      let currentValue;
      
      if (depField === 'priceType') {
        currentValue = this.formData.pricing?.[0]?.priceType;
      } else {
        currentValue = 
          this.formData.fields?.[depField] ??
          this.formData[depField];
      }
  
      if (valuesToHide.includes(currentValue)) return false;
    }
  
    return true;
  }

  getVisiblePricingOptions() {
    const pricingConfig = this.getPricingConfig();
    if (!pricingConfig) return {};

    const visibleOptions = {};
    for (const [priceType, option] of Object.entries(pricingConfig.options)) {
      if (shouldShowPricingOption(this.category, priceType, this.formData.fields || {})) {
        visibleOptions[priceType] = option;
      }
    }

    return visibleOptions;
  }

  getPricingConfig() {
    return PRICING_CONFIG[this.category];
  }

  getFieldDependencies(fieldId) {
    // First, get all fields for the category
    const allFields = getFieldsForCategory(this.category);
    
    // Then retrieve the specific field config for the requested fieldId
    const fieldConfig = allFields[fieldId];
    
    return {
      showWhen: fieldConfig?.showWhen || {},
      hideWhen: fieldConfig?.hideWhen || {},
      requiredWhen: fieldConfig?.requiredWhen || {}
    };
  }

  updateFormData(newData) {
    this.formData = { ...this.formData, ...newData };
    return this.getVisibleFields();
  }
}

let resolverInstance = null;

export const getDependencyResolver = (category, userRole, formData) => {
  if (
    !resolverInstance ||
    resolverInstance.category !== category ||
    resolverInstance.userRole !== userRole
  ) {
    resolverInstance = new DependencyResolver(category, userRole, formData);
  } else {
    resolverInstance.updateFormData(formData);
  }

  return resolverInstance;
};
