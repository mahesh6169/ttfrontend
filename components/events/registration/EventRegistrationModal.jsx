// components/events/registration/EventRegistrationModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaPlus, FaTrash, FaUser, FaCalendar, FaPhone } from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  registerForFreeEvent, 
  clearRegistrationError, 
  clearSuccessMessage 
} from '@/store/slices/events/freeEventSlice';

const EventRegistrationModal = ({ event, isOpen, onClose, onSuccess }) => {
  // Redux state
  const dispatch = useDispatch();
  const { 
    registrationStatus, 
    registrationError, 
    successMessage,
    currentRegistration 
  } = useSelector((state) => state.freeEvents);

  // Form state
  const [attendees, setAttendees] = useState([{ name: '' }]);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [mobile, setMobile] = useState('');

  // Handle modal close (MOVED UP - defined before useEffects)
  const handleClose = () => {
  setAttendees([{ name: '', age: '' }]);
  setFormResponses({});
  setErrors({});
  setShowSuccessMessage(false);
  setMobile('');
  dispatch(clearRegistrationError());
  dispatch(clearSuccessMessage());
  onClose();
};

  // Handle successful registration
useEffect(() => {
  if (registrationStatus === 'succeeded' && currentRegistration) {
    console.log("✅ Modal: Registration succeeded");
    setShowSuccessMessage(true);
    
    // Call onSuccess callback
    onSuccess?.({ 
      success: true, 
      message: successMessage,
      registration: currentRegistration 
    });
    
    // Auto-close after 3 seconds
    setTimeout(() => {
      handleClose();
    }, 5000);
  }
}, [registrationStatus, currentRegistration, successMessage, onSuccess]);

  // Clear errors and reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset local state
      setShowSuccessMessage(false);
      setAttendees([{ name: '' }]);
      setFormResponses({});
      setErrors({});
      setMobile('');
      
      // Clear Redux state
      dispatch(clearRegistrationError());
      dispatch(clearSuccessMessage());
    }
  }, [isOpen, dispatch]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  const handleAddAttendee = () => {
    if (attendees.length < event.maxAttendeesPerRegistration) {
      setAttendees([...attendees, { name: '' }]);
    }
  };

  const handleRemoveAttendee = (index) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
      // Clear errors for removed attendee
      const newErrors = { ...errors };
      delete newErrors[`attendee_${index}_name`];
      setErrors(newErrors);
    }
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
    
    // Clear error when user starts typing
    if (errors[`attendee_${index}_${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`attendee_${index}_${field}`];
      setErrors(newErrors);
    }
  };

  const handleFormResponseChange = (fieldName, value) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate mobile number
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    // Validate attendees
    attendees.forEach((attendee, index) => {
      if (!attendee.name.trim()) {
        newErrors[`attendee_${index}_name`] = 'Name is required';
      }
      
      
    });

    // Validate required form fields
    event.registrationFields?.forEach(field => {
      if (field.isRequired && !formResponses[field.fieldName]) {
        newErrors[field.fieldName] = `${field.fieldName} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare registration data
      const registrationData = {
        mobile: mobile.trim(),
        attendees: attendees
          .filter(attendee => attendee.name.trim()) // Only include attendees with names
          .map(attendee => ({
            name: attendee.name.trim(),
            age: attendee.age ? parseInt(attendee.age) : null
          })),
        formResponses: Object.entries(formResponses).map(([fieldName, response]) => ({
          fieldName,
          response
        }))
      };

      console.log("🎫 Modal formResponses check:", { formResponses, registrationData });

      // Call Redux action (this will call your backend!)
      dispatch(registerForFreeEvent({ 
        eventId: event._id, 
        registrationData 
      }));

    } catch (error) {
      console.error("❌ Modal: Registration submission error", error);
    }
  };

  // Format event date for display
const formatEventDate = (dateTime, timeZone) => {
  try {
    const dateTimeZone = timeZone || 'Australia/Sydney';
    const formattedDate = formatInTimeZone(
      dateTime,
      dateTimeZone,
      'EEEE, MMMM do, yyyy \'at\' h:mm a'
    );
    
    // Extract timezone abbreviation (e.g., "NSW" from "Australia/Sydney")
    const timezoneAbbr = dateTimeZone.includes('/') 
      ? dateTimeZone.split('/')[1].replace('_', ' ')
      : dateTimeZone;
    
    return `${formattedDate} ${timezoneAbbr}`;
  } catch {
    return 'Invalid date';
  }
};

  const renderFormField = (field) => {
    const value = formResponses[field.fieldName] || '';
    const error = errors[field.fieldName];

    switch (field.fieldType) {
      case 'text':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide your response"
            />
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'email':
      case 'phone':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide your response"
            />
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please provide your response"
            />
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={`Enter ${field.fieldName.toLowerCase()}`}
            />
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select {field.fieldName.toLowerCase()}</option>
              {field.fieldOptions?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.fieldOptions?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={field.fieldName}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              {field.fieldName}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.fieldOptions?.map((option, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) ? value.includes(option) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (e.target.checked) {
                        handleFormResponseChange(field.fieldName, [...currentValues, option]);
                      } else {
                        handleFormResponseChange(field.fieldName, currentValues.filter(v => v !== option));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Register for Event</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{event.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <FaTimes size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

                {/* Success Message */}
        {showSuccessMessage && (
          <div className="p-4 sm:p-6 border-b bg-green-50">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-2 sm:mb-3">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-green-900 mb-1 sm:mb-2">Registration Successful! 🎉</h3>
                <p className="text-xs sm:text-sm text-green-700 mb-1 sm:mb-2">
                  Registration Number: <strong>{currentRegistration?.registrationNumber}</strong>
                </p>
                <p className="text-xs text-green-600">
                  You will receive a confirmation email shortly. This modal will close automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!showSuccessMessage ? (
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          
          {/* Mobile Number Section */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2 mb-3 sm:mb-4">
              <FaPhone className="w-4 h-4 sm:w-5 sm:h-5" />
              Contact Information
            </h3>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                // Clear error when user starts typing
                if (errors.mobile) {
                  const newErrors = { ...errors };
                  delete newErrors.mobile;
                  setErrors(newErrors);
                }
              }}
              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                errors.mobile ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your mobile number"
            />
            {errors.mobile && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Attendees Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center gap-2">
                <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
                Attendees
              </h3>
              {attendees.length < event.maxAttendeesPerRegistration && (
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-amber-400 text-teal-800 rounded hover:bg-amber-500 hover:text-teal-900 transition-colors"
                >
                  <FaPlus size={10} className="sm:w-3 sm:h-3" />
                  Add Attendee
                </button>
              )}
            </div>

            {/* Attendees List */}
            {attendees.map((attendee, index) => (
              <div key={index} className="border rounded-lg p-3 sm:p-4 mb-2 sm:mb-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="font-medium text-gray-800 text-sm sm:text-base">Attendee {index + 1}</h4>
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FaTrash size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                      className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                        errors[`attendee_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors[`attendee_${index}_name`] && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1">{errors[`attendee_${index}_name`]}</p>
                    )}
                  </div>                  

                </div>
              </div>
            ))}
          </div>

          {/* Additional Form Fields */}
          {event.registrationFields?.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Additional Information</h3>
              <div className="space-y-4">
                {event.registrationFields.map(renderFormField)}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {registrationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-red-700 text-xs sm:text-sm">{registrationError}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registrationStatus === 'loading'}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-amber-400 text-teal-800 rounded-md hover:bg-amber-500 hover:text-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {registrationStatus === 'loading' ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
         ) : (
          <div className="p-4 sm:p-6 text-center">
            <button
              onClick={handleClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationModal;