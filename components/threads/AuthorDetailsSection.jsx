import React, { useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { FaMobileAlt, FaEnvelope, FaGlobe, FaUser, FaShareAlt, FaTimes, FaPlus } from 'react-icons/fa';

const SOCIAL_MEDIA_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Twitter', label: 'X (Twitter)' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Pinterest', label: 'Pinterest' },
  { value: 'Other', label: 'Other' }
];

const AuthorDetailsSection = forwardRef(({ formData = {}, onChange, errors = {}, userName = '' }, ref) => {
  const [showAuthorDetails, setShowAuthorDetails] = useState(false);
  const [activeFields, setActiveFields] = useState({
    contact: false,
    email: false,
    website: false,
    aboutMyself: false,
    socialMedia: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(null); // index of open dropdown
  const dropdownRefs = useRef({});

  // Initialize author object if it doesn't exist
  const author = formData.author || {
    name: '',
    website: '',
    contact: '',
    email: '',
    aboutMyself: '',
    socialMedia: []
  };

  // Initialize states based on existing author data (for edit mode)
  useEffect(() => {
    const hasAnyAuthorData = author.name || author.website || author.contact ||
                             author.email || author.aboutMyself ||
                             (author.socialMedia && author.socialMedia.length > 0);
    if (hasAnyAuthorData && !showAuthorDetails) {
      setShowAuthorDetails(true);
    }
  }, []);

  // Initialize activeFields based on existing author data (for edit mode)
  useEffect(() => {
    if (formData.author && !hasInitialized) {
      const hasData = formData.author.website || formData.author.contact ||
                      formData.author.email || formData.author.aboutMyself ||
                      (formData.author.socialMedia?.length > 0);

      if (hasData) {
        setActiveFields({
          website: !!formData.author.website,
          contact: !!formData.author.contact,
          email: !!formData.author.email,
          aboutMyself: !!formData.author.aboutMyself,
          socialMedia: formData.author.socialMedia?.length > 0,
        });
        setHasInitialized(true);
      }
    }
  }, [formData.author, hasInitialized]);

  // Validation helpers
  const validateUrl = (url) => {
    if (!url || url.trim() === '') return null;
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('https://')) {
      return 'URL must start with https://';
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Enter a valid email';
  };

  const handleAuthorChange = (field, value) => {
    onChange({
      ...formData,
      author: {
        ...author,
        [field]: value
      }
    });

    // Clear errors when user types
    setFieldErrors(prev => {
      const next = { ...prev };
      if (next[field]) next[field] = null;
      // Clear the "add at least one detail" error once a qualifying field has a value
      if (next.atLeastOne && ['aboutMyself', 'contact', 'email', 'website'].includes(field) && value?.trim()) {
        next.atLeastOne = null;
      }
      return next;
    });
  };

  const toggleField = (field) => {
    setActiveFields(prev => {
      const newState = { ...prev, [field]: !prev[field] };

      if (!newState[field]) {
        // Deactivating - clear value and error
        if (field === 'socialMedia') {
          handleAuthorChange('socialMedia', []);
        } else {
          handleAuthorChange(field, '');
        }
        setFieldErrors(prev => ({ ...prev, [field]: null }));
      } else {
        // Activating - auto-add one entry for socialMedia
        if (field === 'socialMedia') {
          handleAuthorChange('socialMedia', [{ platform: '', url: '' }]);
        }
      }

      return newState;
    });
  };

  const clearField = (field) => {
    if (field === 'socialMedia') {
      handleAuthorChange('socialMedia', []);
    } else {
      handleAuthorChange(field, '');
    }
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    setActiveFields(prev => ({ ...prev, [field]: false }));
  };

  // Social media handlers
  const addSocialMedia = () => {
    const current = author.socialMedia || [];
    handleAuthorChange('socialMedia', [...current, { platform: '', url: '' }]);
  };

  const updateSocialMedia = (index, key, value) => {
    const updated = [...(author.socialMedia || [])];
    updated[index] = { ...updated[index], [key]: value };
    handleAuthorChange('socialMedia', updated);

    if (key === 'url' && fieldErrors[`social_${index}`]) {
      setFieldErrors(prev => ({ ...prev, [`social_${index}`]: null }));
    }
  };

  const removeSocialMedia = (index) => {
    const updated = (author.socialMedia || []).filter((_, i) => i !== index);
    handleAuthorChange('socialMedia', updated);
    setFieldErrors(prev => ({ ...prev, [`social_${index}`]: null }));

    // Auto-deactivate section when last entry removed
    if (updated.length === 0) {
      setActiveFields(prev => ({ ...prev, socialMedia: false }));
    }
  };

  // Get available platforms (exclude already selected)
  const getAvailablePlatforms = (currentIndex) => {
    const selected = (author.socialMedia || [])
      .map((s, i) => i !== currentIndex ? s.platform : null)
      .filter(Boolean);
    return SOCIAL_MEDIA_PLATFORMS.filter(p => !selected.includes(p.value));
  };

  // Select platform from dropdown
  const selectPlatform = (index, platform) => {
    updateSocialMedia(index, 'platform', platform);
    setPlatformDropdownOpen(null);
    // Clear platform error
    if (fieldErrors[`social_platform_${index}`]) {
      setFieldErrors(prev => ({ ...prev, [`social_platform_${index}`]: null }));
    }
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

  // Handle checkbox toggle
  const handleCheckboxToggle = (checked) => {
    setShowAuthorDetails(checked);

    if (checked) {
      // Prefill author name with username
      if (userName) {
        onChange({
          ...formData,
          author: {
            name: userName,
            website: '',
            contact: '',
            email: '',
            aboutMyself: '',
            socialMedia: []
          }
        });
      }
    } else {
      // Clear all author data
      onChange({
        ...formData,
        author: {
          name: '',
          website: '',
          contact: '',
          email: '',
          aboutMyself: '',
          socialMedia: []
        }
      });
      setActiveFields({
        contact: false,
        email: false,
        website: false,
        aboutMyself: false,
        socialMedia: false,
      });
      setFieldErrors({});
    }
  };

  // Validate all fields before form submission
  // When a field is toggled ON, it becomes mandatory
  const validateFields = () => {
    if (!showAuthorDetails) return true;

    const newErrors = {};

    // About Myself - mandatory if toggled on
    if (activeFields.aboutMyself && !author.aboutMyself?.trim()) {
      newErrors.aboutMyself = 'Please enter about yourself or turn off this field';
    }

    // Contact - mandatory if toggled on
    if (activeFields.contact && !author.contact?.trim()) {
      newErrors.contact = 'Please enter mobile number or turn off this field';
    }

    // Email - mandatory if toggled on, also validate format
    if (activeFields.email) {
      if (!author.email?.trim()) {
        newErrors.email = 'Please enter email or turn off this field';
      } else {
        const emailError = validateEmail(author.email);
        if (emailError) newErrors.email = emailError;
      }
    }

    // Website - mandatory if toggled on, also validate format
    if (activeFields.website) {
      if (!author.website?.trim()) {
        newErrors.website = 'Please enter website or turn off this field';
      } else {
        const urlError = validateUrl(author.website);
        if (urlError) newErrors.website = urlError;
      }
    }

    // Social Media - each entry must have platform and URL if section is active
    if (activeFields.socialMedia) {
      (author.socialMedia || []).forEach((social, index) => {
        if (!social.platform) {
          newErrors[`social_platform_${index}`] = 'Please select a platform';
        }
        if (!social.url?.trim()) {
          newErrors[`social_${index}`] = 'Please enter URL or remove this link';
        } else {
          const urlError = validateUrl(social.url);
          if (urlError) newErrors[`social_${index}`] = urlError;
        }
      });
    }

    // At least one contact detail is required when Author Details is opted in
    const hasAtLeastOneDetail =
      !!author.aboutMyself?.trim() ||
      !!author.contact?.trim() ||
      !!author.email?.trim() ||
      !!author.website?.trim();
    if (!hasAtLeastOneDetail) {
      newErrors.atLeastOne = 'Add at least one detail — About, Mobile, Email, or Website.';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose validation function to parent
  useImperativeHandle(ref, () => ({
    validateFields,
    isOptedIn: () => showAuthorDetails
  }));

  const getInputClasses = (hasError) => `w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
    hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'
  }`;

  const getToggleClasses = (isActive) => `flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
    isActive
      ? 'bg-teal-700 text-white border-teal-700'
      : 'bg-white text-slate-700 border-slate-300 hover:border-teal-400'
  }`;

  return (
    <div className="mb-4">
      {/* Opt-in Checkbox */}
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          id="showAuthorDetails"
          checked={showAuthorDetails}
          onChange={(e) => handleCheckboxToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-teal-600 focus:ring-teal-300 border-slate-300 rounded"
        />
        <div className="flex-1">
          <label htmlFor="showAuthorDetails" className="cursor-pointer">
            <span className="block font-medium text-slate-600 text-sm sm:text-base">
              Author Details <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </span>
            <p className="text-xs text-slate-500 mt-1">
              I am a blogger or content creator - let people know more about me
            </p>
          </label>
        </div>
      </div>

      {showAuthorDetails && (
        <div className="space-y-4 p-4 rounded-lg border border-slate-200">
          {/* Author Name - Always visible */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Author Name <span className="text-xs text-slate-500">(defaults to username)</span>
            </label>
            <input
              type="text"
              value={author.name || ''}
              onChange={(e) => handleAuthorChange('name', e.target.value)}
              className={getInputClasses(false)}
              placeholder="Your name or pen name"
              maxLength={100}
            />
          </div>

          {/* Toggle Buttons */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Add details (tap to toggle)</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleField('aboutMyself')}
                className={getToggleClasses(activeFields.aboutMyself)}
              >
                <FaUser />
                <span>About</span>
              </button>

              <button
                type="button"
                onClick={() => toggleField('contact')}
                className={getToggleClasses(activeFields.contact)}
              >
                <FaMobileAlt />
                <span>Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => toggleField('email')}
                className={getToggleClasses(activeFields.email)}
              >
                <FaEnvelope />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => toggleField('website')}
                className={getToggleClasses(activeFields.website)}
              >
                <FaGlobe />
                <span>Website</span>
              </button>

              <button
                type="button"
                onClick={() => toggleField('socialMedia')}
                className={getToggleClasses(activeFields.socialMedia)}
              >
                <FaShareAlt />
                <span>Social</span>
              </button>
            </div>
            {fieldErrors.atLeastOne && (
              <p className="text-xs text-red-500 mt-2">{fieldErrors.atLeastOne}</p>
            )}
          </div>

          {/* Dynamic Input Fields */}
          {(activeFields.aboutMyself || activeFields.contact || activeFields.email || activeFields.website || activeFields.socialMedia) && (
            <div className="space-y-4 pt-2">
              {/* About Myself */}
              {activeFields.aboutMyself && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600">About Myself</label>
                    <button
                      type="button"
                      onClick={() => clearField('aboutMyself')}
                      className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                      title="Remove"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                  <textarea
                    value={author.aboutMyself || ''}
                    onChange={(e) => handleAuthorChange('aboutMyself', e.target.value)}
                    className={`${getInputClasses(fieldErrors.aboutMyself)} resize-none`}
                    placeholder="Tech blogger, Python enthusiast..."
                    maxLength={500}
                    rows={3}
                  />
                  <div className="flex justify-between items-start mt-1">
                    <div className="flex-1">
                      {fieldErrors.aboutMyself && (
                        <p className="text-xs text-red-500">{fieldErrors.aboutMyself}</p>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {(author.aboutMyself || '').length}/500
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile/Contact */}
              {activeFields.contact && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600">Mobile Number</label>
                    <button
                      type="button"
                      onClick={() => clearField('contact')}
                      className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                      title="Remove"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                  <input
                    type="tel"
                    value={author.contact || ''}
                    onChange={(e) => handleAuthorChange('contact', e.target.value)}
                    className={getInputClasses(fieldErrors.contact)}
                    placeholder="+61 4XX XXX XXX"
                    maxLength={20}
                  />
                  {fieldErrors.contact && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.contact}</p>
                  )}
                </div>
              )}

              {/* Email */}
              {activeFields.email && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600">Email Address</label>
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
                    value={author.email || ''}
                    onChange={(e) => {
                      handleAuthorChange('email', e.target.value);
                      const error = validateEmail(e.target.value);
                      setFieldErrors(prev => ({ ...prev, email: error }));
                    }}
                    className={getInputClasses(fieldErrors.email)}
                    placeholder="your@email.com"
                    maxLength={100}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              )}

              {/* Website */}
              {activeFields.website && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600">Website</label>
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
                    value={author.website || ''}
                    onChange={(e) => {
                      handleAuthorChange('website', e.target.value);
                      const error = validateUrl(e.target.value);
                      setFieldErrors(prev => ({ ...prev, website: error }));
                    }}
                    className={getInputClasses(fieldErrors.website)}
                    placeholder="https://yourwebsite.com"
                    maxLength={200}
                  />
                  {fieldErrors.website && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.website}</p>
                  )}
                </div>
              )}

              {/* Social Media */}
              {activeFields.socialMedia && (
                <div className="space-y-3">
                  {(author.socialMedia || []).map((social, index) => (
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
                              ${platformDropdownOpen === index ? 'border-teal-500 ring-2 ring-teal-300' : fieldErrors[`social_platform_${index}`] ? 'border-red-500' : 'border-slate-300'}
                              hover:border-slate-400 transition-all duration-200`}
                          >
                            <span className="truncate pr-2">
                              {social.platform
                                ? SOCIAL_MEDIA_PLATFORMS.find(p => p.value === social.platform)?.label || social.platform
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
                      {fieldErrors[`social_platform_${index}`] && (
                        <p className="text-xs text-red-500">{fieldErrors[`social_platform_${index}`]}</p>
                      )}

                      {/* Row 2: Full-width URL */}
                      <input
                        type="url"
                        value={social.url || ''}
                        onChange={(e) => {
                          updateSocialMedia(index, 'url', e.target.value);
                          const error = validateUrl(e.target.value);
                          setFieldErrors(prev => ({ ...prev, [`social_${index}`]: error }));
                        }}
                        className={getInputClasses(fieldErrors[`social_${index}`])}
                        placeholder="https://..."
                        maxLength={200}
                      />
                      {fieldErrors[`social_${index}`] && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors[`social_${index}`]}</p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSocialMedia}
                    className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
                  >
                    <FaPlus className="text-xs" />
                    Add Social Media Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
});

AuthorDetailsSection.displayName = 'AuthorDetailsSection';

export default AuthorDetailsSection;
