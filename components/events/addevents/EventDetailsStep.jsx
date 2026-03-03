// components/events/addevents/EventDetailsStep.jsx
// Step 2: Event Details - Category, Description, Organizer Info, Coordinators

import React from 'react';
import { useDispatch } from 'react-redux';
import {
  updateField,
  addCoordinator,
  updateCoordinator,
  removeCoordinator,
  updateOrganizerField,
  addOrganizerSocialMedia,
  updateOrganizerSocialMedia,
  removeOrganizerSocialMedia,
} from '@/store/slices/events/eventSlice';
import CategorySelector from '@/components/events/CategorySelector';
import CommunitySelector from '@/components/shared/CommunitySelector';
import { needsCommunityField } from '@/components/events/addevents/EventCategories';

const EventDetailsStep = ({
  formData,
  errors = {},
  mode = 'add',
  readOnly = false
}) => {
  const dispatch = useDispatch();
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const disabled = readOnly || isViewMode;

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  const isPaidEvent = formData.isPaid || false;

  const handleChange = (e) => {
    if (disabled) return;
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  // Organizer handlers
  const handleOrganizerChange = (field, value) => {
    if (disabled) return;
    dispatch(updateOrganizerField({ field, value }));
  };

  const handleAddSocialMedia = () => {
    if (disabled) return;
    dispatch(addOrganizerSocialMedia());
  };

  const handleUpdateSocialMedia = (index, field, value) => {
    if (disabled) return;
    dispatch(updateOrganizerSocialMedia({ index, field, value }));
  };

  const handleRemoveSocialMedia = (index) => {
    if (disabled) return;
    dispatch(removeOrganizerSocialMedia(index));
  };

  // Coordinator handlers
  const handleAddCoordinator = () => {
    if (disabled) return;
    if ((formData.coordinators || []).length < 10) {
      dispatch(addCoordinator());
    }
  };

  const handleUpdateCoordinator = (index, field, value) => {
    if (disabled) return;
    dispatch(updateCoordinator({ index, field, value }));
  };

  const handleRemoveCoordinator = (index) => {
    if (disabled) return;
    if ((formData.coordinators || []).length > 1) {
      dispatch(removeCoordinator(index));
    }
  };

  // Validation helpers
  const isValidPhone = (phone) => {
    if (!phone) return false;
    return /^[\d\s\-\+\(\)]+$/.test(phone);
  };

  const isValidEmail = (email) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getFieldError = (index, field) => {
    if (!errors?.coordinators) return null;
    const coordinatorErrors = Array.isArray(errors.coordinators) ? errors.coordinators : [];
    return coordinatorErrors.find(
      (err) => err.includes(`Coordinator ${index + 1}`) && err.toLowerCase().includes(field.toLowerCase())
    );
  };

  // Field styling helpers
  const getFieldClasses = (fieldName) => {
    if (fieldName === 'description') {
      const baseClasses = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg sm:rounded';
      const errorClasses = errors?.[fieldName] ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-teal-300';
      const readOnlyClasses = disabled
        ? 'bg-gray-100 cursor-not-allowed text-gray-600'
        : 'focus:outline-none focus:ring-2';
      return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
    }

    const baseClasses = 'w-full px-3 py-2.5 sm:py-2 border rounded-lg transition-colors text-sm';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300';
    const readOnlyClasses = disabled
      ? 'bg-gray-100 cursor-not-allowed text-gray-600'
      : 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500 active:border-teal-500';
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  const getOrganizerFieldClasses = (fieldName) => {
    const baseClasses = 'w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-teal-500';
    const readOnlyClasses = disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : '';
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-0">
      {/* Step Header */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Event Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add more details about your event and organizer information
        </p>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm">
          Category <span className="text-red-500">*</span>
        </label>
        {disabled ? (
          <input
            type="text"
            value={formData.category || 'No category selected'}
            disabled={true}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        ) : (
          <CategorySelector
            value={formData.category || ''}
            onChange={(value) => {
              handleChange({ target: { name: 'category', value } });
              // Clear communities if switching to non-eligible category
              if (!needsCommunityField(value)) {
                handleChange({ target: { name: 'communities', value: [] } });
              }
            }}
            placeholder="Select a category"
            required={true}
          />
        )}
        {errors?.category && (
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.category) ? errors.category[0] : errors.category}
          </p>
        )}
      </div>

      {/* Community/Language Selection - Only for eligible categories */}
      {!disabled && needsCommunityField(formData.category) && (
        <div className="space-y-2">
          <CommunitySelector
            value={formData.communities || []}
            onChange={(value) => handleChange({ target: { name: 'communities', value } })}
            label="Community/Language (Optional)"
            showHint={true}
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          disabled={disabled}
          className={`${getFieldClasses('description')} min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y`}
          rows="6"
          placeholder={disabled ? '' : 'Describe your event - what attendees can expect, agenda, special requirements, etc.'}
          maxLength="15000"
        />
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {errors?.description && (
              <p className="text-red-500 text-xs sm:text-sm">
                {Array.isArray(errors.description) ? errors.description[0] : errors.description}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {(formData.description || '').length}/15000
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6 mt-6"></div>

      {/* Organizer Details Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Event Organizer</h3>
            <p className="text-sm text-gray-500">Organization or person hosting this event</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Organizer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organizer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.organizer?.name || ''}
              onChange={(e) => handleOrganizerChange('name', e.target.value)}
              disabled={disabled}
              className={getOrganizerFieldClasses('organizer')}
              placeholder="Your name or organization name"
              maxLength="100"
            />
            {errors?.organizer && (
              <p className="mt-1 text-red-500 text-xs sm:text-sm">
                {Array.isArray(errors.organizer) ? errors.organizer[0] : errors.organizer}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.organizer?.website || ''}
              onChange={(e) => handleOrganizerChange('website', e.target.value)}
              disabled={disabled}
              className="w-full p-2.5 sm:p-3 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="https://yourwebsite.com"
              maxLength="200"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.organizer?.contact || ''}
              onChange={(e) => handleOrganizerChange('contact', e.target.value)}
              disabled={disabled}
              className={getOrganizerFieldClasses('organizer')}
              placeholder="+61 4XX XXX XXX"
              maxLength="20"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.organizer?.email || ''}
              onChange={(e) => handleOrganizerChange('email', e.target.value)}
              disabled={disabled}
              className="w-full p-2.5 sm:p-3 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="contact@example.com"
              maxLength="100"
            />
          </div>

          {/* ABN - Only for paid events */}
          {isPaidEvent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ABN (Australian Business Number)
              </label>
              <input
                type="text"
                value={formData.organizer?.abn || ''}
                onChange={(e) => handleOrganizerChange('abn', e.target.value)}
                disabled={disabled}
                className="w-full p-2.5 sm:p-3 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="XX XXX XXX XXX"
                maxLength="14"
              />
              <p className="mt-1 text-xs text-gray-500">
                For invoice purposes. Format: 11 digits (e.g., 12 345 678 901)
              </p>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Media Links
          </label>

          {formData.organizer?.socialMedia && formData.organizer.socialMedia.length > 0 ? (
            <div className="space-y-3">
              {formData.organizer.socialMedia.map((social, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start">
                  <input
                    type="text"
                    value={social.platform || ''}
                    onChange={(e) => handleUpdateSocialMedia(index, 'platform', e.target.value)}
                    disabled={disabled}
                    className="w-full sm:flex-1 p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Platform name (e.g., Facebook, Instagram)"
                    maxLength="50"
                  />
                  <input
                    type="url"
                    value={social.url || ''}
                    onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                    disabled={disabled}
                    className="w-full sm:flex-[2] p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="https://facebook.com/yourpage"
                    maxLength="200"
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialMedia(index)}
                      className="w-full sm:w-auto flex items-center justify-center p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove social media link"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      <span className="ml-2 sm:hidden">Remove</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No social media links added yet</p>
          )}

          {!disabled && (
            <button
              type="button"
              onClick={handleAddSocialMedia}
              className="mt-3 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-dashed border-blue-300 rounded-lg text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-medium text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Social Media Link
            </button>
          )}
        </div>
      </div>

      {/* Event Coordinators Section */}
      <div className="mt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Event Coordinators
            <span className="text-sm font-normal text-gray-500 ml-2">(optional)</span>
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Add coordinators who will help manage this event. Recommended for larger events.
            {isRecurringEvent && (
              <span className="block mt-1 text-blue-600 font-medium">
                These coordinators will be responsible for all instances of your recurring event.
              </span>
            )}
          </p>
        </div>

        {/* Coordinators List */}
        <div className="space-y-4">
          {(formData.coordinators || []).map((coordinator, index) => (
            <div
              key={index}
              className="relative p-4 sm:p-6 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {coordinator?.name || `Coordinator ${index + 1}`}
                    </h4>
                    {coordinator?.role && (
                      <p className="text-sm text-gray-500">{coordinator.role}</p>
                    )}
                  </div>
                </div>

                {!disabled && (formData.coordinators || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCoordinator(index)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove coordinator"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={coordinator?.name || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'name', e.target.value)}
                    disabled={disabled}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      getFieldError(index, 'name')
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-teal-500'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="Enter coordinator's full name"
                    maxLength="100"
                  />
                  {getFieldError(index, 'name') && (
                    <p className="mt-1 text-red-500 text-xs sm:text-sm">
                      {getFieldError(index, 'name')}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role/Responsibility
                  </label>
                  <input
                    type="text"
                    value={coordinator?.role || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'role', e.target.value)}
                    disabled={disabled}
                    className="w-full p-2.5 sm:p-3 text-sm border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., Event Manager, Registration Coordinator"
                    maxLength="100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500" title="Required if name is provided">*</span>
                  </label>
                  <input
                    type="tel"
                    value={coordinator?.phone || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'phone', e.target.value)}
                    disabled={disabled}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      getFieldError(index, 'phone') || (coordinator?.phone && !isValidPhone(coordinator.phone))
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-teal-500'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="+61 4XX XXX XXX"
                    maxLength="20"
                  />
                  {getFieldError(index, 'phone') && (
                    <p className="mt-1 text-red-500 text-xs sm:text-sm">
                      {getFieldError(index, 'phone')}
                    </p>
                  )}
                  {coordinator?.phone && !isValidPhone(coordinator.phone) && !getFieldError(index, 'phone') && (
                    <p className="mt-1 text-red-500 text-xs sm:text-sm">
                      Please enter a valid phone number
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={coordinator?.email || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'email', e.target.value)}
                    disabled={disabled}
                    className={`w-full p-3 border rounded-lg transition-colors ${
                      getFieldError(index, 'email') || (coordinator?.email && !isValidEmail(coordinator.email))
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-teal-500'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    placeholder="coordinator@example.com"
                    maxLength="100"
                  />
                  {getFieldError(index, 'email') && (
                    <p className="mt-1 text-red-500 text-xs sm:text-sm">
                      {getFieldError(index, 'email')}
                    </p>
                  )}
                  {coordinator?.email && !isValidEmail(coordinator.email) && !getFieldError(index, 'email') && (
                    <p className="mt-1 text-red-500 text-xs sm:text-sm">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* General Coordinator Errors */}
        {errors?.coordinators && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">Coordinator Errors</h4>
                <div className="mt-2 text-sm text-red-700">
                  {Array.isArray(errors.coordinators) ? (
                    errors.coordinators.map((err, i) => <p key={i}>• {err}</p>)
                  ) : (
                    <p>• {errors.coordinators}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Coordinator Button */}
        {!disabled && (
          <div className="text-center mt-4">
            {(formData.coordinators || []).length < 10 ? (
              <button
                type="button"
                onClick={handleAddCoordinator}
                className="inline-flex items-center px-6 py-3 border border-dashed border-teal-300 rounded-lg text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Coordinator
                <span className="ml-2 text-sm text-gray-500">
                  ({(formData.coordinators || []).length}/10)
                </span>
              </button>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Maximum number of coordinators (10) reached. Remove a coordinator to add a new one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailsStep;
