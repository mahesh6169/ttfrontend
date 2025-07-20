// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaInfoCircle, FaAsterisk } from 'react-icons/fa';
import {
  updateFormResponse,
  selectFormResponses,
} from '@/store/slices/events/ticketPurchaseSlice';

const AttendeeInfoSection = ({ event, errors = {} }) => {
  const dispatch = useDispatch();
  const formResponses = useSelector(selectFormResponses);

  // Check if event has custom registration fields
  if (!event?.registrationFields || event.registrationFields.length === 0) {
    return null;
  }

  const handleFieldChange = (fieldName, value) => {
    dispatch(updateFormResponse({ fieldName, value }));
  };

  const renderFormField = (field) => {
    const value = formResponses[field.fieldName] || '';
    const error = errors[field.fieldName];

    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {field.fieldName}</option>
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
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
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
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor={`field-${field.fieldName}`}
              className="ml-2 text-gray-700"
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
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaInfoCircle className="text-blue-600 mr-2 text-lg" />
        <h3 className="text-lg font-semibold text-gray-900">
          Attendee Additional Information
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Please provide the following information for your registration
      </p>

      <div className="space-y-4">
        {event.registrationFields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.fieldName}
              {field.isRequired && (
                <FaAsterisk className="inline-block ml-1 text-red-500 text-xs" />
              )}
            </label>
            {renderFormField(field)}
            {errors[field.fieldName] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.fieldName]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendeeInfoSection;