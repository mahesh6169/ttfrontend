// components/advertsv2/AdvertForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddressInput from '../shared/AddressInput';
import ImageUploader from '../shared/ImageUploader';
import CategorySelector from '../shared/CategorySelector';
import CommunitySelector from '../shared/CommunitySelector';
import FieldSystem from './fieldSystem';

const AdvertForm = ({ 
  initialData = null, 
  onSubmit, 
  isLoading = false,
  errors = [],
  userRole = 'user',
  isSuccess = false
}) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState(() => ({
    title: '',
    category: '',
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
    images: []
  }));

  const [formSections, setFormSections] = useState([]);
  const [preview, setPreview] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedPriceType, setSelectedPriceType] = useState('');
  const [existingImages, setExistingImages] = useState(initialData?.existingImages || []);

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        condition: initialData.condition || '',
        fields: initialData.fields || {},
        pricing: initialData.pricing || [],
        communities: initialData.communities || [],
        images: [],
        // REMOVE THIS LINE: existingImages: initialData.existingImages || []
      });
      setExistingImages(initialData.existingImages || []);
      if (initialData.pricing && initialData.pricing.length > 0) {
        setSelectedPriceType(initialData.pricing[0].priceType);
      }
      setPreview([]);
    }
  }, [initialData]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      existingImages
    }));
  }, [existingImages]);
  
  

  // Update form sections when category or form data changes
  useEffect(() => {
    if (formData.category) {
      const sections = FieldSystem.getFormSections(
        formData.category,
        userRole,
        formData
      );
      setFormSections(sections);
    } else {
      setFormSections([]);
    }
  }, [formData.category, formData.fields, formData.pricing, formData.adType, userRole]);

  // Setup default pricing when category changes
  useEffect(() => {
    if (formData.adType === 'offered' && formData.category) {
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
  }, [formSections, formData.adType, formData.category, formData.pricing, selectedPriceType]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => {
      const newFields = { ...prev.fields, [fieldId]: value };
      
      // Check if this is a type field that other fields depend on
      const structure = FieldSystem.getFormStructure(prev.category);
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
    const baseClasses = `w-full p-2 border rounded focus:outline-none focus:ring-2 ${
      hasError ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
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
              <p className="text-red-500 text-sm mt-1">{fieldErrors[field.id]}</p>
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
                
                // Real-time validation for parking field
                if (field.id === 'parking' && numValue > 4) {
                  setFieldErrors(prev => ({ ...prev, [field.id]: 'Maximum 4 parking spaces allowed' }));
                } else {
                  // Clear field error when user fixes the value
                  setFieldErrors(prev => ({ ...prev, [field.id]: null }));
                }
                
                handleFieldChange(field.id, numValue);
              }} 
              onWheel={(e) => e.target.blur()} 
              min={field.min} 
              max={field.id === 'parking' ? undefined : field.max} 
              placeholder={field.placeholder || (field.id === 'parking' ? 'Max 4' : field.placeholder)} 
              className={baseClasses} 
              required={field.required} 
            />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      case 'select':
        // Check if this is vehicleType field in Cars & Vehicles category during edit
        const isVehicleTypeLocked = initialData && 
                                    formData.category === 'Cars & Vehicles' && 
                                    field.id === 'vehicleType';
        
        return (
          <div>
            <select 
              value={value} 
              onChange={e => handleFieldChange(field.id, e.target.value)} 
              className={`${baseClasses} ${isVehicleTypeLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
              required={field.required}
              disabled={isVehicleTypeLocked}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors[field.id]}</p>
            )}
          </div>
        );
      case 'textarea':
        return (
          <div>
            <textarea value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} className={`${baseClasses} h-24`} required={field.required} />
            {fieldErrors[field.id] && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors[field.id]}</p>
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
        <div className="flex gap-4">
          <div>
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
              className="p-2 border rounded w-40"
            />
            {fieldErrors[`pricing_${selectedPriceType}`] && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors[`pricing_${selectedPriceType}`]}</p>
            )}
          </div>
          {config.units && (
            <select
              value={current.unit || ''}
              onChange={(e) => {
                const updated = formData.pricing.map(p =>
                  p.priceType === selectedPriceType ? { ...p, unit: e.target.value } : p
                );
                handlePricingChange(updated);
              }}
              className="p-2 border rounded w-40"
            >
              <option value="">Select unit</option>
              {config.units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
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
  }
  
  // Cleaner description validation
  const descriptionTrimmed = (formData.description || '').trim();
  if (descriptionTrimmed === '') {
    newFieldErrors.description = 'Description is required';
  }
  
  // Address validation
  const isAddressOptional = FieldSystem.isAddressOptional(userRole, formData.category);
  
  if (!isAddressOptional && (
    !formData.address.formattedAddress || 
    formData.address.location.coordinates[0] === 0 || 
    formData.address.location.coordinates[1] === 0)) {
    newFieldErrors.address = 'Valid address with location is required';
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
          
          // Special validation for parking field
          if (field.id === 'parking' && val > 4) {
            newFieldErrors[field.id] = 'Maximum 4 parking spaces allowed';
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
  const structure = FieldSystem.getFormStructure(formData.category);
  
  if (structure && structure.fields) {
    // Only include fields that are currently visible
    formSections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (formData.fields[field.id] !== undefined) {
            cleanedFields[field.id] = formData.fields[field.id];
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
    description: formData.description,
    adType: formData.adType,
    condition: isConditionVisible ? (formData.condition || null) : null,  // Only include condition if visible
    address: formData.address,
    fields: cleanedFields,  // Use cleaned fields instead of all fields
    pricing: formData.adType === 'wanted' ? [] : formData.pricing,
    communities: formData.communities,
    images: formData.images,
    existingImages: (formData.existingImages || []).filter(img => img && img.url),
  };
  
  onSubmit(submitData);
};

const availableCategories = FieldSystem.getCategoriesForRole(userRole);

return (
  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Common fields - always show these */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">Title <span className="text-red-500">*</span></label>
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
        className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
          fieldErrors.title ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
        }`} 
        placeholder="Enter a descriptive title" 
      />
      {fieldErrors.title && (
        <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
      )}
    </div>

    {/* Ad Type */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">
        Ad Type
        {initialData && <span className="text-sm font-normal text-gray-500 ml-2">(Cannot be changed)</span>}
      </label>
      <div className="flex border border-gray-300 rounded overflow-hidden">
        <button 
          type="button" 
          disabled={!!initialData}
          className={`flex-1 p-3 ${formData.adType === 'offered' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`} 
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
          className={`flex-1 p-3 ${formData.adType === 'wanted' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'} ${initialData ? 'opacity-50 cursor-not-allowed' : ''}`} 
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

    {/* Category */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">
        Category <span className="text-red-500">*</span>
        {initialData && <span className="text-sm font-normal text-gray-500 ml-2">(Cannot be changed)</span>}
      </label>
      <CategorySelector
        value={formData.category}
        onChange={(value) => {
          if (!initialData) {
            handleChange('category', value);
            // Clear error when user selects
            if (fieldErrors.category) {
              setFieldErrors(prev => ({ ...prev, category: null }));
            }
          }
        }}
        categories={availableCategories}
        placeholder="Select a category"
        required={true}
        disabled={!!initialData}
      />
      {fieldErrors.category && (
        <p className="text-red-500 text-sm mt-1">{fieldErrors.category}</p>
      )}
    </div>

    {/* Community/Language Selection */}
    <CommunitySelector
      value={formData.communities}
      onChange={(value) => handleChange('communities', value)}
      label="Community/Language (Optional)"
      showHint={true}
    />

    {/* Render all form sections */}
    {formSections.map((section, index) => {
      // Skip pricing section entirely for wanted ads
      if (section.specialField === 'pricing' && formData.adType === 'wanted') {
        return null;
      }
      
      return (
        <div key={section.id} className={index > 0 ? "border-t pt-4" : ""}>
          {/* Section title if it has one - but not for pricing sections that will be handled specially */}
          {section.title && section.specialField !== 'pricing' && (
            <h3 className="font-bold text-lg mb-4 text-gray-700">{section.title}</h3>
          )}
          
          {/* Special handling for pricing section */}
          {section.specialField === 'pricing' && formData.adType === 'offered' && section.pricingOptions && Object.keys(section.pricingOptions).length > 0 && (
            <>
            <h3 className="font-bold text-lg mb-2 text-gray-700">
              {section.title}
              <span className="text-red-500 ml-1">*</span>
            </h3>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(section.pricingOptions).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  className={`px-4 py-2 border rounded ${
                    selectedPriceType === type
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  onClick={() => handlePricingTypeSelect(type, config)}
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
         formData.pricing.some(p => p.priceType === 'sell') && (
          <div className="mb-4">
            <label className="block font-bold mb-2 text-gray-700">
              Condition <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
              required={true}
            >
              <option value="">Select Condition</option>
              <option value="New">New</option>
              <option value="Used">Used</option>
              <option value="Refurbished">Refurbished</option>
            </select>
          </div>
        )}
        
        {/* Regular fields for non-pricing sections */}
        {section.fields && section.fields.map(field => {
          // Check if this is vehicleType field in Cars & Vehicles category during edit
          const isVehicleTypeLocked = initialData && 
                                      formData.category === 'Cars & Vehicles' && 
                                      field.id === 'vehicleType';
          
          return (
            <div key={field.id} className="mb-4">
              <label className="block font-bold mb-2 text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                {isVehicleTypeLocked && <span className="text-sm font-normal text-gray-500 ml-2">(Cannot be changed)</span>}
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
      <label className="block font-bold mb-2 text-gray-700">Description <span className="text-red-500">*</span></label>
      <textarea 
        value={formData.description} 
        onChange={(e) => {
          handleChange('description', e.target.value);
          // Clear error when user types
          if (fieldErrors.description) {
            setFieldErrors(prev => ({ ...prev, description: null }));
          }
        }} 
        className={`w-full p-2 border rounded h-32 focus:outline-none focus:ring-2 ${
          fieldErrors.description ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
        }`} 
        placeholder={formData.adType === 'wanted' 
          ? "Describe what you're looking for, including specific requirements or preferences" 
          : "Provide detailed information about your item or service"} 
      />
      {fieldErrors.description && (
        <p className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>
      )}
    </div>

    {/* Address */}
    <div>
      <AddressInput formData={formData} setFormData={setFormData} disabled={isLoading} />
      {fieldErrors.address && (
        <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>
      )}
    </div>

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
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="font-bold text-red-700 mb-2">Please fix the following errors:</p>
        <ul className="list-disc list-inside space-y-1">
          {localErrors.map((error, index) => (
            <li key={`local-${error}-${index}`} className="text-red-600 text-sm">{error}</li>
          ))}
          {errors.map((error, index) => (
            <li key={`backend-${error}-${index}`} className="text-red-600 text-sm">{error}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Submit */}
    <div className="flex gap-4">
      <button 
        type="submit" 
        disabled={isLoading} 
        className={`px-6 py-3 rounded font-medium ${
          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white'
        }`}
      >
        {isSuccess ? 
          (initialData ? 'Updated! Redirecting...' : 'Created! Redirecting...') : 
          isLoading ? 
            (initialData ? 'Updating...' : 'Creating...') : 
            (initialData ? 'Update Listing' : 'Create Listing')}
      </button>
      <button 
        type="button" 
        onClick={() => {
          // Check for stored cancel redirect first
          const storedRedirect = localStorage.getItem('cancelRedirectUrl');
          
          if (storedRedirect) {
            // Use stored redirect and clean up
            localStorage.removeItem('cancelRedirectUrl');
            router.push(storedRedirect);
          } else if (initialData) {
            // Editing mode - go back to manage ads
            router.push('/users/profile/manageads');
          } else {
            // Default: go to listings page
            router.push('/listings');
          }
        }} 
        className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </form>
);
};

export default AdvertForm;