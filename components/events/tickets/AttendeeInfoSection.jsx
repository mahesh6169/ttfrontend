// components/events/tickets/AttendeeInfoSection.jsx

import React from 'react';
import { FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { TEXT_ANSWER_MAX, SCALE_MIN, SCALE_MAX } from '@/utils/events/questionTypes';
import DateTimeField from '@/components/shared/DateTimeField';

// Forms guide (00-shared/design-system.md section 6): 14px slate-700 text, slate-300 border,
// rounded-lg, px-3 py-2.5, white; hover slate-400 border; focus teal ring (ring-2 ring-teal-300)
// with a teal-400 border; placeholder slate-400. Flat sizing (no responsive step-ups).
const INPUT_CLASS =
  'w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400';

// errors + blockMessageFor + isFieldBlocking are OPTIONAL (free-RSVP only): errors is a { fieldName:
// message } map for required-field errors; blockMessageFor(field) returns a blocking-answer message or
// null and renders the FULL red box under the field (builder Preview uses this); isFieldBlocking(field)
// returns a boolean and renders a SMALL red marker instead - the real RSVP form uses this because the
// full message rides the sticky bar, so under the field it only needs to point at WHICH answer blocks.
// Paid usage passes none, so its rendering is unchanged.
// singleColumn opt-in stacks one question per row (free-RSVP asks for this so blocking callouts read
// cleanly); the paid flow leaves it off and keeps the 2-column grid.
// bare opt-in drops the outer card (border + padding) so this can sit as a section INSIDE another
// form card, separated by a top divider instead. The paid flow leaves it off and stays a standalone card.
const AttendeeInfoSection = ({ event, formResponses = {}, onFormResponseUpdate, errors = {}, blockMessageFor, isFieldBlocking, singleColumn = false, bare = false }) => {

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
            maxLength={TEXT_ANSWER_MAX}
            className={`${INPUT_CLASS} resize-vertical`}
            placeholder="Enter requested details"
          />
        );

      case 'radio':
        // Multiple choice: full-width teal radio rows; the whole row is tappable and long option
        // sentences wrap beside the button (design-system radio control).
        return (
          <div className="space-y-2">
            {(field.fieldOptions || []).map((option, idx) => (
              <label
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-slate-300 px-3 py-2.5 cursor-pointer hover:border-slate-400"
              >
                <input
                  type="radio"
                  name={`field-${field.fieldName}`}
                  value={option}
                  checked={value === option}
                  onChange={() => handleFieldChange(field.fieldName, option)}
                  className="mt-0.5 w-4 h-4 accent-teal-700 border-slate-300 focus:ring-teal-300 shrink-0"
                />
                <span className="min-w-0 text-sm text-slate-700 break-words">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkboxes': {
        // Pick-many: one checkbox row per option; the stored answer is the list of chosen options.
        const chosen = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {(field.fieldOptions || []).map((option, idx) => (
              <label
                key={idx}
                className="flex items-start gap-2.5 rounded-lg border border-slate-300 px-3 py-2.5 cursor-pointer hover:border-slate-400"
              >
                <input
                  type="checkbox"
                  checked={chosen.includes(option)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...chosen, option]
                      : chosen.filter((v) => v !== option);
                    handleFieldChange(field.fieldName, next);
                  }}
                  className="mt-0.5 w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300 shrink-0"
                />
                <span className="min-w-0 text-sm text-slate-700 break-words">{option}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'scale': {
        // Linear scale, fixed 1..5: five segmented buttons across, the selected one teal.
        // Optional per-number labels (stored positionally in fieldOptions) list underneath.
        const selected = Number(value);
        const steps = [];
        for (let n = SCALE_MIN; n <= SCALE_MAX; n += 1) steps.push(n);
        const labels = field.fieldOptions || [];
        return (
          <div>
            {/* Phone tier (<768): pills stack vertically full-width, number and label side by
                side. Tablet/desktop: the classic five-across row, label under the number. */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              {steps.map((n) => {
                const lbl = (labels[n - 1] || '').trim();
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleFieldChange(field.fieldName, n)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 text-sm rounded-lg border transition-colors md:block md:px-1 ${
                      selected === n
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span className="md:block">{n}</span>
                    {/* Label lives inside the pill: beside the number on phone, under it on md+. */}
                    {lbl && (
                      <span
                        className={`text-[11px] leading-tight break-words md:block md:mt-0.5 ${
                          selected === n ? 'text-teal-50' : 'text-slate-500'
                        }`}
                      >
                        {lbl}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
            className={`${INPUT_CLASS} max-w-[160px]`}
          />
        );

      case 'yesno':
        // Yes/No: a single tick. Ticked records "Yes"; unticked records "No" (required means it must
        // be ticked - the agreement use). The question text is the label above; this caption is "Yes".
        return (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={value === 'Yes'}
              onChange={(e) => handleFieldChange(field.fieldName, e.target.checked ? 'Yes' : 'No')}
              className="w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300"
            />
            <span className="text-sm text-slate-700">Yes</span>
          </label>
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
        // Modern calendar-popover picker (shared DateTimeField) instead of the native control, which
        // reads as a dated/broken dropdown and differs across phones. "Also ask time" (includeTime)
        // adds the hour/minute + AM/PM row. Same stored value shape as before.
        return (
          <DateTimeField
            value={value}
            includeTime={!!field.includeTime}
            onChange={(v) => handleFieldChange(field.fieldName, v)}
            ariaLabel={field.fieldName}
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
          const fieldBlocks = isFieldBlocking ? isFieldBlocking(field) : false;
          return (
            // min-w-0 lets a long answer wrap inside the column instead of dragging the page wider.
            <div key={index} className="min-w-0">
              <label className="block text-sm font-medium text-slate-700 mb-1 break-words whitespace-pre-line">
                {field.fieldName}
                {field.isRequired ? (
                  <span className="text-red-600 ml-0.5">*</span>
                ) : (
                  // A skippable question reads as such - a light "(optional)" where the asterisk would be.
                  <span className="ml-1.5 font-normal text-xs text-slate-400">(optional)</span>
                )}
                {/* How-to-answer hint for the types where the interaction isn't self-evident. */}
                {field.fieldType === 'radio' && (
                  <span className="ml-1.5 font-normal text-xs text-slate-400">Choose one</span>
                )}
                {field.fieldType === 'checkboxes' && (
                  <span className="ml-1.5 font-normal text-xs text-slate-400">Choose all that apply</span>
                )}
                {field.fieldType === 'scale' && (
                  <span className="ml-1.5 font-normal text-xs text-slate-400">Pick one number</span>
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
              {!blockMessage && fieldBlocks && (
                // Small marker: the sticky bar carries the full reason, so here we only point at the
                // answer that blocks - "change this to continue".
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <FaExclamationCircle className="flex-shrink-0" />
                  This answer blocks registration
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendeeInfoSection;
