// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { FaInfoCircle, FaAsterisk } from 'react-icons/fa';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

// Exact /events/add input styling (RegistrationStep getInputClasses): slate border, teal focus ring.
const INPUT_CLASS =
  'w-full p-3 sm:p-2 text-base sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300';

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
            className={`${INPUT_CLASS} resize-vertical`}
            placeholder="Enter requested details"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={INPUT_CLASS}
            placeholder={`Enter ${field.fieldName.toLowerCase()}`}
          />
        );

      case 'select':
        // Custom Listbox (not a native <select>) — the OS option list can't be
        // recoloured with CSS, so this is the only way to kill the blue highlight.
        // Active option = teal, matching the /events/add dropdowns.
        return (
          <Listbox value={value} onChange={(v) => handleFieldChange(field.fieldName, v)}>
            <div className="relative">
              <ListboxButton className={`${INPUT_CLASS} relative pr-9 text-left cursor-pointer`}>
                <span className={`block truncate ${value ? 'text-slate-900' : 'text-slate-400'}`}>
                  {value || 'Select'}
                </span>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </ListboxButton>
              <ListboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none">
                {field.fieldOptions?.map((option, idx) => (
                  <ListboxOption
                    key={idx}
                    value={option}
                    className={({ active, selected }) =>
                      `cursor-pointer select-none py-2 px-3 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'} ${selected ? 'font-semibold' : ''}`
                    }
                  >
                    {option}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={INPUT_CLASS}
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
              className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
            />
            <label
              htmlFor={`field-${field.fieldName}`}
              className="ml-2 text-sm text-slate-700"
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
    <div className="border-t border-slate-200 pt-3 sm:pt-4 mb-3 sm:mb-6" data-attendee-section>
      <div className="flex items-center mb-2 sm:mb-4">
        <FaInfoCircle className="text-slate-500 mr-1.5 sm:mr-2 text-sm sm:text-base" />
        <h3 className="text-sm sm:text-base font-semibold text-slate-800">
          Attendee Information
        </h3>
      </div>

      {/* Readable form column — inputs must not span the full page width on desktop */}
      <div className="space-y-3 sm:space-y-4 max-w-lg">
        {event.registrationFields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-slate-600 mb-1 sm:mb-2">
              {field.fieldName}
              {field.isRequired && (
                <FaAsterisk className="inline-block ml-0.5 sm:ml-1 text-red-600 text-[8px] sm:text-[10px]" />
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
