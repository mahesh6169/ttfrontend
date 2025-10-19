import React, { useState, forwardRef, useImperativeHandle } from 'react';

const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Pinterest',
  'Other'
];

const AuthorDetailsSection = forwardRef(({ formData = {}, onChange, errors = {}, userName = '' }, ref) => {
  const [showAuthorDetails, setShowAuthorDetails] = useState(false);
  const [availableFields, setAvailableFields] = useState({
    website: false,
    contact: false,
    email: false,
    aboutMyself: false,
  });

  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [lastLoadedAuthorData, setLastLoadedAuthorData] = useState(null);

  // Initialize author object if it doesn't exist
  const author = formData.author || {
    name: '',
    website: '',
    contact: '',
    email: '',
    aboutMyself: '',
    socialMedia: []
  };

  // Initialize checkbox state based on existing author data (for edit mode)
  React.useEffect(() => {
    const hasAnyAuthorData = author.name || author.website || author.contact || 
                             author.email || author.aboutMyself || 
                             (author.socialMedia && author.socialMedia.length > 0);
    if (hasAnyAuthorData && !showAuthorDetails) {
      setShowAuthorDetails(true);
    }
  }, []);

  // Initialize availableFields based on existing author data (for edit mode)
  React.useEffect(() => {
    if (formData.author) {
      // Create a signature of the author data to detect real changes
      const authorSignature = JSON.stringify({
        website: formData.author.website || '',
        contact: formData.author.contact || '',
        email: formData.author.email || '',
        aboutMyself: formData.author.aboutMyself || '',
      });
      
      // Only update if this is new/different author data
      if (authorSignature !== lastLoadedAuthorData) {
        console.log('👤 AuthorDetailsSection received author data:', formData.author);
        const hasWebsite = !!(formData.author.website && formData.author.website.trim());
        const hasContact = !!(formData.author.contact && formData.author.contact.trim());
        const hasEmail = !!(formData.author.email && formData.author.email.trim());
        const hasAboutMyself = !!(formData.author.aboutMyself && formData.author.aboutMyself.trim());
        
        console.log('✅ Available fields check:', { hasWebsite, hasContact, hasEmail, hasAboutMyself });
        
        // Check if any of these fields should be visible
        const hasAnyFieldToShow = hasWebsite || hasContact || hasEmail || hasAboutMyself;
        
        if (hasAnyFieldToShow) {
          console.log('🔄 Updating availableFields state');
          setAvailableFields({
            website: hasWebsite,
            contact: hasContact,
            email: hasEmail,
            aboutMyself: hasAboutMyself,
          });
          setLastLoadedAuthorData(authorSignature);
        }
      }
    }
  }, [formData.author]);

  const validateUrl = (url) => {
    if (!url || url.trim() === '') return null;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://')) {
      return 'URL must use HTTPS (https://), not HTTP';
    }
    
    if (!trimmedUrl.startsWith('https://')) {
      return 'URL must start with https://';
    }
    
    return null;
  };

  const handleAuthorChange = (field, value) => {
    onChange({
      ...formData,
      author: {
        ...author,
        [field]: value
      }
    });
    
    // Clear error for this field when user types
    if (fieldErrors[field]) {
      setFieldErrors({
        ...fieldErrors,
        [field]: null
      });
    }
  };

  const handleAddField = (fieldName) => {
    setAvailableFields({
      ...availableFields,
      [fieldName]: true
    });
    setShowFieldDropdown(false);
  };

  const handleRemoveField = (fieldName) => {
    setAvailableFields({
      ...availableFields,
      [fieldName]: false
    });
    // Clear the field value and error
    handleAuthorChange(fieldName, '');
    if (fieldErrors[fieldName]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[fieldName];
      setFieldErrors(newErrors);
    }
  };

  const handleAddSocialMedia = () => {
    const newSocialMedia = [...(author.socialMedia || []), { platform: '', url: '' }];
    handleAuthorChange('socialMedia', newSocialMedia);
  };

  const handleUpdateSocialMedia = (index, field, value) => {
    const updated = [...(author.socialMedia || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleAuthorChange('socialMedia', updated);
    
    // Clear error for this social media field when user types
    if (field === 'url' && fieldErrors[`socialMedia_${index}`]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[`socialMedia_${index}`];
      setFieldErrors(newErrors);
    }
  };

  const handleRemoveSocialMedia = (index) => {
    const updated = (author.socialMedia || []).filter((_, i) => i !== index);
    handleAuthorChange('socialMedia', updated);
    
    // Clear error for this social media field
    if (fieldErrors[`socialMedia_${index}`]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[`socialMedia_${index}`];
      setFieldErrors(newErrors);
    }
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (checked) => {
    setShowAuthorDetails(checked);
    
    if (checked) {
      // Prefill author name with username when checking the box
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
      // Clear all author data when unchecked
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
      // Reset available fields
      setAvailableFields({
        website: false,
        contact: false,
        email: false,
        aboutMyself: false,
      });
      // Clear all errors
      setFieldErrors({});
    }
  };

  // Validate all fields before form submission
  const validateFields = () => {
    // If author details not opted in, skip validation
    if (!showAuthorDetails) return true;
    
    const newErrors = {};
    
    // Validate visible fields that are empty
    if (availableFields.website) {
      if (!author.website || author.website.trim() === '') {
        newErrors.website = 'Website cannot be empty. Please fill it or remove the field.';
      } else {
        const urlError = validateUrl(author.website);
        if (urlError) newErrors.website = urlError;
      }
    }
    
    if (availableFields.contact && (!author.contact || author.contact.trim() === '')) {
      newErrors.contact = 'Contact number cannot be empty. Please fill it or remove the field.';
    }
    
    if (availableFields.email && (!author.email || author.email.trim() === '')) {
      newErrors.email = 'Email cannot be empty. Please fill it or remove the field.';
    }
    
    if (availableFields.aboutMyself && (!author.aboutMyself || author.aboutMyself.trim() === '')) {
      newErrors.aboutMyself = 'About Myself cannot be empty. Please fill it or remove the field.';
    }
    
    // Validate social media links
    (author.socialMedia || []).forEach((social, index) => {
      if (social.platform || social.url) {
        if (!social.platform || !social.url || social.url.trim() === '') {
          newErrors[`socialMedia_${index}`] = 'Both platform and URL are required, or remove this link.';
        } else {
          const urlError = validateUrl(social.url);
          if (urlError) newErrors[`socialMedia_${index}`] = urlError;
        }
      }
    });
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Expose validation function and state to parent via ref
  useImperativeHandle(ref, () => ({
    validateFields,
    isOptedIn: () => showAuthorDetails
  }));

  // Check which fields can still be added
  const getAvailableFieldOptions = () => {
    const options = [];
    if (!availableFields.website) options.push({ label: 'Website', value: 'website' });
    if (!availableFields.contact) options.push({ label: 'Contact Number', value: 'contact' });
    if (!availableFields.email) options.push({ label: 'Email', value: 'email' });
    if (!availableFields.aboutMyself) options.push({ label: 'About Myself', value: 'aboutMyself' });
    return options;
  };

  const fieldOptions = getAvailableFieldOptions();

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3 mb-2">
        <input
          type="checkbox"
          id="showAuthorDetails"
          checked={showAuthorDetails}
          onChange={(e) => handleCheckboxToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <div className="flex-1">
          <label htmlFor="showAuthorDetails" className="cursor-pointer">
            <span className="block font-bold text-gray-700">
              Author Details (Optional)
            </span>
            <p className="text-xs text-gray-600 mt-1">
              I am a blogger or content creator - let people know more about me
            </p>
          </label>
        </div>
      </div>

      {showAuthorDetails && (
        <>
        <div className="space-y-4 p-4 rounded-lg border border-gray-200">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Author Name <span className="text-xs text-gray-500">(Optional - defaults to your username)</span>
        </label>
        <input
          type="text"
          value={author.name || ''}
          onChange={(e) => handleAuthorChange('name', e.target.value)}
          className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors"
          placeholder="Your name or pen name"
          maxLength="100"
        />
      </div>

      {/* Website - Conditionally shown */}
      {availableFields.website && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={author.website || ''}
            onChange={(e) => handleAuthorChange('website', e.target.value)}
            className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              fieldErrors.website 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20' 
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
            }`}
            placeholder="https://yourwebsite.com"
            maxLength="200"
          />
          <button
            type="button"
            onClick={() => handleRemoveField('website')}
            className="absolute right-2 top-8 text-red-500 hover:text-red-700"
            title="Remove field"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {fieldErrors.website && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.website}</p>
          )}
        </div>
      )}

      {/* Contact - Conditionally shown */}
      {availableFields.contact && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number
          </label>
          <input
            type="tel"
            value={author.contact || ''}
            onChange={(e) => handleAuthorChange('contact', e.target.value)}
            className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              fieldErrors.contact 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20' 
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
            }`}
            placeholder="+61 4XX XXX XXX"
            maxLength="20"
          />
          <button
            type="button"
            onClick={() => handleRemoveField('contact')}
            className="absolute right-2 top-8 text-red-500 hover:text-red-700"
            title="Remove field"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {fieldErrors.contact && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.contact}</p>
          )}
        </div>
      )}

      {/* Email - Conditionally shown */}
      {availableFields.email && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={author.email || ''}
            onChange={(e) => handleAuthorChange('email', e.target.value)}
            className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              fieldErrors.email 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20' 
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
            }`}
            placeholder="your.email@example.com"
            maxLength="100"
          />
          <button
            type="button"
            onClick={() => handleRemoveField('email')}
            className="absolute right-2 top-8 text-red-500 hover:text-red-700"
            title="Remove field"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>
      )}

      {/* About Myself - Conditionally shown */}
      {availableFields.aboutMyself && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            About Myself
          </label>
          <textarea
            value={author.aboutMyself || ''}
            onChange={(e) => handleAuthorChange('aboutMyself', e.target.value)}
            className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
              fieldErrors.aboutMyself 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20' 
                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
            }`}
            placeholder="Tech blogger, Python enthusiast..."
            maxLength="500"
            rows="4"
          />
          <div className="flex justify-between items-center mt-1">
            <button
              type="button"
              onClick={() => handleRemoveField('aboutMyself')}
              className="text-sm text-red-500 hover:text-red-700"
              title="Remove field"
            >
              Remove
            </button>
            <span className="text-xs text-gray-400">
              {(author.aboutMyself || '').length}/500
            </span>
          </div>
          {fieldErrors.aboutMyself && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.aboutMyself}</p>
          )}
        </div>
      )}

      {/* Social Media Links */}
      {author.socialMedia && author.socialMedia.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Social Media Links
          </label>
          <div className="space-y-2">
            {author.socialMedia.map((social, index) => (
              <div key={index}>
                <div className="flex gap-2 items-start">
                  <select
                    value={social.platform || ''}
                    onChange={(e) => handleUpdateSocialMedia(index, 'platform', e.target.value)}
                    className={`w-1/3 p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors[`socialMedia_${index}`]
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20'
                        : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
                    }`}
                  >
                    <option value="">Select platform</option>
                    {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={social.url || ''}
                    onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                    className={`flex-1 p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                      fieldErrors[`socialMedia_${index}`]
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-opacity-20'
                        : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500 focus:ring-opacity-20'
                    }`}
                    placeholder="https://facebook.com/yourpage"
                    maxLength="200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialMedia(index)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove social media link"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {fieldErrors[`socialMedia_${index}`] && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors[`socialMedia_${index}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Add Field Dropdown */}
        {fieldOptions.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFieldDropdown(!showFieldDropdown)}
              className="inline-flex items-center px-3 py-2 border border-dashed border-blue-300 rounded-lg text-sm text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Field
            </button>

            {showFieldDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowFieldDropdown(false)}
                />
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200 py-1">
                  {fieldOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAddField(option.value)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Add Social Media Link */}
        <button
          type="button"
          onClick={handleAddSocialMedia}
          className="inline-flex items-center px-3 py-2 border border-dashed border-blue-300 rounded-lg text-sm text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Social Media Link
        </button>
      </div>
        </div>
        </>
      )}
    </div>
  );
});

AuthorDetailsSection.displayName = 'AuthorDetailsSection';

export default AuthorDetailsSection;
