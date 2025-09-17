// components/advertsv2/fieldSystem/DependencyResolver.js

import { getFormStructure, getSharedField } from './FieldRegistry';
import { getAvailablePricingOptions, PRICING_CONFIG } from './PricingConfig';
import { canAccessCategory } from './CategoryAccess';
import { isSectionHiddenForWanted, isFieldHiddenForWanted, isFieldOptionalForWanted } from './WantedFieldsConfig';

export class FormEngine {
  constructor(category, userRole, formData = {}) {
    this.category = category;
    this.userRole = userRole;
    this.formData = formData;
    this.structure = getFormStructure(category);
  }

  canAccessCategory() {
    return canAccessCategory(this.userRole, this.category);
  }

  // Get a field value from the form data
  getFieldValue(fieldId) {
    if (this.formData.fields && this.formData.fields[fieldId] !== undefined) {
      return this.formData.fields[fieldId];
    }
    return this.formData[fieldId];
  }

  // Get the value of the type field for this category
  getTypeFieldValue() {
    if (!this.structure || !this.structure.typeField) return null;
    return this.getFieldValue(this.structure.typeField);
  }

  // Check if a section should be visible
  isSectionVisible(section) {
    // Check if section should be hidden for wanted ads
    if (this.formData.adType === 'wanted' && isSectionHiddenForWanted(this.category, section.id)) {
      return false;
    }
    
    if (section.requiresSection) {
      const requiredSection = this.getSectionById(section.requiresSection);
      if (!requiredSection || !this.isSectionComplete(requiredSection)) {
        return false;
      }
    }
    
    // Check section dependencies (like field dependencies)
    if (section.dependencies) {
      for (const [depField, allowedValues] of Object.entries(section.dependencies)) {
        let currentValue;
        if (depField === 'priceType') {
          // For priceType, check the pricing array
          const hasPriceType = this.formData.pricing?.some(p => allowedValues.includes(p.priceType));
          if (!hasPriceType) return false;
        } else {
          // For other fields, check the field value
          currentValue = this.getFieldValue(depField);
          if (!currentValue || !allowedValues.includes(currentValue)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  // Get a section by its ID
  getSectionById(sectionId) {
    if (!this.structure || !this.structure.sections) return null;
    return this.structure.sections.find(s => s.id === sectionId);
  }

  // Check if a section is complete (all required fields filled)
  isSectionComplete(section) {
    // Handle pricing section (specialField)
    if (section && section.specialField === 'pricing') {
      return this.formData.pricing && this.formData.pricing.length > 0;
    }

    if (!section || !section.fields) {
      return false;
    }

    // For regular sections, check required fields
    for (const fieldId of section.fields) {
      const fieldConfig = this.structure?.fields[fieldId];
      if (!fieldConfig) continue;
      if (fieldConfig.required && !this.getFieldValue(fieldId)) {
        return false;
      }
    }
    return true;
  }

  // Get visible fields for a section
  getVisibleFieldsForSection(section) {
    if (!section || !section.fields) return [];
    return section.fields
      .map(fieldId => {
        // First check if it's a category-specific field
        let fieldConfig = this.structure?.fields?.[fieldId];
        
        // If not found, check if it's a shared field
        if (!fieldConfig) {
          fieldConfig = getSharedField(fieldId);
        }
        
        if (!fieldConfig) return null;
        
        if (this.isFieldVisible(fieldId, fieldConfig)) {
          // Override required status based on context
          const dynamicRequired = this.isFieldRequired(fieldId, fieldConfig);
          return { 
            id: fieldId, 
            ...fieldConfig,
            required: dynamicRequired
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  // Check if a field should be visible based on dependencies
  isFieldVisible(fieldId, fieldConfig) {
    if (!fieldConfig) return false;
    
    // Check if field should be hidden for wanted ads
    if (this.formData.adType === 'wanted' && isFieldHiddenForWanted(this.category, fieldId)) {
      return false;
    }
    
    const dependencies = fieldConfig.dependencies || {};
    for (const [depField, allowedValues] of Object.entries(dependencies)) {
      let currentValue;
      if (depField === 'priceType') {
        // For wanted ads, ignore priceType dependencies since pricing is hidden
        if (this.formData.adType === 'wanted') {
          continue; // Skip this dependency check
        }
        currentValue = this.formData.pricing?.[0]?.priceType;
      } else {
        currentValue = this.getFieldValue(depField);
      }
      if (!currentValue || !allowedValues.includes(currentValue)) {
        return false;
      }
    }
    return true;
  }

  // Check if a field should be required based on context
  isFieldRequired(fieldId, fieldConfig) {
    if (!fieldConfig) return false;
    
    // If it's a wanted ad and field is in the optional list, it's not required
    if (this.formData.adType === 'wanted' && isFieldOptionalForWanted(this.category, fieldId)) {
      return false;
    }
    
    // Otherwise, use the field's configured required status
    return fieldConfig.required || false;
  }

  // Get available pricing options based on the selected type
  getAvailablePricingOptions() {
    const typeValue = this.getTypeFieldValue();
    return getAvailablePricingOptions(this.category, typeValue);
  }

  // Get pricing configuration
  getPricingConfig() {
    return PRICING_CONFIG[this.category];
  }

  // Get all visible sections with their fields
  getVisibleSections() {
    if (!this.canAccessCategory() || !this.structure || !this.structure.sections) {
      return [];
    }
    const visibleSections = [];
    for (const section of this.structure.sections) {
      if (!this.isSectionVisible(section)) continue;
      // Special handling for pricing section
      if (section.specialField === 'pricing') {
        const pricingOptions = this.getAvailablePricingOptions();
        if (Object.keys(pricingOptions).length > 0) {
          visibleSections.push({
            ...section,
            pricingOptions,
            pricingConfig: this.getPricingConfig()
          });
        }
      } else if (section.specialField === 'condition') {
        // Special handling for condition section
        visibleSections.push(section);
      } else {
        // Regular section with fields
        const visibleFields = this.getVisibleFieldsForSection(section);
        if (visibleFields.length > 0 || section.alwaysShow) {
          visibleSections.push({
            ...section,
            fields: visibleFields
          });
        }
      }
    }
    return visibleSections.sort((a, b) => a.order - b.order);
  }

  // Compatibility method for old interface
  getVisibleFields() {
    if (!this.canAccessCategory() || !this.structure || !this.structure.fields) {
      return {};
    }
    const visibleFields = {};
    for (const [fieldId, fieldConfig] of Object.entries(this.structure.fields)) {
      if (this.isFieldVisible(fieldId, fieldConfig)) {
        visibleFields[fieldId] = fieldConfig;
      }
    }
    return visibleFields;
  }

  // Update form data
  updateFormData(newData) {
    this.formData = { ...this.formData, ...newData };
  }
}

// For backward compatibility
export class DependencyResolver {
  constructor(category, userRole, formData = {}) {
    this.engine = new FormEngine(category, userRole, formData);
  }
  
  canAccessCategory() {
    return this.engine.canAccessCategory();
  }
  
  getVisibleFields() {
    return this.engine.getVisibleFields();
  }
  
  isFieldVisible(fieldId, fieldConfig) {
    return this.engine.isFieldVisible(fieldId, fieldConfig);
  }
  
  getVisiblePricingOptions() {
    return this.engine.getAvailablePricingOptions();
  }
  
  getPricingConfig() {
    return this.engine.getPricingConfig();
  }
  
  getFieldDependencies(fieldId) {
    const fieldConfig = this.engine.structure?.fields[fieldId];
    return {
      showWhen: fieldConfig?.dependencies || {},
      hideWhen: {},
      requiredWhen: {}
    };
  }
  
  updateFormData(newData) {
    this.engine.updateFormData(newData);
  }
}

// Singleton pattern for backward compatibility
let engineInstance = null;

export const getFormEngine = (category, userRole, formData = {}) => {
  if (
    !engineInstance ||
    engineInstance.category !== category ||
    engineInstance.userRole !== userRole
  ) {
    engineInstance = new FormEngine(category, userRole, formData);
  } else {
    engineInstance.updateFormData(formData);
  }
  return engineInstance;
};

// For backward compatibility
export const getDependencyResolver = (category, userRole, formData = {}) => {
  const engine = getFormEngine(category, userRole, formData);
  return new DependencyResolver(category, userRole, formData);
};
