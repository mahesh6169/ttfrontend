'use client';

import { useState } from 'react';
import { FaFacebook, FaInstagram, FaPlus, FaTimes } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import PartnerStoreAddressInput from '../PartnerStoreAddressInput';
import { DEAL_CATEGORIES } from '../dealCategories';
import PartnerStoreImageUploader from './PartnerStoreImageUploader';

const SOCIAL_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook', icon: FaFacebook },
  { value: 'Instagram', label: 'Instagram', icon: FaInstagram },
  { value: 'X', label: 'X (Twitter)', icon: FaXTwitter },
];

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
      whatsappEnabled: initialData?.contactInfo?.whatsappEnabled || false,
      email: initialData?.contactInfo?.email || '',
      website: initialData?.contactInfo?.website || '',
      socialMedia: initialData?.contactInfo?.socialMedia || []
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

  // Social media handlers
  const handleSocialMediaChange = (index, key, newValue) => {
    const newSocialMedia = [...formData.contactInfo.socialMedia];
    newSocialMedia[index] = { ...newSocialMedia[index], [key]: newValue };
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, socialMedia: newSocialMedia }
    }));
  };

  const addSocialMedia = () => {
    if (formData.contactInfo.socialMedia.length >= 3) return;
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        socialMedia: [...prev.contactInfo.socialMedia, { platform: '', url: '' }]
      }
    }));
  };

  const removeSocialMedia = (index) => {
    const newSocialMedia = formData.contactInfo.socialMedia.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      contactInfo: { ...prev.contactInfo, socialMedia: newSocialMedia }
    }));
  };

  const getAvailablePlatforms = (currentIndex) => {
    const selected = formData.contactInfo.socialMedia
      .map((s, i) => i !== currentIndex ? s.platform : null)
      .filter(Boolean);
    return SOCIAL_PLATFORMS.filter(p => !selected.includes(p.value));
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

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Phone validation (Australian mobile: 10 digits starting with 0)
    if (formData.contactInfo.phone && !/^0\d{9}$/.test(formData.contactInfo.phone)) {
      newErrors.phone = 'Enter valid Australian mobile (10 digits starting with 0)';
    }

    // Email validation
    if (formData.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactInfo.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    // Website validation (must be valid HTTPS URL with proper domain)
    if (formData.contactInfo.website) {
      const websiteUrl = formData.contactInfo.website.trim();
      // Regex: https:// followed by domain with at least one dot and 2+ char TLD
      const urlPattern = /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(websiteUrl)) {
        newErrors.website = 'Enter a valid URL (e.g., https://example.com.au)';
      }
    }

    // Social media validation - if added, both platform and URL required, URL must be valid
    if (formData.contactInfo.socialMedia.length > 0) {
      const urlPattern = /^https:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;

      const incompleteSocial = formData.contactInfo.socialMedia.some(
        s => !s.platform || !s.url?.trim()
      );
      if (incompleteSocial) {
        newErrors.socialMedia = 'Please complete or remove empty social media links';
      } else {
        const invalidUrl = formData.contactInfo.socialMedia.some(
          s => !urlPattern.test(s.url.trim())
        );
        if (invalidUrl) {
          newErrors.socialMedia = 'Social media URLs must be valid (e.g., https://facebook.com/yourpage)';
        }
      }
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Business Name */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter business name"
        />
        {errors.businessName && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.businessName}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Select category</option>
          {DEAL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.category}</p>
        )}
      </div>

      {/* Nationwide Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isNationwide"
          checked={formData.isNationwide}
          onChange={handleChange}
          className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
        />
        <label className="text-sm sm:text-base text-gray-700">
          Nationwide store (no specific location)
        </label>
      </div>

      {/* Address (conditional) */}
      {!formData.isNationwide && (
        <div>
          <PartnerStoreAddressInput
            formData={formData}
            setFormData={setFormData}
            errors={errors.address ? [errors.address] : []}
            placeholder="Enter business address or suburb"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>
      )}

      {/* Contact Phone */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Contact Phone
        </label>
        <input
          type="tel"
          name="contactInfo.phone"
          value={formData.contactInfo.phone}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="0412345678"
        />
        {errors.phone && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone}</p>
        )}

        {/* WhatsApp Toggle */}
        {formData.contactInfo.phone && (
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              name="contactInfo.whatsappEnabled"
              checked={formData.contactInfo.whatsappEnabled}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  contactInfo: {
                    ...prev.contactInfo,
                    whatsappEnabled: e.target.checked
                  }
                }));
              }}
              className="mr-2 w-5 h-5 sm:w-4 sm:h-4"
            />
            <label className="text-sm text-gray-600">
              Enable WhatsApp for this number
            </label>
          </div>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Contact Email
        </label>
        <input
          type="email"
          name="contactInfo.email"
          value={formData.contactInfo.email}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="email@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Website */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Website
          <span className="block text-xs font-normal text-gray-500">Must be a valid URL starting with https://</span>
        </label>
        <input
          type="url"
          name="contactInfo.website"
          value={formData.contactInfo.website}
          onChange={handleChange}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="https://example.com"
        />
        {errors.website && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.website}</p>
        )}
      </div>

      {/* Social Media Links */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Social Media Links
          <span className="text-xs font-normal text-gray-500 ml-1">(max 3)</span>
        </label>

        {formData.contactInfo.socialMedia.map((social, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-2">
            <select
              value={social.platform}
              onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
              className="w-full sm:w-36 p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select</option>
              {getAvailablePlatforms(index).map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
              {social.platform && !getAvailablePlatforms(index).find(p => p.value === social.platform) && (
                <option value={social.platform}>
                  {SOCIAL_PLATFORMS.find(p => p.value === social.platform)?.label}
                </option>
              )}
            </select>
            <div className="flex gap-2 flex-1">
              <input
                type="url"
                value={social.url}
                onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="flex-1 p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => removeSocialMedia(index)}
                className="p-3 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ))}

        {formData.contactInfo.socialMedia.length < 3 && (
          <button
            type="button"
            onClick={addSocialMedia}
            className="flex items-center gap-2 text-sm sm:text-base text-teal-600 hover:text-teal-700 font-medium mt-2"
          >
            <FaPlus className="text-xs" />
            Add Social Media Link
          </button>
        )}

        {errors.socialMedia && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.socialMedia}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          maxLength={2000}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Brief description about the business"
        />
        <div className="flex justify-between mt-1">
          {errors.description && (
            <p className="text-red-500 text-xs sm:text-sm">{errors.description}</p>
          )}
          <p className="text-xs text-gray-400 ml-auto">{formData.description.length}/2000</p>
        </div>
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
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg sm:rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1 bg-teal-600 text-white py-3 sm:py-2 px-4 text-base sm:text-sm rounded-lg sm:rounded font-medium hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Business' : 'Add Business')}
        </button>
      </div>
    </form>
  );
}
