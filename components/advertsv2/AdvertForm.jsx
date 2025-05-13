// components/adverts/AdvertForm.jsx
'use client';

import React, { useState, useEffect } from 'react';
import DynamicField from './DynamicField';
import DynamicPricing from './DynamicPricing';
import AddressInput from '../shared/AddressInput';
import ImageUploader from '../shared/ImageUploader';
import { 
  getCategoryConfig, 
  getCategoryNames,
  validateField
} from './CategoriesConfig';

const AdvertForm = ({ 
  initialData = null, 
  onSubmit, 
  isLoading = false,
  errors = [] 
}) => {
  const [formData, setFormData] = useState({
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
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    },
    images: []
  });

  const [categoryConfig, setCategoryConfig] = useState(null);
  const [preview, setPreview] = useState([]);
  const [localErrors, setLocalErrors] = useState([]);

  // Initialize form with existing data (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fields: initialData.fields || {},
        pricing: initialData.pricing || [],
        images: [], // ✅ reset uploaded images (new ones)
        existingImages: initialData.existingImages || [] // ✅ ensure this stays in formData for submission
      });
  
      setPreview([]); // ✅ prevent accidental preview
    }
  }, [initialData]);
  
  

  // Update category config when category changes
  useEffect(() => {
    if (formData.category) {
      const config = getCategoryConfig(formData.category);
      setCategoryConfig(config);
    }
  }, [formData.category]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: value
      }
    }));
  };

  const handlePricingChange = (pricing) => {
    setFormData(prev => ({ ...prev, pricing }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = [];
    
    // Core field validation
    if (!formData.title.trim()) {
      validationErrors.push('Title is required');
    }
    if (!formData.category) {
      validationErrors.push('Category is required');
    }
    
    // Category-specific field validation
    if (categoryConfig?.fields) {
      Object.entries(categoryConfig.fields).forEach(([fieldKey, fieldConfig]) => {
        const fieldErrors = validateField(fieldKey, fieldConfig, formData.fields[fieldKey]);
        validationErrors.push(...fieldErrors);
      });
    }
    
    // Pricing validation for offered ads
    if (formData.adType === 'offered' && categoryConfig?.pricing !== false) {
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

    // Description validation

    if (!formData.description?.trim()) {
      validationErrors.push('Description is required');
    }

    
    // Address validation
    if (!formData.address.formattedAddress || 
      formData.address.location.coordinates[0] === 0 || 
      formData.address.location.coordinates[1] === 0) {
    validationErrors.push('Valid address with location is required');
  }

    if (validationErrors.length > 0) {
      setLocalErrors(validationErrors);
      return;
    }
    
    // Clear errors and submit
    setLocalErrors([]);

// Prepare form data for submission
const submitData = {
  title: formData.title,
  category: formData.category,
  description: formData.description,
  adType: formData.adType,
  address: formData.address,  // Don't stringify here
  fields: formData.fields,    // Don't stringify here
  pricing: formData.pricing,  // Don't stringify here
  images: formData.images,
  existingImages: formData.existingImages || [] 
};

onSubmit(submitData);
  };

  const allErrors = [...localErrors, ...errors];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
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
            className={`flex-1 p-3 ${
              formData.adType === 'offered'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700'
            }`}
            onClick={() => handleChange('adType', 'offered')}
          >
            Offered
          </button>
          <button
            type="button"
            className={`flex-1 p-3 ${
              formData.adType === 'wanted'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700'
            }`}
            onClick={() => handleChange('adType', 'wanted')}
          >
            Wanted
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="">Select a category</option>
          {getCategoryNames().map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Category Fields */}
      {categoryConfig?.fields && (
        <div className="border-t pt-4">
          <h3 className="font-bold text-lg mb-4 text-gray-700">Category Details</h3>
          {Object.entries(categoryConfig.fields).map(([fieldKey, fieldConfig]) => (
            <DynamicField
              key={fieldKey}
              fieldKey={fieldKey}
              fieldConfig={fieldConfig}
              value={formData.fields[fieldKey]}
              onChange={handleFieldChange}
              formData={formData}
              errors={allErrors}
            />
          ))}
        </div>
      )}

      {/* Pricing */}
      {formData.adType === 'offered' && categoryConfig?.pricing && (
        <DynamicPricing
          pricingConfig={categoryConfig.pricing}
          pricing={formData.pricing}
          onChange={handlePricingChange}
          adType={formData.adType}
          errors={allErrors}
        />
      )}

      {/* Description */}
      <div>
        <label className="block font-bold mb-2 text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded h-32 focus:outline-none focus:ring-2 focus:ring-teal-300"
          placeholder="Provide detailed information about your item or service"
        />
      </div>

      {/* Address */}
      <AddressInput
        formData={formData}
        setFormData={setFormData}
      />

      {/* Images */}
      <ImageUploader
  mode={initialData ? 'edit' : 'create'}
  preview={preview}
  setPreview={setPreview}
  formData={formData}
  setFormData={setFormData}
  maxImages={categoryConfig?.validation?.maxImages || 5}
  existingImages={formData.existingImages || []}
  setExistingImages={(imgs) =>
    setFormData((prev) => ({
      ...prev,
      existingImages: imgs
    }))
  }
/>

      {/* Error Display */}
      {allErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="font-bold text-red-700 mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {allErrors.map((error, index) => (
              <li key={index} className="text-red-600 text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 rounded font-medium ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update Advert' : 'Create Advert')}
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