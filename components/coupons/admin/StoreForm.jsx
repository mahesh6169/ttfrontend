'use client';

import { useState } from 'react';
import StoreAddressInput from '../StoreAddressInput';
import { STORE_CATEGORIES } from '../storeCategories';

export default function StoreForm({ initialData = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    storeName: initialData?.storeName || '',
    category: initialData?.category || '',
    address: initialData?.address || {
      formattedAddress: '',
      streetNumber: '',
      street: '',
      suburb: '',
      state: '',
      postalCode: '',
      location: { type: 'Point', coordinates: [0, 0] }
    },
    contactInfo: {
      phone: initialData?.contactInfo?.phone || '',
      email: initialData?.contactInfo?.email || ''
    },
    description: initialData?.description || '',
    isNationwide: initialData?.isNationwide || false,
    logo: null,
    keepExistingLogo: initialData?.logo ? true : false
  });

  const [logoPreview, setLogoPreview] = useState(initialData?.logo || null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, logo: 'Please select an image file' }));
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be under 2MB' }));
        return;
      }

      setFormData(prev => ({ 
        ...prev, 
        logo: file,
        keepExistingLogo: false
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      setErrors(prev => ({ ...prev, logo: null }));
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ 
      ...prev, 
      logo: null,
      keepExistingLogo: false
    }));
    setLogoPreview(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.isNationwide && (!formData.address?.formattedAddress || 
        formData.address.location?.coordinates[0] === 0 || 
        formData.address.location?.coordinates[1] === 0)) {
      newErrors.address = 'Valid address with location is required for location-specific stores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('storeName', formData.storeName);
      submitData.append('category', formData.category);
      submitData.append('address', JSON.stringify(formData.address));
      submitData.append('contactInfo', JSON.stringify(formData.contactInfo));
      submitData.append('description', formData.description);
      submitData.append('isNationwide', formData.isNationwide);
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }

      if (initialData && formData.keepExistingLogo) {
        submitData.append('keepExistingLogo', 'true');
      }

      await onSubmit(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Store Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Name *
        </label>
        <input
          type="text"
          name="storeName"
          value={formData.storeName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter store name"
        />
        {errors.storeName && (
          <p className="text-red-500 text-sm mt-1">{errors.storeName}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select category</option>
          {STORE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category}</p>
        )}
      </div>

      {/* Nationwide Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isNationwide"
          checked={formData.isNationwide}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-sm text-gray-700">
          Nationwide store (no specific location)
        </label>
      </div>

      {/* Address (conditional) */}
      {!formData.isNationwide && (
        <StoreAddressInput
          formData={formData}
          setFormData={setFormData}
          errors={errors.address ? [errors.address] : []}
          placeholder="Enter store address or suburb"
        />
      )}

      {/* Contact Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone
        </label>
        <input
          type="tel"
          name="contactInfo.phone"
          value={formData.contactInfo.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Phone number"
        />
      </div>

      {/* Contact Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email
        </label>
        <input
          type="email"
          name="contactInfo.email"
          value={formData.contactInfo.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Email address"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Store description (optional)"
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Store Logo
        </label>
        
        {logoPreview && (
          <div className="mb-3">
            <img 
              src={logoPreview} 
              alt="Logo preview" 
              className="w-32 h-32 object-contain border rounded"
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-sm text-red-500 mt-2"
            >
              Remove logo
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Max 2MB. JPEG, PNG, or WebP
        </p>
        {errors.logo && (
          <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
        )}
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Store' : 'Create Store')}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
