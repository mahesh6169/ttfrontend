// components/events/addevents/OrganiserDetailsStep.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import {
  addCoordinator,
  updateCoordinator,
  removeCoordinator,
  updateOrganizerField,
  addOrganizerSocialMedia,
  updateOrganizerSocialMedia,
  removeOrganizerSocialMedia,
} from '@/store/slices/events/eventSlice';

const OrganiserDetailsStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();

  // Add this error styling function
const getFieldClasses = (fieldName) => {
  const baseClasses = 'w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20';
  const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-gray-300 focus:border-teal-500';
  
  return `${baseClasses} ${errorClasses}`;
};

  // Organizer functions
  const handleOrganizerChange = (field, value) => {
    dispatch(updateOrganizerField({ field, value }));
  };

  const handleAddSocialMedia = () => {
    dispatch(addOrganizerSocialMedia());
  };

  const handleUpdateSocialMedia = (index, field, value) => {
    dispatch(updateOrganizerSocialMedia({ index, field, value }));
  };

  const handleRemoveSocialMedia = (index) => {
    dispatch(removeOrganizerSocialMedia(index));
  };

  const handleAddCoordinator = () => {
    if ((formData.coordinators || []).length < 10) {
      dispatch(addCoordinator());
    }
  };

  const handleUpdateCoordinator = (index, field, value) => {
    dispatch(updateCoordinator({ index, field, value }));
  };

  const handleRemoveCoordinator = (index) => {
    if ((formData.coordinators || []).length > 1) {
      dispatch(removeCoordinator(index));
    }
  };

  // Validate phone number format (basic validation)
  const isValidPhone = (phone) => {
    if (!phone) return false;
    return /^[\d\s\-\+\(\)]+$/.test(phone);
  };

  // Validate email format (basic validation)
  const isValidEmail = (email) => {
    if (!email) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  // Get field error for specific coordinator and field
  const getFieldError = (index, field) => {
    if (!errors?.coordinators) return null;
    const coordinatorErrors = Array.isArray(errors.coordinators)
      ? errors.coordinators
      : [];
    return coordinatorErrors.find(
      (err) =>
        err.includes(`Coordinator ${index + 1}`) &&
        err.toLowerCase().includes(field.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      {/* Organizer Details Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Event Organizer
            </h3>
            <p className="text-sm text-gray-500">
              Organization or person hosting this event
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Organizer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organizer Name <span className="text-red-500">*</span>
            </label>
            <input
  type="text"
  value={formData.organizer?.name || ''}
  onChange={(e) => handleOrganizerChange('name', e.target.value)}
  className={getFieldClasses('organizer')}
  placeholder="Your name or organization name"
  maxLength="100"
/>
{errors?.organizer && (
  <p className="mt-1 text-red-500 text-xs sm:text-sm">
    {Array.isArray(errors.organizer) ? errors.organizer[0] : errors.organizer}
  </p>
)}
            <p className="mt-1 text-xs text-gray-500">
              This can be your personal name or your organization name
            </p>
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors"
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
  className={getFieldClasses('organizer')}
  placeholder="+61 4XX XXX XXX"
  maxLength="20"
/>
{errors?.organizer && (
  <p className="mt-1 text-red-500 text-xs sm:text-sm">
    {Array.isArray(errors.organizer) ? errors.organizer.find(err => err.includes('contact')) : ''}
  </p>
)}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors"
              placeholder="contact@example.com"
              maxLength="100"
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Media Links
          </label>

          {formData.organizer?.socialMedia &&
          formData.organizer.socialMedia.length > 0 ? (
            <div className="space-y-3">
              {formData.organizer.socialMedia.map((social, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={social.platform || ''}
                    onChange={(e) =>
                      handleUpdateSocialMedia(index, 'platform', e.target.value)
                    }
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20"
                    placeholder="Platform name (e.g., Facebook, Instagram)"
                    maxLength="50"
                  />
                  <input
                    type="url"
                    value={social.url || ''}
                    onChange={(e) =>
                      handleUpdateSocialMedia(index, 'url', e.target.value)
                    }
                    className="flex-[2] p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20"
                    placeholder="https://facebook.com/yourpage"
                    maxLength="200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialMedia(index)}
                    className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove social media link"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No social media links added yet
            </p>
          )}

          <button
            type="button"
            onClick={handleAddSocialMedia}
            className="mt-3 inline-flex items-center px-4 py-2 border border-dashed border-blue-300 rounded-lg text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 font-medium text-sm"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            Add Social Media Link
          </button>
        </div>
      </div>

{/* Event Coordinators Section */}
<div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
  <h2 className="text-xl font-semibold mb-2">Event Coordinators</h2>
  <p className="text-gray-600 text-sm mb-4">
    Add coordinators who will be helping to manage this event.
    Coordinators are optional but recommended for larger events.
    {isRecurringEvent && (
      <span className="block mt-1 text-blue-600 font-medium">
        These coordinators will be responsible for all instances of your recurring event.
      </span>
    )}
  </p>

  {/* You can add coordinator input fields below here */}
</div>


      {/* Recurring Event Info */}
      {isRecurringEvent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Recurring Event Coordinators
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  The coordinators you add here will be associated with all
                  instances of your recurring event. You can add different
                  coordinators for specific instances later if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coordinators List */}
      <div className="space-y-4">
        {(formData.coordinators || []).map((coordinator, index) => (
          <div
            key={index}
            className="relative p-6 border-2 border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
          >
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-teal-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {coordinator?.name || `Coordinator ${index + 1}`}
                  </h3>
                  {coordinator?.role && (
                    <p className="text-sm text-gray-500">{coordinator.role}</p>
                  )}
                </div>
              </div>

              {(formData.coordinators || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCoordinator(index)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Remove coordinator"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Name */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={coordinator?.name || ''}
                  onChange={(e) =>
                    handleUpdateCoordinator(index, 'name', e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg transition-colors ${
                    getFieldError(index, 'name')
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20`}
                  placeholder="Enter coordinator's full name"
                  maxLength="100"
                />
                {getFieldError(index, 'name') && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError(index, 'name')}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role/Responsibility
                </label>
                <input
                  type="text"
                  value={coordinator?.role || ''}
                  onChange={(e) =>
                    handleUpdateCoordinator(index, 'role', e.target.value)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20 transition-colors"
                  placeholder="e.g., Event Manager, Registration Coordinator, Volunteer Lead"
                  maxLength="100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  What will this coordinator be responsible for?
                </p>
              </div>

              {/* Phone */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500" title="Required if name is provided">*</span>
                </label>
                <input
                  type="tel"
                  value={coordinator?.phone || ''}
                  onChange={(e) =>
                    handleUpdateCoordinator(index, 'phone', e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg transition-colors ${
                    getFieldError(index, 'phone') ||
                    (coordinator?.phone && !isValidPhone(coordinator.phone))
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20`}
                  placeholder="+61 4XX XXX XXX"
                  maxLength="20"
                />
                {getFieldError(index, 'phone') && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError(index, 'phone')}
                  </p>
                )}
                {coordinator?.phone &&
                  !isValidPhone(coordinator.phone) &&
                  !getFieldError(index, 'phone') && (
                    <p className="mt-1 text-red-500 text-sm">
                      Please enter a valid phone number
                    </p>
                  )}
                <p className="mt-1 text-xs text-gray-500">
                  Primary contact number for this coordinator
                </p>
              </div>

              {/* Email */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={coordinator?.email || ''}
                  onChange={(e) =>
                    handleUpdateCoordinator(index, 'email', e.target.value)
                  }
                  className={`w-full p-3 border rounded-lg transition-colors ${
                    getFieldError(index, 'email') ||
                    (coordinator?.email && !isValidEmail(coordinator.email))
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-20`}
                  placeholder="coordinator@example.com"
                  maxLength="100"
                />
                {getFieldError(index, 'email') && (
                  <p className="mt-1 text-red-500 text-sm">
                    {getFieldError(index, 'email')}
                  </p>
                )}
                {coordinator?.email &&
                  !isValidEmail(coordinator.email) &&
                  !getFieldError(index, 'email') && (
                    <p className="mt-1 text-red-500 text-sm">
                      Please enter a valid email address
                    </p>
                  )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional - for event notifications and updates
                </p>
              </div>
            </div>


          </div>
        ))}
      </div>

      {/* General Coordinator Errors */}
      {errors?.coordinators && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Coordinator Errors
              </h3>
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
      <div className="text-center">
        {(formData.coordinators || []).length < 10 ? (
          <button
            type="button"
            onClick={handleAddCoordinator}
            className="inline-flex items-center px-6 py-3 border border-dashed border-teal-300 rounded-lg text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Another Coordinator
            <span className="ml-2 text-sm text-gray-500">
              ({(formData.coordinators || []).length}/10)
            </span>
          </button>
        ) : (
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Maximum number of coordinators (10) reached. Remove a coordinator
              to add a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganiserDetailsStep;
