// components/advertsv2/AdvertForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
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
  userRole = 'user'
}) => {
  const [formData, setFormData] = useState(() => ({
    title: '',
    category: '',
    description: '',
    adType: 'offered',
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
  const [selectedPriceType, setSelectedPriceType] = useState('');
  const [existingImages, setExistingImages] = useState(initialData?.existingImages || []);

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
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
            amount: 0,
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
    setFormData(prev => ({
      ...prev,
      fields: { ...prev.fields, [fieldId]: value }
    }));
  };

  const handlePricingChange = (pricing) => {
    setFormData(prev => ({ ...prev, pricing }));
  };

  const handlePricingTypeSelect = (type, config) => {
    setSelectedPriceType(type);
    
    const newEntry = {
      priceType: type,
      amount: formData.pricing.find(p => p.priceType === type)?.amount || 0,
      unit: formData.pricing.find(p => p.priceType === type)?.unit || config.units?.[0] || ''
    };
    
    setFormData(prev => ({
      ...prev,
      pricing: [newEntry]
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
        return <input type="text" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={getPlaceholder()} className={baseClasses} required={field.required} />;
      case 'number':
        return <input type="number" value={value} onChange={e => handleFieldChange(field.id, parseFloat(e.target.value) || '')} min={field.min} max={field.max} placeholder={field.placeholder} className={baseClasses} required={field.required} />;
      case 'select':
        return (
          <select value={value} onChange={e => handleFieldChange(field.id, e.target.value)} className={baseClasses} required={field.required}>
            <option value="">Select {field.label}</option>
            {field.options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        );
      case 'textarea':
        return <textarea value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} className={`${baseClasses} h-24`} required={field.required} />;
      default:
        return null;
    }
  };

// Render the pricing inputs for the selected price type
const renderPricingInputs = (pricingOptions) => {
  if (!selectedPriceType || !pricingOptions[selectedPriceType]) return null;
  
  const config = pricingOptions[selectedPriceType];
  const current = formData.pricing.find(p => p.priceType === selectedPriceType) || { amount: 0, unit: '' };
  
  return (
    <div className="mt-4">
      <h3 className="font-bold text-lg mb-4 text-gray-700">Pricing<span className="text-red-500 ml-1">*</span></h3>
      <div className="mb-4">
        <label className="block font-semibold mb-1 text-gray-700">
          {config.label}
        </label>
        <div className="flex gap-4">
          <input
            type="number"
            min="0"
            step="0.01"
            value={current.amount}
            onChange={(e) => {
              const updated = formData.pricing.map(p =>
                p.priceType === selectedPriceType ? { ...p, amount: parseFloat(e.target.value) || 0 } : p
              );
              handlePricingChange(updated);
            }}
            className="p-2 border rounded w-40"
          />
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
  
  const validationErrors = [];
  
  // Cleaner title validation
  const titleTrimmed = (formData.title || '').trim();
  if (titleTrimmed === '') {
    validationErrors.push('Title is required');
  }
  
  // Category validation
  if (!formData.category) {
    validationErrors.push('Category is required');
  }
  
  // Cleaner description validation
  const descriptionTrimmed = (formData.description || '').trim();
  if (descriptionTrimmed === '') {
    validationErrors.push('Description is required');
  }
  
  // Address validation
  const isAddressOptional = FieldSystem.isAddressOptional(userRole, formData.category);
  
  if (!isAddressOptional && (
    !formData.address.formattedAddress || 
    formData.address.location.coordinates[0] === 0 || 
    formData.address.location.coordinates[1] === 0)) {
    validationErrors.push('Valid address with location is required');
  }
  
  // Validate visible fields in each section
  formSections.forEach(section => {
    if (section.specialField === 'pricing') {
      // Skip pricing validation entirely for wanted ads
      if (formData.adType === 'wanted') {
        return;
      }
      // Pricing validation for offered ads only
      if (formData.adType === 'offered' && Object.keys(section.pricingOptions || {}).length > 0) {
        // Only require pricing if pricing options are available and it's marked as required
        const pricingConfig = section.pricingConfig || {};
        if (pricingConfig.required !== false && formData.pricing.length === 0) {
          validationErrors.push('At least one pricing option is required');
        } else if (formData.pricing.length > 0) {
          formData.pricing.forEach(price => {
            
            if (section.pricingOptions[price.priceType]?.units && !price.unit) {
              validationErrors.push(`Please select a unit for ${section.pricingOptions[price.priceType].label}`);
            }
          });
        }
      }
    } else if (section.fields) {
      // Field validation
      section.fields.forEach(field => {
        if (field.required && !formData.fields[field.id]) {
          validationErrors.push(`${field.label} is required`);
        }
        if (field.type === 'number' && formData.fields[field.id] !== undefined) {
          const val = formData.fields[field.id];
          if (field.min !== undefined && val < field.min) {
            validationErrors.push(`${field.label} must be at least ${field.min}`);
          }
          if (field.max !== undefined && val > field.max) {
            validationErrors.push(`${field.label} must be at most ${field.max}`);
          }
        }
      });
    }
  });
  
  // Return early if validation fails
  if (validationErrors.length > 0) {
    setLocalErrors(validationErrors);
    return;
  }
  
  // Submit data
  const submitData = {
    title: formData.title,
    category: formData.category,
    description: formData.description,
    adType: formData.adType,
    address: formData.address,
    fields: formData.fields,
    pricing: formData.adType === 'wanted' ? [] : formData.pricing,
    communities: formData.communities,
    images: formData.images,
    existingImages: (formData.existingImages || []).filter(img => img && img.url),
  };
  
  onSubmit(submitData);
};

const allErrors = [...localErrors, ...errors];
const availableCategories = FieldSystem.getCategoriesForRole(userRole);

return (
  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Common fields - always show these */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">Title <span className="text-red-500">*</span></label>
      <input 
        type="text" 
        value={formData.title} 
        onChange={(e) => handleChange('title', e.target.value)} 
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300" 
        placeholder="Enter a descriptive title" 
      />
    </div>

    {/* Ad Type */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">Ad Type</label>
      <div className="flex border border-gray-300 rounded overflow-hidden">
        <button 
          type="button" 
          className={`flex-1 p-3 ${formData.adType === 'offered' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'}`} 
          onClick={() => handleChange('adType', 'offered')}
        >
          Offered
        </button>
        <button 
          type="button" 
          className={`flex-1 p-3 ${formData.adType === 'wanted' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'}`} 
          onClick={() => {
            // When switching to "wanted", clear pricing data
            setFormData(prev => ({
              ...prev,
              adType: 'wanted',
              pricing: []
            }));
            setSelectedPriceType('');
          }}
        >
          Wanted
        </button>
      </div>
    </div>

    {/* Category */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">Category <span className="text-red-500">*</span></label>
      <CategorySelector
        value={formData.category}
        onChange={(value) => handleChange('category', value)}
        categories={availableCategories}
        placeholder="Select a category"
        required={true}
      />
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
          {section.specialField === 'pricing' && formData.adType === 'offered' && (
            <>
            <h3 className="font-bold text-lg mb-2 text-gray-700">
              Pricing Type
              <span className="text-red-500 ml-1">*</span>
            </h3>
            
            <div className="flex flex-wrap gap-4 mb-4">
              {Object.entries(section.pricingOptions || {}).map(([type, config]) => (
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
          </>
        )}
        
        {/* Regular fields for non-pricing sections */}
        {section.fields && section.fields.map(field => (
          <div key={field.id} className="mb-4">
            <label className="block font-bold mb-2 text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
      );
    })}

    {/* Description - always show this */}
    <div>
      <label className="block font-bold mb-2 text-gray-700">Description <span className="text-red-500">*</span></label>
      <textarea 
        value={formData.description} 
        onChange={(e) => handleChange('description', e.target.value)} 
        className="w-full p-2 border border-gray-300 rounded h-32 focus:outline-none focus:ring-2 focus:ring-teal-300" 
        placeholder={formData.adType === 'wanted' 
          ? "Describe what you're looking for, including specific requirements or preferences" 
          : "Provide detailed information about your item or service"} 
      />
    </div>

    {/* Address */}
    <AddressInput formData={formData} setFormData={setFormData} disabled={isLoading} />

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

    {/* Errors */}
    {allErrors.length > 0 && (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="font-bold text-red-700 mb-2">Please fix the following errors:</p>
        <ul className="list-disc list-inside space-y-1">
          {allErrors.map((error, index) => (
            <li key={`${error}-${index}`} className="text-red-600 text-sm">{error}</li>
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
        {isLoading ? 
          (initialData ? 'Updating...' : 'Creating...') : 
          (initialData ? 'Update Listing' : 'Create Listing')}
      </button>
      <button 
        type="button" 
        onClick={() => window.history.back()} 
        className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </form>
);
};

export default AdvertForm;