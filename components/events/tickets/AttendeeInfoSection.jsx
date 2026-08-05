// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

// Forms guide (00-shared/design-system.md section 6): 14px slate-700 text, slate-300 border,
// rounded-lg, px-3 py-2.5, white; hover slate-400 border; focus teal ring (ring-2 ring-teal-300)
// with a teal-400 border; placeholder slate-400. Flat sizing (no responsive step-ups).
const INPUT_CLASS =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400';

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
    // Compact card: a 2-column grid on desktop that stacks on mobile. mt-6 (24px) sets it apart
    // from the ticket list above.
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4" data-attendee-section>
      <div className="flex items-center mb-4">
        <FaInfoCircle className="text-slate-500 mr-2 text-base" />
        <h3 className="text-base font-semibold text-slate-900">
          Attendee Information
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {event.registrationFields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {field.fieldName}
              {field.isRequired && (
                <span className="text-red-600 ml-0.5">*</span>
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
