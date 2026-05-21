// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { FaInfoCircle, FaAsterisk } from 'react-icons/fa';

const AttendeeInfoSection = ({ event, formResponses = {}, onFormResponseUpdate }) => {

  // Check if event has custom registration fields
  if (!event?.registrationFields || event.registrationFields.length === 0) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    if (onFormResponseUpdate) {
      onFormResponseUpdate(fieldName, value);
    }
  };

  const renderFormField = (field) => {
    const value = formResponses[field.fieldName] || '';

    switch (field.fieldType) {
      case 'text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            rows={2}
            className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            placeholder={`Enter requested details`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select</option>
            {field.fieldOptions?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md sm:rounded-lg focus:ring-1 sm:focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`field-${field.fieldName}`}
              checked={value === 'true' || value === true}
              onChange={(e) =>
                handleFieldChange(field.fieldName, e.target.checked ? 'true' : 'false')
              }
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor={`field-${field.fieldName}`}
              className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-700"
            >
              {field.fieldName}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border-t pt-3 sm:pt-4 mb-3 sm:mb-6" data-attendee-section>
      <div className="flex items-center mb-2 sm:mb-4">
        <FaInfoCircle className="text-blue-600 mr-1.5 sm:mr-2 text-sm sm:text-lg" />
        <h3 className="text-sm sm:text-lg font-medium sm:font-semibold text-gray-900">
          Additional Info
        </h3>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {event.registrationFields.map((field, index) => (
          <div key={index}>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {field.fieldName}
              {field.isRequired && (
                <FaAsterisk className="inline-block ml-0.5 sm:ml-1 text-red-500 text-[8px] sm:text-xs" />
              )}
            </label>
            {renderFormField(field)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendeeInfoSection;