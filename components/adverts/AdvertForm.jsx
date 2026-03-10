// components/advertsv2/AdvertForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddressInput from '../shared/AddressInput';
import ImageUploader from '../shared/ImageUploader';
import CategorySelector from './CategorySelector';
import CommunitySelector from '../shared/CommunitySelector';
import SimpleDropdown from '../shared/SimpleDropdown';
import FieldSystem from './fieldSystem';
import { getSharedField } from './fieldSystem/FieldRegistry';
import { needsCommunityField, isServiceSubcategory } from './fieldSystem/Categories';
import ContactInfoInput from './ContactInfoInput';

const AdvertForm = ({
  initialData = null,
  prefill = null,
  onSubmit,
  isLoading = false,
  errors = [],
  userRole = 'user',
  isSuccess = false
}) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState(() => ({
    title: '',
    category: prefill?.category || '',
    subcategory: prefill?.subcategory || '',
    description: '',
    adType: 'offered',
    condition: '',
    fields: {},
    pricing: [],
    communities: [],
    address: {
      formattedAddress: '',
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [0, 0] }
    },
    images: [],
    isNationwide: false,
    contactInfo: {},
    notifyOnWanted: false
  }));

  const [formSections, setFormSections] = useState([]);
  const [preview, setPreview] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedPriceType, setSelectedPriceType] = useState('');
  const [existingImages, setExistingImages] = useState(initialData?.existingImages || []);

  // Handle initial data - only on first load
  useEffect(() => {
    if (initialData && !formData.title) { // Only set if form is empty
      setFormData({
        ...initialData,
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        condition: initialData.condition || '',
        fields: initialData.fields || {},
        pricing: initialData.pricing || [],
        communities: initialData.communities || [],
        images: [],
        isNationwide: initialData.isNationwide || false,
        contactInfo: initialData.contactInfo || {
          mobile: '',
          email: '',
          website: '',
          socialMedia: []
        },
        notifyOnWanted: initialData.notifyOnWanted || false
      });
      setExistingImages(initialData.existingImages || []);
      if (initialData.pricing && initialData.pricing.length > 0) {
        setSelectedPriceType(initialData.pricing[0].priceType);
      }
      setPreview([]);
    }
  }, []); // Empty dependency - only run once on mount

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      existingImages
    }));
  }, [existingImages]);
  
  

  // Update form sections when subcategory or form data changes
  useEffect(() => {
    if (formData.subcategory) {
      const sections = FieldSystem.getFormSections(
        formData.subcategory,
        userRole,
        formData
      );
      setFormSections(sections);
    } else {
      setFormSections([]);
    }
  }, [formData.subcategory, formData.fields, formData.pricing, formData.adType, userRole]);

  // Setup default pricing when subcategory changes
  useEffect(() => {
    if (formData.adType === 'offered' && formData.subcategory) {
      const pricingSection = formSections.find(s => s.specialField === 'pricing');

      if (pricingSection && Object.keys(pricingSection.pricingOptions || {}).length > 0) {
        if (formData.pricing.length === 0) {
          const [firstType, firstOption] = Object.entries(pricingSection.pricingOptions)[0];

          const defaultPricing = [{
            priceType: firstType,
            amount: '',
            unit: firstOption.units?.[0] || ''
          }];

          setFormData(prev => ({ ...prev, pricing: defaultPricing }));
          setSelectedPriceType(firstType);
        } else if (!selectedPriceType && formData.pricing.length > 0) {
          setSelectedPriceType(formData.pricing[0].priceType);
        }
      }
    }
  }, [formSections, formData.adType, formData.subcategory, formData.pricing, selectedPriceType]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => {
      const newFields = { ...prev.fields, [fieldId]: value };

      // Check if this is a type field that other fields depend on
      const structure = FieldSystem.getFormStructure(prev.subcategory);
      if (structure && structure.typeField === fieldId) {
        // Clear fields that depend on the type field
        Object.entries(structure.fields || {}).forEach(([depFieldId, fieldConfig]) => {
          if (fieldConfig.dependencies && fieldConfig.dependencies[fieldId]) {
            // Check if the new value is in the allowed values for this field
            const allowedValues = fieldConfig.dependencies[fieldId];
            if (!allowedValues.includes(value)) {
              // Clear the field if the new type value doesn't support it
              delete newFields[depFieldId];
            }
          }
        });
      }
      
      return {
        ...prev,
        fields: newFields
      };
    });
  };

  const handlePricingChange = (pricing) => {
    setFormData(prev => ({ ...prev, pricing }));
  };

  // Validate decimal places for price fields
  const validatePriceDecimals = (value) => {
    if (!value || value === '') return true;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return true;
    const decimals = strValue.length - decimalIndex - 1;
    return decimals <= 2;
  };

  const handlePricingTypeSelect = (type, config) => {
    setSelectedPriceType(type);
    
    const newEntry = {
      priceType: type,
      amount: formData.pricing.find(p => p.priceType === type)?.amount || '',
      unit: formData.pricing.find(p => p.priceType === type)?.unit || config.units?.[0] || ''
    };
    
    // Clear condition if switching away from 'sell'
    const updates = {
      pricing: [newEntry]
    };
    
    if (type !== 'sell' && formData.condition) {
      updates.condition = '';
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Render a field based on its type
  const renderField = (field) => {
    const value = formData.fields[field.id] || '';
    const hasError = localErrors.some(err => err.includes(field.label));
    const baseClasses = `w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
      hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
    }`;

    // Dynamic placeholder for wanted ads
    const getPlaceholder = () => {
      if (formData.adType === 'wanted' && ['brand', 'make', 'model', 'jobTitle'].includes(field.id)) {
        const placeholderMap = {
          'brand': 'e.g., Any brand or specify preference',
          'make': 'e.g., Any make or specify preference',
          'model': 'e.g., Any model or specify preference',
          'jobTitle': 'e.g., Any job or specify preference'
        };
        return placeholderMap[field.id] || field.placeholder;
      }
      return field.placeholder;
    };

    switch (field.type) {
      case 'text':
        return (
          <div>
            <input type="text" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={getPlaceholder()} className={baseClasses} required={field.required} />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      case 'number':
        return (
          <div>
            <input 
              type="number" 
              value={value} 
              onChange={e => {
                const newValue = e.target.value;
                const numValue = newValue ? parseFloat(newValue) : '';
                
                // Clear field error when user fixes the value
                setFieldErrors(prev => ({ ...prev, [field.id]: null }));
                
                handleFieldChange(field.id, numValue);
              }} 
              onWheel={(e) => e.target.blur()} 
              min={field.min} 
              max={field.max} 
              placeholder={field.placeholder} 
              className={baseClasses} 
              required={field.required} 
            />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      case 'select':
        // Check if this is vehicleType field in Cars & Vehicles subcategory during edit
        const isVehicleTypeLocked = initialData &&
                                    formData.subcategory === 'Cars & Vehicles' &&
                                    field.id === 'vehicleType';

        // Check if this is a typeField (like propertyType, jobType, etc) during edit
        const structure = FieldSystem.getFormStructure(formData.subcategory);
        const isTypeField = structure && structure.typeField === field.id;
        
        return (
          <div>
            <SimpleDropdown
              value={value}
              onChange={(newValue) => handleFieldChange(field.id, newValue)}
              options={field.options}
              placeholder={`Select ${field.label}`}
              disabled={isVehicleTypeLocked || (!!initialData && isTypeField)}
            />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <textarea 
              value={value} 
              onChange={e => handleFieldChange(field.id, e.target.value)} 
              placeholder={field.placeholder} 
              className={`${baseClasses} min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y`} 
              required={field.required} 
            />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

// Render the pricing inputs for the selected price type
const renderPricingInputs = (pricingOptions) => {
  if (!selectedPriceType || !pricingOptions[selectedPriceType]) return null;
  
  const config = pricingOptions[selectedPriceType];
  const current = formData.pricing.find(p => p.priceType === selectedPriceType) || { amount: '', unit: '' };
  
  return (
    <div className="mt-4">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          <div className="sm:w-40">
            <input
              type="number"
              min="0"
              step="0.01"
              value={current.amount}
              onChange={(e) => {
                const newValue = e.target.value;
                
                // Clear pricing error when user starts typing
                setFieldErrors(prev => ({ ...prev, [`pricing_${selectedPriceType}`]: null }));
                
                // Allow typing but don't update if more than 2 decimals
                if (newValue && !validatePriceDecimals(newValue)) {
                  setFieldErrors(prev => ({ 
                    ...prev, 
                    [`pricing_${selectedPriceType}`]: 'Maximum 2 decimal places allowed' 
                  }));
                  return;
                }
                
                const updated = formData.pricing.map(p =>
                  p.priceType === selectedPriceType ? { ...p, amount: newValue ? parseFloat(newValue) : '' } : p
                );
                handlePricingChange(updated);
              }}
              onWheel={(e) => e.target.blur()}
              placeholder={selectedPriceType === 'sell' ? '0.00' : selectedPriceType === 'rent' ? '0.00' : '0.00'}
              className="w-full sm:w-40 p-3 sm:p-2 text-base sm:text-sm border rounded-lg border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            {fieldErrors[`pricing_${selectedPriceType}`] && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors[`pricing_${selectedPriceType}`]}</p>
            )}
          </div>
          {config.units && (
            <SimpleDropdown
              value={current.unit || ''}
              onChange={(newValue) => {
                const updated = formData.pricing.map(p =>
                  p.priceType === selectedPriceType ? { ...p, unit: newValue } : p
                );
                handlePricingChange(updated);
              }}
              options={config.units}
              placeholder="Select unit"
              className="sm:w-40"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const handleSubmit = (e) => {
  e.preventDefault();
  setLocalErrors([]);
  setFieldErrors({});
  
  const validationErrors = [];
  const newFieldErrors = {};
  
  // Cleaner title validation
  const titleTrimmed = (formData.title || '').trim();
  if (titleTrimmed === '') {
    newFieldErrors.title = 'Title is required';
  }
  
  // Category validation
  if (!formData.category) {
    newFieldErrors.category = 'Category is required';
  } else if (!formData.subcategory) {
    // Only validate subcategory if category is selected
    newFieldErrors.subcategory = 'Subcategory is required';
  }

  // Cleaner description validation
  const descriptionTrimmed = (formData.description || '').trim();
  if (descriptionTrimmed === '') {
    newFieldErrors.description = 'Description is required';
  }
  
  // Address validation - required for all listings
  if (!formData.address.formattedAddress ||
      formData.address.location.coordinates[0] === 0 ||
      formData.address.location.coordinates[1] === 0) {
    newFieldErrors.address = 'Valid address with location is required';
  }

  // Contact info validation - if field is activated (empty string) but not filled
  const contactInfo = formData.contactInfo || {};
  if (contactInfo.mobile === '') {
    newFieldErrors.contactMobile = 'Mobile number is required';
  }
  if (contactInfo.email === '') {
    newFieldErrors.contactEmail = 'Email address is required';
  }
  if (contactInfo.website === '') {
    newFieldErrors.contactWebsite = 'Website URL is required';
  }
  // Social media validation - if added but URL empty
  if (contactInfo.socialMedia && contactInfo.socialMedia.length > 0) {
    contactInfo.socialMedia.forEach((social, index) => {
      if (!social.url || social.url === '') {
        newFieldErrors[`contactSocial_${index}`] = 'Profile URL is required';
      }
    });
  }
  
  // Validate visible fields in each section
  formSections.forEach(section => {
    if (section.specialField === 'pricing') {
      // Skip pricing validation entirely for wanted ads
      if (formData.adType === 'wanted') {
        return;
      }
      // Pricing validation for offered ads only
      if (formData.adType === 'offered' && section.pricingOptions && Object.keys(section.pricingOptions).length > 0) {
        // Only require pricing if pricing options are available and it's marked as required
        const pricingConfig = section.pricingConfig || {};
        if (pricingConfig.required !== false && formData.pricing.length === 0) {
          validationErrors.push('At least one pricing option is required');
        } else if (formData.pricing.length > 0) {
          formData.pricing.forEach(price => {
            // Check if price amount is empty
            if (price.amount === '' || price.amount === null || price.amount === undefined) {
              newFieldErrors[`pricing_${price.priceType}`] = 'Price is required';
            }
            // Validate decimal places for pricing
            else if (price.amount && !validatePriceDecimals(price.amount)) {
              newFieldErrors[`pricing_${price.priceType}`] = 'Maximum 2 decimal places allowed';
            }
            
            if (section.pricingOptions[price.priceType]?.units && !price.unit) {
              // Don't add to validationErrors, put in field errors instead
              newFieldErrors[`pricing_${price.priceType}_unit`] = `Please select a unit`;
            }
          });
        }
      }
    } else if (section.fields) {
      // Field validation
      section.fields.forEach(field => {
        if (field.required && !formData.fields[field.id]) {
          // Put required field errors under the field instead of general errors
          newFieldErrors[field.id] = `${field.label} is required`;
        }
        if (field.type === 'number' && formData.fields[field.id] !== undefined && formData.fields[field.id] !== '') {
          const val = formData.fields[field.id];
          
          // Check min/max values
          if (field.min !== undefined && val < field.min) {
            newFieldErrors[field.id] = `Must be at least ${field.min}`;
          }
          if (field.max !== undefined && val > field.max) {
            newFieldErrors[field.id] = `Must be at most ${field.max}`;
          }
          
          // Ensure whole numbers for bedrooms and parking
          if ((field.id === 'bedrooms' || field.id === 'parking') && !Number.isInteger(val)) {
            newFieldErrors[field.id] = 'Must be a whole number';
          }
        }
      });
    }
  });
  
  // Return early if validation fails
  if (validationErrors.length > 0 || Object.keys(newFieldErrors).length > 0) {
    setLocalErrors(validationErrors);
    setFieldErrors(newFieldErrors);
    return;
  }
  
  // Clean up fields before submission - remove fields that don't belong to current configuration
  const cleanedFields = {};
  const structure = FieldSystem.getFormStructure(formData.subcategory);
  
  if (structure) {
    // Only include fields that are currently visible
    formSections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(fieldOrId => {
          // Handle both field objects and field ID strings
          const fieldId = typeof fieldOrId === 'string' ? fieldOrId : fieldOrId.id;
          if (fieldId && formData.fields[fieldId] !== undefined) {
            cleanedFields[fieldId] = formData.fields[fieldId];
          }
        });
      }
    });
  }
  
  // Check if condition section is visible
  const isConditionVisible = formSections.some(section => 
    section.specialField === 'condition' && 
    formData.adType === 'offered' &&
    formData.pricing.some(p => p.priceType === 'sell')
  );
  
  // Submit data
  const submitData = {
    title: formData.title,
    category: formData.category,
    subcategory: formData.subcategory,
    description: formData.description,
    adType: formData.adType,
    condition: isConditionVisible ? (formData.condition || null) : null,  // Only include condition if visible
    address: formData.address,
    fields: cleanedFields,  // Use cleaned fields instead of all fields
    pricing: formData.adType === 'wanted' ? [] : formData.pricing,
    communities: formData.communities,
    images: formData.images,
    existingImages: (formData.existingImages || []).filter(img => img && img.url),
    isNationwide: formData.isNationwide || false,
    contactInfo: formData.contactInfo,
    notifyOnWanted: formData.notifyOnWanted || false
  };
  
  onSubmit(submitData);
};

return (
  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
    {/* Common fields - always show these */}
    <div>
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
        Title <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => {
          handleChange('title', e.target.value);
          // Clear error when user types
          if (fieldErrors.title) {
            setFieldErrors(prev => ({ ...prev, title: null }));
          }
        }}
        className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
          fieldErrors.title ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
        }`}
        placeholder="Enter a descriptive title"
      />
      {fieldErrors.title && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors.title}</p>
      )}
    </div>

    {/* Ad Type */}
    <div>
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
        Ad Type
        {initialData && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:gap-0 sm:flex sm:border sm:border-slate-300 rounded-lg overflow-hidden">
        <button
          type="button"
          disabled={!!initialData}
          className={`py-2 px-3 sm:p-3 sm:flex-1 text-sm sm:text-base rounded-lg sm:rounded-none border sm:border-0 ${
            formData.adType === 'offered'
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300'
          } ${initialData ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
          onClick={() => {
            if (!initialData) {
              handleChange('adType', 'offered');
            }
          }}
        >
          Offered
        </button>
        <button
          type="button"
          disabled={!!initialData}
          className={`py-2 px-3 sm:p-3 sm:flex-1 text-sm sm:text-base rounded-lg sm:rounded-none border sm:border-0 ${
            formData.adType === 'wanted'
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300'
          } ${initialData ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
          onClick={() => {
            if (!initialData) {
              handleChange('adType', 'wanted');
            }
          }}
        >
          Wanted
        </button>
      </div>
    </div>

    {/* Category & Subcategory */}
    <div>
      <CategorySelector
        category={formData.category}
        subcategory={formData.subcategory}
        onCategoryChange={(value) => {
          if (!initialData) {
            handleChange('category', value);
            // Clear error when user selects
            if (fieldErrors.category) {
              setFieldErrors(prev => ({ ...prev, category: null }));
            }
          }
        }}
        onSubcategoryChange={(value) => {
          if (!initialData) {
            handleChange('subcategory', value);
            // Clear error when user selects
            if (fieldErrors.subcategory) {
              setFieldErrors(prev => ({ ...prev, subcategory: null }));
            }
          }
        }}
        placeholder="Select a category"
        disabled={!!initialData}
      />
      {fieldErrors.category && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors.category}</p>
      )}
      {fieldErrors.subcategory && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors.subcategory}</p>
      )}
    </div>

    {/* Community/Language Selection - Only for eligible subcategories */}
    {needsCommunityField(formData.subcategory) && (
      <CommunitySelector
        value={formData.communities}
        onChange={(value) => handleChange('communities', value)}
        label="Community/Language (Optional)"
        showHint={true}
      />
    )}

    {/* Render all form sections */}
    {formSections.map((section, index) => {
      // Skip pricing section entirely for wanted ads
      if (section.specialField === 'pricing' && formData.adType === 'wanted') {
        return null;
      }
      
      return (
        <div key={section.id} className={index > 0 ? "border-t border-slate-200 pt-4 sm:pt-6" : ""}>
          {/* Section title if it has one - but not for pricing sections that will be handled specially */}
          {section.title && section.specialField !== 'pricing' && (
            <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-3 sm:mb-4 text-slate-700">{section.title}</h3>
          )}
          
          {/* Special handling for pricing section */}
          {section.specialField === 'pricing' && formData.adType === 'offered' && section.pricingOptions && Object.keys(section.pricingOptions).length > 0 && (
            <>
            {section.title && (
              <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-2 sm:mb-3 text-slate-700">
                {section.title}
                <span className="text-red-500 ml-1">*</span>
                {initialData && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
              </h3>
            )}

            <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
              {Object.entries(section.pricingOptions).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  disabled={!!initialData}
                  className={`px-2 sm:px-4 py-2.5 sm:py-2 border rounded-lg text-sm sm:text-base ${
                    selectedPriceType === type
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  } ${initialData ? 'opacity-50 cursor-not-allowed' : ''} transition-colors`}
                  onClick={() => {
                    if (!initialData) {
                      handlePricingTypeSelect(type, config);
                    }
                  }}
                >
                  {config.label}
                </button>
              ))}
            </div>
            
            {/* Render the pricing inputs */}
            {renderPricingInputs(section.pricingOptions)}
            {/* Show unit selection error if exists */}
            {selectedPriceType && fieldErrors[`pricing_${selectedPriceType}_unit`] && (
              <p className="text-red-500 text-sm mt-2">{fieldErrors[`pricing_${selectedPriceType}_unit`]}</p>
            )}
          </>
        )}
        
        {/* Special handling for condition section */}
        {section.specialField === 'condition' && formData.adType === 'offered' && 
         formData.pricing.some(p => p.priceType === 'sell') && (() => {
          const conditionField = getSharedField('condition');
          if (!conditionField) return null;
          
          return (
            <div className="mb-4">
              <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                {conditionField.label}
                {conditionField.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <SimpleDropdown
                value={formData.condition}
                onChange={(newValue) => handleChange('condition', newValue)}
                options={conditionField.options}
                placeholder={conditionField.placeholder}
              />
            </div>
          );
        })()}
        
        {/* Regular fields for non-pricing sections */}
        {section.fields && section.fields.map(field => {
          // Check if this is vehicleType field in Cars & Vehicles subcategory during edit
          const isVehicleTypeLocked = initialData &&
                                      formData.subcategory === 'Cars & Vehicles' &&
                                      field.id === 'vehicleType';
          
          return (
            <div key={field.id} className="mb-4">
              <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isVehicleTypeLocked && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
              </label>
              {renderField(field)}
            </div>
          );
        })}
      </div>
      );
    })}

    {/* Description - always show this */}
    <div>
      <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
        Description <span className="text-red-500">*</span>
      </label>
      <textarea
        value={formData.description}
        onChange={(e) => {
          handleChange('description', e.target.value);
          // Clear error when user types
          if (fieldErrors.description) {
            setFieldErrors(prev => ({ ...prev, description: null }));
          }
        }}
        className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y focus:outline-none focus:ring-2 ${
          fieldErrors.description ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
        }`}
        placeholder={formData.adType === 'wanted'
          ? "Describe what you're looking for, including specific requirements or preferences"
          : "Provide detailed information about your item or service"}
        maxLength="15000"
      />
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          {fieldErrors.description && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors.description}</p>
          )}
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          {(formData.description || '').length}/15000
        </span>
      </div>
    </div>

    {/* Contact Information */}
    <ContactInfoInput
      value={formData.contactInfo}
      onChange={(contactInfo) => {
        handleChange('contactInfo', contactInfo);
        // Clear contact errors when user makes changes
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.contactMobile;
          delete newErrors.contactEmail;
          delete newErrors.contactWebsite;
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith('contactSocial_')) delete newErrors[key];
          });
          return newErrors;
        });
      }}
      errors={{
        mobile: fieldErrors.contactMobile,
        email: fieldErrors.contactEmail,
        website: fieldErrors.contactWebsite,
        socialMedia: Object.entries(fieldErrors)
          .filter(([key]) => key.startsWith('contactSocial_'))
          .reduce((acc, [key, val]) => {
            const index = parseInt(key.replace('contactSocial_', ''));
            acc[index] = val;
            return acc;
          }, {})
      }}
    />

    {/* Address */}
    <div>
      <AddressInput formData={formData} setFormData={setFormData} disabled={isLoading} />
      {fieldErrors.address && (
        <p className="text-red-500 text-xs sm:text-sm mt-1">{fieldErrors.address}</p>
      )}
    </div>

    {/* Nationwide visibility */}
    <div>
      <label className="cursor-pointer">
        <span className="block font-semibold sm:font-bold text-slate-700 text-sm sm:text-base">Advertise this Ad Nationwide</span>
        <p className="text-xs text-slate-500 mt-1 mb-2">Your ad will appear when users search in any state</p>
        <input
          type="checkbox"
          checked={formData.isNationwide || false}
          onChange={(e) => handleChange('isNationwide', e.target.checked)}
          className="w-5 h-5 text-teal-700 rounded focus:ring-teal-500"
        />
      </label>
    </div>

    {/* Notify on Wanted Ads - only for offered ads in service categories */}
    {formData.adType === 'offered' && formData.subcategory && isServiceSubcategory(formData.subcategory) && (
      <div>
        <label className="cursor-pointer">
          <span className="block font-semibold sm:font-bold text-slate-700 text-sm sm:text-base">Notify me when wanted ads are posted</span>
          <p className="text-xs text-slate-500 mt-1 mb-2">Get notified when someone posts a wanted ad matching your service category and location</p>
          <input
            type="checkbox"
            checked={formData.notifyOnWanted || false}
            onChange={(e) => handleChange('notifyOnWanted', e.target.checked)}
            className="w-5 h-5 text-teal-700 rounded focus:ring-teal-500"
          />
        </label>
      </div>
    )}

    {/* Images */}
    <ImageUploader
      mode={initialData ? 'edit' : 'create'}
      preview={preview}
      setPreview={setPreview}
      formData={formData}
      setFormData={setFormData}
      maxImages={10}
      existingImages={formData.existingImages || []}
      setExistingImages={setExistingImages}
    />

    {/* Errors - Only show general errors that aren't field-specific */}
    {(localErrors.length > 0 || errors.length > 0) && (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
        <p className="font-semibold sm:font-bold text-red-700 mb-2 text-sm sm:text-base">Please fix the following errors:</p>
        <ul className="list-disc list-inside space-y-1">
          {localErrors.map((error, index) => (
            <li key={`local-${error}-${index}`} className="text-red-600 text-xs sm:text-sm">{error}</li>
          ))}
          {errors.map((error, index) => (
            <li key={`backend-${error}-${index}`} className="text-red-600 text-xs sm:text-sm">{error}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Submit */}
    <div className="text-center">
      <button
        type="submit"
        disabled={isLoading}
        className={`px-8 py-3 rounded-lg font-semibold text-sm sm:text-base ${
          isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800 text-white'
        } transition-colors`}
      >
        {isSuccess ?
          (initialData ? 'Updated!' : 'Created!') :
          isLoading ?
            (initialData ? 'Updating...' : 'Creating...') :
            (initialData ? 'Update' : 'Create')}
      </button>
    </div>
  </form>
);
};

export default AdvertForm;