'use client';

import { useState } from 'react';
import PartnerStoreAddressInput from '../PartnerStoreAddressInput';
import { DEAL_CATEGORIES } from '../dealCategories';
import PartnerStoreImageUploader from './PartnerStoreImageUploader';

export default function PartnerStoreForm({ initialData = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
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
      email: initialData?.contactInfo?.email || '',
      website: initialData?.contactInfo?.website || ''
    },
    description: initialData?.description || '',
    isNationwide: initialData?.isNationwide || false,
    logo: null,
    keepExistingLogo: false
  });

  const [existingLogo, setExistingLogo] = useState(initialData?.logo || null);
  const [logoPreview, setLogoPreview] = useState(null);
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

  const validate = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
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
      const submitData = new FormData();
      submitData.append('businessName', formData.businessName);
      submitData.append('category', formData.category);
      submitData.append('address', JSON.stringify(formData.address));
      submitData.append('contactInfo', JSON.stringify(formData.contactInfo));
      submitData.append('description', formData.description);
      submitData.append('isNationwide', formData.isNationwide);

      if (formData.logo) {
        submitData.append('logo', formData.logo);
      } else if (initialData && existingLogo) {
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
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter business name"
        />
        {errors.businessName && (
          <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
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
          {DEAL_CATEGORIES.map(cat => (
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
        <PartnerStoreAddressInput
          formData={formData}
          setFormData={setFormData}
          errors={errors.address ? [errors.address] : []}
          placeholder="Enter business address or suburb"
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

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website
        </label>
        <input
          type="url"
          name="contactInfo.website"
          value={formData.contactInfo.website}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="https://example.com"
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
          placeholder="Brief description about the business (optional)"
        />
      </div>

      {/* Logo Upload */}
      <PartnerStoreImageUploader
        mode={initialData ? 'edit' : 'create'}
        existingLogo={existingLogo}
        setExistingLogo={setExistingLogo}
        preview={logoPreview}
        setPreview={setLogoPreview}
        formData={formData}
        setFormData={setFormData}
      />

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
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Partner Store' : 'Create Partner Store')}
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
