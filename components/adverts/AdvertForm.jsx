// components/advertsv2/AdvertForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import AddressInput from '../shared/AddressInput';
import ImageUploader from '../shared/ImageUploader';
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

  const [categoryConfig, setCategoryConfig] = useState(null);
  const [preview, setPreview] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);
  const [selectedPriceType, setSelectedPriceType] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fields: initialData.fields || {},
        pricing: initialData.pricing || [],
        images: [],
        existingImages: initialData.existingImages || []
      });
       // Add this code to set the selected price type from the existing data
    if (initialData.pricing && initialData.pricing.length > 0) {
      setSelectedPriceType(initialData.pricing[0].priceType);
    }
    
      setPreview([]);
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.category) {
      const config = FieldSystem.getFormConfiguration(
        formData.category,
        userRole,
        formData
      );
      setCategoryConfig(config);
    }
  }, [formData.category, formData.fields, formData.pricing, userRole]);

  useEffect(() => {
    if (formData.category && categoryConfig?.pricingOptions) {
      const priceTypes = Object.entries(categoryConfig.pricingOptions);
      if (formData.pricing.length === 0 && priceTypes.length > 0) {
        const [firstType, firstOption] = priceTypes[0];
        const defaultPricing = [{
          priceType: firstType,
          amount: 0,
          unit: firstOption.units?.[0] || ''
        }];
        setFormData(prev => ({ ...prev, pricing: defaultPricing }));
        setSelectedPriceType(firstType); // Make sure to set this value
      } else if (formData.pricing.length > 0) {
        // If pricing exists but selectedPriceType is empty, set it from existing pricing
        setSelectedPriceType(formData.pricing[0].priceType);
      }
    }
  }, [categoryConfig?.pricingOptions, formData.category]);

  useEffect(() => {
    if (formData.adType === 'offered' && formData.category && categoryConfig?.pricingOptions) {
      const priceTypes = Object.entries(categoryConfig.pricingOptions);
      if (formData.pricing.length === 0 && priceTypes.length > 0) {
        const [firstType, firstOption] = priceTypes[0];
        const defaultPricing = [{
          priceType: firstType,
          amount: 0,
          unit: firstOption.units?.[0] || ''
        }];
        setFormData(prev => ({ ...prev, pricing: defaultPricing }));
        setSelectedPriceType(firstType);
      }
    }
  }, [categoryConfig?.pricingOptions, formData.category, formData.adType]);
  

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      fields: { ...prev.fields, [fieldKey]: value }
    }));
  };

  const handlePricingChange = (pricing) => {
    setFormData(prev => ({ ...prev, pricing }));
  };
  const renderPricing = () => {
    if (
      !categoryConfig?.pricingOptions ||
      Object.keys(categoryConfig.pricingOptions).length === 0 ||
      !selectedPriceType
    ) return null;
  
    return (
      <div className="border-t pt-4">
        <h3 className="font-bold text-lg mb-4 text-gray-700">Pricing<span className="text-red-500 ml-1">*</span></h3>
        {Object.entries(categoryConfig.pricingOptions)
          .filter(([type]) => type === selectedPriceType)
          .map(([type, config]) => {
            const current = formData.pricing.find(p => p.priceType === type) || { amount: 0, unit: '' };
  
            return (
              <div key={type} className="mb-4">
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
                        p.priceType === type ? { ...p, amount: parseFloat(e.target.value) || 0 } : p
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
                          p.priceType === type ? { ...p, unit: e.target.value } : p
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
            );
          })}
      </div>
    );
  };
  

  const renderField = (field) => {
    const value = formData.fields[field.id] || '';
    const hasError = localErrors.some(err => err.includes(field.label));
    const baseClasses = `w-full p-2 border rounded focus:outline-none focus:ring-2 ${
      hasError ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300'
    }`;

    
    

    switch (field.type) {
      case 'text':
        return <input type="text" value={value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} className={baseClasses} required={field.required} />;
      case 'number':
        return <input type="number" value={value} onChange={e => handleFieldChange(field.id, parseFloat(e.target.value) || '')} min={field.min} max={field.max} className={baseClasses} required={field.required} />;
      case 'select':
        return (
          <select value={value} onChange={e => handleFieldChange(field.id, e.target.value)} className={baseClasses} >
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
  
    // Category field validation
    if (categoryConfig?.orderedFields) {
      // Get only the visible fields - those that have passed the showWhen conditions
      const visibleFields = categoryConfig.orderedFields.filter(field => 
        field.id !== 'pricing' && resolver.isFieldVisible(field.id, field)
      );
      
      // Validate only visible fields
      visibleFields.forEach(field => {
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
  
    // Pricing validation
    if (formData.adType === 'offered' && Object.keys(categoryConfig?.pricingOptions || {}).length > 0) {
      if (formData.pricing.length === 0) {
        validationErrors.push('At least one pricing option is required');
      } else {
        formData.pricing.forEach(price => {
          if (price.amount <= 0) {
            validationErrors.push(`${price.priceType} price must be greater than 0`);
          }
        });
      }
    }
  
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
      pricing: formData.pricing,
      images: formData.images,
      existingImages: formData.existingImages || []
    };
  
    onSubmit(submitData);
  };

  const resolver = formData.category
  ? FieldSystem.getDependencyResolver(formData.category, userRole, formData)
  : null;
  
  const allErrors = [...localErrors, ...errors];
  const availableCategories = FieldSystem.getCategoriesForRole(userRole);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      {/* Title */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">Title <span className="text-red-500">*</span></label>
        <input type="text" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Enter a descriptive title" />
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
          pricing: [] // Clear pricing data
        }));
        setSelectedPriceType(''); // Clear selected price type
      }}
    >
      Wanted
    </button>
  </div>
</div>

      {/* Category */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">Category <span className="text-red-500">*</span></label>
        <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300">
          <option value="">Select a category</option>
          {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>

      {/* Pricing Type Selector & Fields */}
{formData.adType === 'offered' && categoryConfig?.pricingOptions && Object.keys(categoryConfig.pricingOptions).length > 0 && (
  <div className="border-t pt-4">
    <h3 className="font-bold text-lg mb-2 text-gray-700">Pricing Type{formData.adType === 'offered' && <span className="text-red-500 ml-1">*</span>}</h3>
    <div className="flex flex-wrap gap-4 mb-4">
      {Object.entries(categoryConfig.pricingOptions).map(([type, config]) => (
        <button
          key={type}
          type="button"
          className={`px-4 py-2 border rounded ${
            selectedPriceType === type
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-700 border-gray-300'
          }`}
          onClick={() => {
            setSelectedPriceType(type);
            const newEntry = {
              priceType: type,
              amount: formData.pricing.find(p => p.priceType === type)?.amount || 0,
              unit: formData.pricing.find(p => p.priceType === type)?.unit || config.units?.[0] || ''
            };
          
            setFormData(prev => ({
              ...prev,
              pricing: [newEntry]  // ✅ Always overwrite pricing[0]
            }));
          }}
        >
          {config.label}
        </button>
      ))}
    </div>

    {/* Render Pricing Fields for selectedPriceType */}
    {renderPricing()}
  </div>
)}


      {/* Category Fields */}
      {categoryConfig?.orderedFields?.length > 0 && resolver && (
  <div className="border-t pt-4">
    <h3 className="font-bold text-lg mb-4 text-gray-700">Category Details</h3>
    {categoryConfig.orderedFields
     .filter(field =>
      field.id !== 'pricing' && 
      resolver.isFieldVisible(field.id, field)
    )
      .map(field => (
        <div key={field.id} className="mb-4">
          <label className="block font-bold mb-2 text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}
  </div>
)}




      {/* Description */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">Description <span className="text-red-500">*</span></label>
        <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full p-2 border border-gray-300 rounded h-32 focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="Provide detailed information about your item or service" />
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
        setExistingImages={(imgs) => setFormData(prev => ({ ...prev, existingImages: imgs }))}
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
      (initialData ? 'Update Advert' : 'Create Advert')}
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