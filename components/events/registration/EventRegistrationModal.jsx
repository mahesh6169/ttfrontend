// components/events/registration/EventRegistrationModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaTimes, FaPlus, FaTrash, FaUser, FaCalendar } from 'react-icons/fa';
import { format } from 'date-fns';
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
  const [attendees, setAttendees] = useState([{ name: '', age: '' }]);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});

  // Handle modal close (MOVED UP - defined before useEffects)
  const handleClose = () => {
    setAttendees([{ name: '', age: '' }]);
    setFormResponses({});
    setErrors({});
    dispatch(clearRegistrationError());
    dispatch(clearSuccessMessage());
    onClose();
  };

  // Handle successful registration
  useEffect(() => {
    if (registrationStatus === 'succeeded' && currentRegistration) {
      console.log("✅ Modal: Registration succeeded, calling onSuccess");
      onSuccess?.({ 
        success: true, 
        message: successMessage,
        registration: currentRegistration 
      });
      handleClose(); // ✅ Now this is defined!
    }
  }, [registrationStatus, currentRegistration, successMessage, onSuccess]);

  // Clear errors when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(clearRegistrationError());
      dispatch(clearSuccessMessage());
    }
  }, [isOpen, dispatch]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  const handleAddAttendee = () => {
    if (attendees.length < event.maxAttendeesPerRegistration) {
      setAttendees([...attendees, { name: '', age: '' }]);
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

    // Validate attendees
    attendees.forEach((attendee, index) => {
      if (!attendee.name.trim()) {
        newErrors[`attendee_${index}_name`] = 'Name is required';
      }
      
      // Validate age if provided
      if (attendee.age && (isNaN(attendee.age) || attendee.age < 0 || attendee.age > 120)) {
        newErrors[`attendee_${index}_age`] = 'Please enter a valid age (0-120)';
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
  const formatEventDate = (dateTime) => {
    try {
      return format(new Date(dateTime), 'EEEE, MMMM do, yyyy \'at\' h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const renderFormField = (field) => {
    const value = formResponses[field.fieldName] || '';
    const error = errors[field.fieldName];

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              placeholder={`Enter ${field.fieldName.toLowerCase()}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              placeholder={`Enter ${field.fieldName.toLowerCase()}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Register for Event</h2>
            <p className="text-sm text-gray-600 mt-1">{event.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Event Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <FaCalendar />
              <span className="font-medium">Event Details</span>
            </div>
            <p className="text-sm text-gray-700">
              {formatEventDate(event.dateTime)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Venue:</strong> {event.venue}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Max attendees per registration:</strong> {event.maxAttendeesPerRegistration}
            </p>
          </div>

          {/* Attendees Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FaUser />
                Attendees
              </h3>
              {attendees.length < event.maxAttendeesPerRegistration && (
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <FaPlus size={12} />
                  Add Attendee
                </button>
              )}
            </div>

            {/* Attendees List */}
            {attendees.map((attendee, index) => (
              <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Attendee {index + 1}</h4>
                  {attendees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors[`attendee_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors[`attendee_${index}_name`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`attendee_${index}_name`]}</p>
                    )}
                  </div>
                  
                  {/* Age Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={attendee.age}
                      onChange={(e) => handleAttendeeChange(index, 'age', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors[`attendee_${index}_age`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter age"
                      min="0"
                      max="120"
                    />
                    {errors[`attendee_${index}_age`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`attendee_${index}_age`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Form Fields */}
          {event.registrationFields?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                {event.registrationFields.map(renderFormField)}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {registrationError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-700 text-sm">{registrationError}</p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registrationStatus === 'loading'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {registrationStatus === 'loading' ? 'Registering...' : 'Register for Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistrationModal;