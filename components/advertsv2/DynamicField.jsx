// components/adverts/DynamicField.jsx
'use client';

import React from 'react';
import { shouldShowField } from './CategoriesConfig';

const DynamicField = ({ fieldKey, fieldConfig, value, onChange, formData, errors = [] }) => {
  // Check if field should be shown based on conditions
  if (!shouldShowField(fieldConfig, formData)) {
    return null;
  }

  const fieldError = errors.find(err => err.includes(fieldConfig.label));
  const hasError = !!fieldError;

  const handleChange = (e) => {
    const newValue = fieldConfig.type === 'number' 
      ? parseFloat(e.target.value) || ''
      : e.target.value;
    onChange(fieldKey, newValue);
  };

  const handleMultiSelectChange = (option) => {
    const currentValues = value || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    onChange(fieldKey, newValues);
  };

  const baseInputClasses = `w-full p-2 border rounded focus:outline-none focus:ring-2 ${
    hasError 
      ? 'border-red-500 focus:ring-red-300' 
      : 'border-gray-300 focus:ring-teal-300'
  }`;

  const renderField = () => {
    switch (fieldConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder={fieldConfig.placeholder}
            className={baseInputClasses}
            required={fieldConfig.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={handleChange}
            min={fieldConfig.min}
            max={fieldConfig.max}
            className={baseInputClasses}
            required={fieldConfig.required}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={handleChange}
            className={baseInputClasses}
            required={fieldConfig.required}
          >
            <option value="">Select {fieldConfig.label}</option>
            {fieldConfig.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {fieldConfig.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={() => handleMultiSelectChange(option)}
                  className="mr-2 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={handleChange}
            placeholder={fieldConfig.placeholder}
            className={`${baseInputClasses} h-24`}
            required={fieldConfig.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-4">
      <label className="block font-bold mb-2 text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {hasError && (
        <p className="text-red-500 text-sm mt-1">{fieldError}</p>
      )}
    </div>
  );
};

export default DynamicField;