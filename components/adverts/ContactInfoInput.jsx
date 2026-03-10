'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaMobileAlt, FaEnvelope, FaGlobe, FaFacebook, FaInstagram, FaPlus, FaTimes } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const SOCIAL_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook', icon: FaFacebook },
  { value: 'Instagram', label: 'Instagram', icon: FaInstagram },
  { value: 'X', label: 'X (Twitter)', icon: FaXTwitter },
];

const ContactInfoInput = ({ value = {}, onChange, errors = {} }) => {
  // Track which fields are active/visible
  const [activeFields, setActiveFields] = useState({
    mobile: false,
    email: false,
    website: false,
    socialMedia: false,
  });

  // Track if we've done initial setup (to avoid re-running on every value change)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(null);
  const dropdownRefs = useRef({});

  // Validation helpers
  const isValidMobile = (mobile) => {
    if (!mobile) return true;
    const cleaned = mobile.replace(/\s/g, '');
    return /^0\d{9}$/.test(cleaned);
  };

  const isValidEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidUrl = (url) => {
    if (!url) return true;
    return url.startsWith('https://') && url.length > 8;
  };

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

      if (!newState[field]) {
        // Deactivating - clear value and error
        const newValue = { ...value };
        if (field === 'socialMedia') {
          newValue.socialMedia = [];
        } else {
          delete newValue[field];
        }
        onChange(newValue);
        setFieldErrors(prev => ({ ...prev, [field]: null }));
      } else {
        // Activating
        if (field === 'socialMedia') {
          // Auto-add one entry
          onChange({ ...value, socialMedia: [{ platform: '', url: '' }] });
        } else {
          onChange({ ...value, [field]: '' });
        }
      }

      return newState;
    });
  };

  // Clear a specific field (red X button)
  const clearField = (field) => {
    const newValue = { ...value };
    if (field === 'socialMedia') {
      delete newValue.socialMedia;
    } else {
      delete newValue[field];
    }
    onChange(newValue);
    setFieldErrors(prev => ({ ...prev, [field]: null }));

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
    // Clear error for removed entry
    setFieldErrors(prev => ({ ...prev, [`social_${index}`]: null }));

    // Auto-deactivate when last entry removed
    if (newSocialMedia.length === 0) {
      setActiveFields(prev => ({ ...prev, socialMedia: false }));
    }
  };

  // Get available platforms (exclude already selected ones)
  const getAvailablePlatforms = (currentIndex) => {
    const selectedPlatforms = (value.socialMedia || [])
      .map((s, i) => i !== currentIndex ? s.platform : null)
      .filter(Boolean);
    return SOCIAL_PLATFORMS.filter(p => !selectedPlatforms.includes(p.value));
  };

  // Select platform from dropdown
  const selectPlatform = (index, platform) => {
    handleSocialMediaChange(index, 'platform', platform);
    setPlatformDropdownOpen(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (platformDropdownOpen !== null) {
        const ref = dropdownRefs.current[platformDropdownOpen];
        if (ref && !ref.contains(event.target)) {
          setPlatformDropdownOpen(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [platformDropdownOpen]);

  const getInputClasses = (hasError) => `w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
    hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
  }`;

  return (
    <div>
      {/* Header */}
      <span className="block font-semibold sm:font-bold text-slate-700 text-sm sm:text-base">
        Contact Information <span className="text-slate-400 font-normal text-xs">(Optional)</span>
      </span>
      <p className="text-xs text-slate-500 mt-1 mb-3">
        Add contact details to help buyers reach you directly
      </p>

      {/* Icon Buttons Row */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleField('mobile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            activeFields.mobile
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
          }`}
        >
          <FaMobileAlt />
          <span>Mobile</span>
        </button>

        <button
          type="button"
          onClick={() => toggleField('email')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            activeFields.email
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
          }`}
        >
          <FaEnvelope />
          <span>Email</span>
        </button>

        <button
          type="button"
          onClick={() => toggleField('website')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            activeFields.website
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
          }`}
        >
          <FaGlobe />
          <span>Website</span>
        </button>

        <button
          type="button"
          onClick={() => toggleField('socialMedia')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
            activeFields.socialMedia
              ? 'bg-teal-700 text-white border-teal-700'
              : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
          }`}
        >
          <FaFacebook />
          <span>Social</span>
        </button>
      </div>

      {/* Input Fields */}
      {(activeFields.mobile || activeFields.email || activeFields.website || activeFields.socialMedia) && (
        <div className="mt-4 space-y-4">
          {/* Mobile Input */}
          {activeFields.mobile && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Mobile Number</label>
                <button
                  type="button"
                  onClick={() => clearField('mobile')}
                  className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                  title="Remove"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
              <input
                type="tel"
                value={value.mobile || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('mobile', val);
                  if (val && !isValidMobile(val)) {
                    setFieldErrors(prev => ({ ...prev, mobile: 'Enter 10 digits starting with 0' }));
                  } else {
                    setFieldErrors(prev => ({ ...prev, mobile: null }));
                  }
                }}
                placeholder="0412345678"
                className={getInputClasses(fieldErrors.mobile || errors.mobile)}
                maxLength={10}
              />
              {(fieldErrors.mobile || errors.mobile) ? (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.mobile || errors.mobile}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Australian format: 10 digits starting with 0</p>
              )}
            </div>
          )}

          {/* Email Input */}
          {activeFields.email && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <button
                  type="button"
                  onClick={() => clearField('email')}
                  className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                  title="Remove"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
              <input
                type="email"
                value={value.email || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('email', val);
                  if (val && !isValidEmail(val)) {
                    setFieldErrors(prev => ({ ...prev, email: 'Enter a valid email address' }));
                  } else {
                    setFieldErrors(prev => ({ ...prev, email: null }));
                  }
                }}
                placeholder="your@email.com"
                className={getInputClasses(fieldErrors.email || errors.email)}
              />
              {(fieldErrors.email || errors.email) && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email || errors.email}</p>
              )}
            </div>
          )}

          {/* Website Input */}
          {activeFields.website && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Website</label>
                <button
                  type="button"
                  onClick={() => clearField('website')}
                  className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                  title="Remove"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
              <input
                type="url"
                value={value.website || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('website', val);
                  if (val && !isValidUrl(val)) {
                    setFieldErrors(prev => ({ ...prev, website: 'URL must start with https://' }));
                  } else {
                    setFieldErrors(prev => ({ ...prev, website: null }));
                  }
                }}
                placeholder="https://www.example.com"
                className={getInputClasses(fieldErrors.website || errors.website)}
              />
              {(fieldErrors.website || errors.website) && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.website || errors.website}</p>
              )}
            </div>
          )}

          {/* Social Media Inputs */}
          {activeFields.socialMedia && (
            <div className="space-y-3">
              {(value.socialMedia || []).map((social, index) => (
                <div key={index} className="space-y-2">
                  {/* Row 1: Platform + X */}
                  <div className="flex gap-2">
                    {/* Platform Dropdown */}
                    <div
                      ref={el => dropdownRefs.current[index] = el}
                      className="relative flex-1"
                    >
                      <button
                        type="button"
                        onClick={() => setPlatformDropdownOpen(platformDropdownOpen === index ? null : index)}
                        className={`w-full p-3 sm:p-2 text-base sm:text-sm text-left border rounded-lg bg-white flex items-center justify-between
                          ${social.platform ? 'text-slate-900' : 'text-slate-500'}
                          ${platformDropdownOpen === index ? 'border-teal-500 ring-2 ring-teal-300' : 'border-slate-300'}
                          hover:border-slate-400 transition-all duration-200`}
                      >
                        <span className="truncate pr-2">
                          {social.platform
                            ? SOCIAL_PLATFORMS.find(p => p.value === social.platform)?.label || social.platform
                            : 'Select platform'}
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${platformDropdownOpen === index ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {platformDropdownOpen === index && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                          <div className="max-h-60 overflow-y-auto">
                            {getAvailablePlatforms(index).map(platform => (
                              <button
                                key={platform.value}
                                type="button"
                                onClick={() => selectPlatform(index, platform.value)}
                                className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50
                                  focus:outline-none transition-colors text-sm
                                  ${social.platform === platform.value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
                              >
                                {platform.label}
                              </button>
                            ))}
                          </div>
                          {/* Mobile close button */}
                          <div className="p-2 border-t border-slate-100 md:hidden">
                            <button
                              type="button"
                              onClick={() => setPlatformDropdownOpen(null)}
                              className="w-full py-2 text-center text-slate-600 font-medium text-sm"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSocialMedia(index)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Row 2: Full-width URL */}
                  <input
                    type="url"
                    value={social.url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleSocialMediaChange(index, 'url', val);
                      if (val && !isValidUrl(val)) {
                        setFieldErrors(prev => ({ ...prev, [`social_${index}`]: 'URL must start with https://' }));
                      } else {
                        setFieldErrors(prev => ({ ...prev, [`social_${index}`]: null }));
                      }
                    }}
                    placeholder="https://..."
                    className={getInputClasses(fieldErrors[`social_${index}`] || errors.socialMedia?.[index])}
                  />
                  {(fieldErrors[`social_${index}`] || errors.socialMedia?.[index]) && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors[`social_${index}`] || errors.socialMedia?.[index]}</p>
                  )}
                </div>
              ))}

              {(value.socialMedia || []).length < 3 && (
                <button
                  type="button"
                  onClick={addSocialMedia}
                  className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
                >
                  <FaPlus className="text-xs" />
                  Add Social Media Link
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactInfoInput;
