// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';

// Forms guide (00-shared/design-system.md section 6): 14px slate-700 text, slate-300 border,
// rounded-lg, px-3 py-2.5, white; hover slate-400 border; focus teal ring (ring-2 ring-teal-300)
// with a teal-400 border; placeholder slate-400. Flat sizing (no responsive step-ups).
const INPUT_CLASS =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400';

// errors + blockMessageFor are OPTIONAL (free-RSVP only): errors is a { fieldName: message } map for
// required-field errors, blockMessageFor(field) returns a blocking-answer message or null. Paid usage
// passes neither, so its rendering is unchanged.
// singleColumn opt-in stacks one question per row (free-RSVP asks for this so blocking callouts read
// cleanly); the paid flow leaves it off and keeps the 2-column grid.
// bare opt-in drops the outer card (border + padding) so this can sit as a section INSIDE another
// form card, separated by a top divider instead. The paid flow leaves it off and stays a standalone card.
const AttendeeInfoSection = ({ event, formResponses = {}, onFormResponseUpdate, errors = {}, blockMessageFor, singleColumn = false, bare = false }) => {

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
              {/* anchor (Headless UI v2) portals + auto-flips the panel and keeps a 16px viewport
                  gap, so near the bottom of a scrolled page it opens UPWARD instead of behind the
                  fixed z-40 checkout bar. Matches every other Listbox in the app. z-50 sits above
                  that bar. */}
              <ListboxOptions
                anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
              >
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
    // from the ticket list above. In `bare` mode it drops the border/padding and rides a top divider
    // so it reads as a section within a bigger form card.
    <div
      className={
        bare
          ? 'mt-6 pt-6 border-t border-slate-200'
          : 'mt-6 rounded-lg border border-slate-200 bg-white p-4'
      }
      data-attendee-section
    >
      <div className="flex items-center mb-4">
        <FaInfoCircle className="text-slate-500 mr-2 text-base" />
        <h3 className="text-base font-semibold text-slate-900">
          Attendee Information
        </h3>
      </div>

      <div className={`grid gap-4 ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {event.registrationFields.map((field, index) => {
          const fieldError = errors[field.fieldName];
          const blockMessage = blockMessageFor ? blockMessageFor(field) : null;
          return (
            <div key={index}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.fieldName}
                {field.isRequired && (
                  <span className="text-red-600 ml-0.5">*</span>
                )}
              </label>
              {renderFormField(field)}
              {fieldError && (
                <p className="text-xs text-red-600 mt-1">{fieldError}</p>
              )}
              {blockMessage && (
                // Shared callout (design-system.md section 10): tinted red box, 1px border, 14px text.
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
                  <span>{blockMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendeeInfoSection;
