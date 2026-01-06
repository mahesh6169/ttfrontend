'use client';

import React, { useState, useEffect } from 'react';
import { FaMobileAlt, FaEnvelope, FaGlobe, FaFacebook, FaInstagram, FaPlus, FaTimes } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const SOCIAL_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook', icon: FaFacebook },
  { value: 'Instagram', label: 'Instagram', icon: FaInstagram },
  { value: 'X', label: 'X (Twitter)', icon: FaXTwitter },
];

const ContactInfoInput = ({ value = {}, onChange }) => {
  // Track which fields are active/visible
  const [activeFields, setActiveFields] = useState({
    mobile: false,
    email: false,
    website: false,
    socialMedia: false,
  });

  // Track if we've done initial setup (to avoid re-running on every value change)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize activeFields based on existing values (for edit mode)
  // This runs when value prop changes and we haven't initialized yet
  useEffect(() => {
    // Check if there's any actual data to initialize from
    const hasData = value?.mobile || value?.email || value?.website || (value?.socialMedia?.length > 0);

    // Only initialize once when we have data, or if we're in add mode (no data expected)
    if (!hasInitialized && hasData) {
      setActiveFields({
        mobile: !!value?.mobile,
        email: !!value?.email,
        website: !!value?.website,
        socialMedia: value?.socialMedia?.length > 0,
      });
      setHasInitialized(true);
    }
  }, [value?.mobile, value?.email, value?.website, value?.socialMedia, hasInitialized]);

  const toggleField = (field) => {
    setActiveFields(prev => {
      const newState = { ...prev, [field]: !prev[field] };

      // If deactivating, clear the field value
      if (!newState[field]) {
        const newValue = { ...value };
        if (field === 'socialMedia') {
          newValue.socialMedia = [];
        } else {
          newValue[field] = '';
        }
        onChange(newValue);
      }

      return newState;
    });
  };

  // Clear a specific field (red X button)
  const clearField = (field) => {
    const newValue = { ...value };
    if (field === 'socialMedia') {
      newValue.socialMedia = [];
    } else {
      newValue[field] = '';
    }
    onChange(newValue);

    // Also deactivate the field
    setActiveFields(prev => ({ ...prev, [field]: false }));
  };

  const handleChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  const handleSocialMediaChange = (index, key, newValue) => {
    const newSocialMedia = [...(value.socialMedia || [])];
    newSocialMedia[index] = {
      ...newSocialMedia[index],
      [key]: newValue,
    };
    onChange({
      ...value,
      socialMedia: newSocialMedia,
    });
  };

  const addSocialMedia = () => {
    const currentSocial = value.socialMedia || [];
    if (currentSocial.length >= 3) return;

    onChange({
      ...value,
      socialMedia: [...currentSocial, { platform: '', url: '' }],
    });
  };

  const removeSocialMedia = (index) => {
    const newSocialMedia = [...(value.socialMedia || [])];
    newSocialMedia.splice(index, 1);
    onChange({
      ...value,
      socialMedia: newSocialMedia,
    });
  };

  // Get available platforms (exclude already selected ones)
  const getAvailablePlatforms = (currentIndex) => {
    const selectedPlatforms = (value.socialMedia || [])
      .map((s, i) => i !== currentIndex ? s.platform : null)
      .filter(Boolean);
    return SOCIAL_PLATFORMS.filter(p => !selectedPlatforms.includes(p.value));
  };

  const baseInputClasses = "w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg sm:rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-300";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-gray-700 text-sm sm:text-base">
          Contact Information <span className="text-gray-400 font-normal text-xs">(Optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Add contact details to help buyers reach you directly. Click icons to add.
        </p>
      </div>

      {/* Icon Buttons Row */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {/* Mobile Button */}
        <button
          type="button"
          onClick={() => toggleField('mobile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            activeFields.mobile
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
          }`}
        >
          <FaMobileAlt className="text-sm" />
          <span className="text-sm">Mobile</span>
        </button>

        {/* Email Button */}
        <button
          type="button"
          onClick={() => toggleField('email')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            activeFields.email
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
          }`}
        >
          <FaEnvelope className="text-sm" />
          <span className="text-sm">Email</span>
        </button>

        {/* Website Button */}
        <button
          type="button"
          onClick={() => toggleField('website')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            activeFields.website
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
          }`}
        >
          <FaGlobe className="text-sm" />
          <span className="text-sm">Website</span>
        </button>

        {/* Social Media Button */}
        <button
          type="button"
          onClick={() => toggleField('socialMedia')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            activeFields.socialMedia
              ? 'bg-teal-600 text-white border-teal-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
          }`}
        >
          <FaFacebook className="text-sm" />
          <span className="text-sm">Social</span>
        </button>
      </div>

      {/* Input Fields */}
      <div className="space-y-3">
        {/* Mobile Input */}
        {activeFields.mobile && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <button
                type="button"
                onClick={() => clearField('mobile')}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove mobile"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            <input
              type="tel"
              value={value.mobile || ''}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder="0412345678"
              className={baseInputClasses}
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">Australian format: 10 digits starting with 0</p>
          </div>
        )}

        {/* Email Input */}
        {activeFields.email && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <button
                type="button"
                onClick={() => clearField('email')}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove email"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            <input
              type="email"
              value={value.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
              className={baseInputClasses}
            />
          </div>
        )}

        {/* Website Input */}
        {activeFields.website && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Website
              </label>
              <button
                type="button"
                onClick={() => clearField('website')}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove website"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            <input
              type="url"
              value={value.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://www.example.com"
              className={baseInputClasses}
            />
          </div>
        )}

        {/* Social Media Inputs */}
        {activeFields.socialMedia && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Social Media Links <span className="text-gray-400 font-normal">(max 3)</span>
              </label>
              <button
                type="button"
                onClick={() => clearField('socialMedia')}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove all social media"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            {(value.socialMedia || []).map((social, index) => (
              <div key={index} className="flex gap-2 items-start">
                <select
                  value={social.platform || ''}
                  onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                  className="w-32 sm:w-40 p-3 sm:p-2 text-base sm:text-sm border rounded-lg sm:rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  <option value="">Platform</option>
                  {getAvailablePlatforms(index).map(platform => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                  {/* Keep current selection visible even if selected elsewhere */}
                  {social.platform && !getAvailablePlatforms(index).find(p => p.value === social.platform) && (
                    <option value={social.platform}>
                      {SOCIAL_PLATFORMS.find(p => p.value === social.platform)?.label || social.platform}
                    </option>
                  )}
                </select>
                <input
                  type="url"
                  value={social.url || ''}
                  onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                  placeholder="Profile URL"
                  className={`flex-1 ${baseInputClasses}`}
                />
                <button
                  type="button"
                  onClick={() => removeSocialMedia(index)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <FaTimes />
                </button>
              </div>
            ))}

            {/* Add Social Media Button */}
            {(value.socialMedia || []).length < 3 && (
              <button
                type="button"
                onClick={addSocialMedia}
                className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                <FaPlus className="text-xs" />
                Add Social Media Link
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInfoInput;
