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

const SOCIAL_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'X', label: 'X (Twitter)' },
];

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

  // Field styling helper
  const getFieldClasses = (hasError = false) => {
    const baseClasses = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    const errorClasses = hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300';
    const readOnlyClasses = disabled ? 'bg-slate-100 cursor-not-allowed text-slate-600' : '';
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Organiser Details Section */}
      <div>
        <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-3 sm:mb-4 text-slate-700">
          Organiser Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Organiser / Organisation Name */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Organiser / Organisation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.organizer?.name || ''}
              onChange={(e) => handleOrganizerChange('name', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(!!errors?.organizer)}
              placeholder="Your name or organisation name"
              maxLength="100"
            />
            {errors?.organizer && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {Array.isArray(errors.organizer) ? errors.organizer[0] : errors.organizer}
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Contact Number
            </label>
            <input
              type="tel"
              value={formData.organizer?.contact || ''}
              onChange={(e) => handleOrganizerChange('contact', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(false)}
              placeholder="+61 4XX XXX XXX"
              maxLength="20"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.organizer?.email || ''}
              onChange={(e) => handleOrganizerChange('email', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(false)}
              placeholder="contact@example.com"
              maxLength="100"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Website
            </label>
            <input
              type="url"
              value={formData.organizer?.website || ''}
              onChange={(e) => handleOrganizerChange('website', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(false)}
              placeholder="https://yourwebsite.com"
              maxLength="200"
            />
          </div>

          {/* ABN - Only for paid events */}
          {isPaidEvent && (
            <div className="sm:col-span-2">
              <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                ABN (Australian Business Number)
              </label>
              <input
                type="text"
                value={formData.organizer?.abn || ''}
                onChange={(e) => handleOrganizerChange('abn', e.target.value)}
                disabled={disabled}
                className={`${getFieldClasses(false)} sm:max-w-xs`}
                placeholder="XX XXX XXX XXX"
                maxLength="14"
              />
              <p className="text-xs text-slate-500 mt-1">
                For invoice purposes. Format: 11 digits
              </p>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Social Media Links
          </label>
          <p className="text-xs text-slate-500 mb-3">Add up to 3 social media links</p>

          {formData.organizer?.socialMedia && formData.organizer.socialMedia.length > 0 ? (
            <div className="space-y-3">
              {formData.organizer.socialMedia.map((social, index) => {
                // Get available platforms (exclude already selected ones)
                const selectedPlatforms = (formData.organizer.socialMedia || [])
                  .map((s, i) => i !== index ? s.platform : null)
                  .filter(Boolean);
                const availablePlatforms = SOCIAL_PLATFORMS.filter(p => !selectedPlatforms.includes(p.value));

                return (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={social.platform || ''}
                      onChange={(e) => handleUpdateSocialMedia(index, 'platform', e.target.value)}
                      disabled={disabled}
                      className={`${getFieldClasses(false)} w-32 sm:w-36`}
                    >
                      <option value="" disabled>Select</option>
                      {availablePlatforms.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                      {/* Keep current selection visible even if it would be filtered */}
                      {social.platform && !availablePlatforms.find(p => p.value === social.platform) && (
                        <option value={social.platform}>{social.platform}</option>
                      )}
                    </select>
                    <input
                      type="url"
                      value={social.url || ''}
                      onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                      disabled={disabled}
                      className={`${getFieldClasses(false)} flex-1`}
                      placeholder={social.platform ? `https://${social.platform.toLowerCase()}.com/...` : 'https://...'}
                      maxLength="200"
                    />
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialMedia(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!disabled && (formData.organizer?.socialMedia?.length || 0) < 3 && (
            <button
              type="button"
              onClick={handleAddSocialMedia}
              className="mt-3 inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Social Link
            </button>
          )}
        </div>
      </div>

      {/* Event Coordinators Section */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
          Event Coordinators
          <span className="text-sm font-normal text-slate-500 ml-2">(optional)</span>
        </h3>
        <p className="text-slate-500 text-sm mb-4">
          Add coordinators who will help manage this event.
        </p>

        {/* Coordinators List */}
        <div className="space-y-4">
          {(formData.coordinators || []).map((coordinator, index) => (
            <div
              key={index}
              className="p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-600">
                  Coordinator {index + 1}
                </span>
                {!disabled && (formData.coordinators || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCoordinator(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 text-sm">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={coordinator?.name || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'name', e.target.value)}
                    disabled={disabled}
                    className={getFieldClasses(!!getFieldError(index, 'name'))}
                    placeholder="Full name"
                    maxLength="100"
                  />
                  {getFieldError(index, 'name') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(index, 'name')}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 text-sm">
                    Phone {coordinator?.name?.trim() && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    value={coordinator?.phone || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'phone', e.target.value)}
                    disabled={disabled}
                    className={getFieldClasses(!!getFieldError(index, 'phone') || (coordinator?.phone && !isValidPhone(coordinator.phone)))}
                    placeholder="+61 4XX XXX XXX"
                    maxLength="20"
                  />
                  {getFieldError(index, 'phone') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(index, 'phone')}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 text-sm">
                    Role
                  </label>
                  <input
                    type="text"
                    value={coordinator?.role || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'role', e.target.value)}
                    disabled={disabled}
                    className={getFieldClasses(false)}
                    placeholder="e.g., Event Manager"
                    maxLength="100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    value={coordinator?.email || ''}
                    onChange={(e) => handleUpdateCoordinator(index, 'email', e.target.value)}
                    disabled={disabled}
                    className={getFieldClasses(!!getFieldError(index, 'email') || (coordinator?.email && !isValidEmail(coordinator.email)))}
                    placeholder="email@example.com"
                    maxLength="100"
                  />
                  {getFieldError(index, 'email') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(index, 'email')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section-level coordinator error box removed —
            inline errors render under each specific field; the toast on submit
            already summarises all errors at the top of the screen. */}

        {/* Add Coordinator Button */}
        {!disabled && (formData.coordinators || []).length < 10 && (
          <button
            type="button"
            onClick={handleAddCoordinator}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Coordinator
            <span className="ml-1 text-slate-500">({(formData.coordinators || []).length}/10)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetailsStep;
