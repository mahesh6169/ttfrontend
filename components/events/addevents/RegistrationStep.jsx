// components/events/addevents/RegistrationStep.jsx
// Step 3: Registration - Intent selection + registration/ticket configuration

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  updateField,
  setExternalTicketUrl,
  addTicketType,
  updateTicketType,
  removeTicketType,
  addDiscountCode,
  updateDiscountCode,
  removeDiscountCode,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  addRegistrationField,
  updateRegistrationField,
  updateFieldOptions,
  removeRegistrationField,
  updateGstIncluded,
  setFormErrors,
} from '@/store/slices/events/eventSlice';
import SeatingLayoutSection from './SeatingLayoutSection';

// Promotional Event Configuration
const PromotionalConfig = ({ formData, disabled, dispatch, errors }) => {
  const isPaidSelected = formData.isPaid === true;
  const isFreeSelected = formData.isPaid === false;

  return (
    <div className="space-y-4">
      {/* Free/Paid Selection */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
          Event Type <span className="text-red-500">*</span>
        </label>
        <div className={`inline-grid grid-cols-2 gap-2 ${disabled ? 'opacity-60' : ''}`}>
          <button
            type="button"
            onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: false }))}
            disabled={disabled}
            className={`py-2 px-6 text-sm sm:text-base rounded-lg border transition-colors ${
              isFreeSelected
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            RSVP
          </button>
          <button
            type="button"
            onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: true }))}
            disabled={disabled}
            className={`py-2 px-6 text-sm sm:text-base rounded-lg border transition-colors ${
              isPaidSelected
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Paid
          </button>
        </div>
        {errors?.isPaid && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {Array.isArray(errors.isPaid) ? errors.isPaid[0] : errors.isPaid}
          </p>
        )}
      </div>

      {/* External Ticket URL */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
          External Registration Link
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.externalTicketUrl || ''}
          onChange={(e) => dispatch(setExternalTicketUrl(e.target.value))}
          disabled={disabled}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
          placeholder="https://eventbrite.com/your-event"
        />
        <p className="text-xs text-slate-500 mt-1">
          Link where attendees can register or purchase tickets
        </p>
        {errors?.externalTicketUrl && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {Array.isArray(errors.externalTicketUrl) ? errors.externalTicketUrl[0] : errors.externalTicketUrl}
          </p>
        )}
      </div>

      {/* Promotional Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Promotional Event:</span> Listed for visibility only. Registration and check-in features are not available.
        </p>
      </div>
    </div>
  );
};

// Capacity Management Section (shared between free and paid)
const CapacityManagement = ({ formData, errors, dispatch, isPaid }) => {
  const [bookingLimitError, setBookingLimitError] = useState('');

  const getInputClasses = (hasError) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    return `${base} ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Event Capacity */}
        <div>
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Capacity
          </label>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={formData.capacity === '' ? '' : formData.capacity}
            onChange={(e) => {
              const val = e.target.value;
              dispatch(updateField({
                field: 'capacity',
                value: val === '' ? '' : Math.max(0, Number(val) || 0),
              }));
              if (errors?.capacity) {
                const newErrors = { ...errors };
                delete newErrors.capacity;
                dispatch(setFormErrors(newErrors));
              }
            }}
            onWheel={(e) => e.target.blur()}
            className={getInputClasses(!!errors?.capacity)}
            placeholder="0 = unlimited"
          />
          {errors?.capacity && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.capacity}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">0 = unlimited capacity</p>
        </div>

        {/* Booking Limit */}
        <div>
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Booking Limit
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={formData.maxAttendeesPerRegistration === '' ? '' : formData.maxAttendeesPerRegistration}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              if (val !== '' && numVal === 0) {
                setBookingLimitError('Must be 1 or above');
              } else if (val !== '' && numVal < 0) {
                setBookingLimitError('Cannot be negative');
              } else {
                setBookingLimitError('');
              }
              dispatch(updateField({ field: 'maxAttendeesPerRegistration', value: val }));
              if (errors?.maxAttendeesPerRegistration) {
                const newErrors = { ...errors };
                delete newErrors.maxAttendeesPerRegistration;
                dispatch(setFormErrors(newErrors));
              }
            }}
            onWheel={(e) => e.target.blur()}
            className={getInputClasses(!!errors?.maxAttendeesPerRegistration || !!bookingLimitError)}
            placeholder="Max per order"
          />
          {errors?.maxAttendeesPerRegistration && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.maxAttendeesPerRegistration}</p>
          )}
          {!errors?.maxAttendeesPerRegistration && bookingLimitError && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{bookingLimitError}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Maximum seats per order</p>
        </div>
      </div>
    </div>
  );
};

// Custom Registration Fields
const CustomRegistrationFields = ({ formData, errors, dispatch, isRecurring = false }) => {
  // Snapshot of which fields were flagged at the LAST validation attempt (Update / Next click).
  // Inline errors only render when a field is in this snapshot AND still currently invalid.
  // New issues that emerge from editing don't appear inline until the user clicks Update again.
  const [errorSnapshot, setErrorSnapshot] = useState({});
  // Which question card is currently expanded (null = all collapsed). Only one expanded at a time.
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    const regErrors = errors?.registrationFields;
    if (!regErrors || regErrors.length === 0) {
      setErrorSnapshot({});
      return;
    }
    // Parse helper output ("Question N: <message>") into per-field keys.
    // Helper is sequential — at most one error per question, so the snapshot reflects exactly
    // what the toast showed (no extra "could-be" errors leaking in).
    const newSnapshot = {};
    regErrors.forEach((errMsg) => {
      const match = errMsg.match(/^Question (\d+): (.+)$/);
      if (!match) return;
      const idx = Number(match[1]) - 1;
      const msg = match[2];
      if (msg.startsWith('Type your question')) {
        newSnapshot[`${idx}-name`] = true;
      } else {
        // Everything else is an options-related error
        newSnapshot[`${idx}-options`] = true;
      }
    });
    setErrorSnapshot(newSnapshot);
    // Auto-expand the first question with an error so the host sees what to fix
    const errorKeys = Object.keys(newSnapshot);
    if (errorKeys.length > 0) {
      const firstIdx = parseInt(errorKeys[0].split('-')[0], 10);
      if (!isNaN(firstIdx)) setExpandedIndex(firstIdx);
    }
  }, [errors?.registrationFields]);

  // Remove a field and adjust expandedIndex so it still points at the same logical question
  const handleRemoveField = (index) => {
    dispatch(removeRegistrationField(index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  // Add a new field (text or dropdown) and immediately expand it for editing
  const handleAddField = (opts) => {
    const newIndex = (formData.registrationFields || []).length;
    dispatch(addRegistrationField(opts));
    setExpandedIndex(newIndex);
  };

  const getNameError = (field, index) => {
    if (!errorSnapshot[`${index}-name`]) return null;
    return !field.fieldName?.trim() ? 'Type your question' : null;
  };
  const getOptionsError = (field, index) => {
    if (!errorSnapshot[`${index}-options`]) return null;
    if (field.fieldType !== 'select') return null;

    const options = field.fieldOptions || [];
    if (options.length === 0) return 'Add at least one option';
    if (options.some((o) => !o?.trim())) return 'Fill all options or remove the empty ones';
    const lowered = options.map((o) => o.trim().toLowerCase());
    if (new Set(lowered).size !== lowered.length) return 'Options must be unique';
    return null;
  };

  // Clear a field's snapshot entry as soon as the host takes any action on it.
  // The user has acknowledged the issue — don't surface new errors for that field until next Update.
  const clearSnapshotEntry = (key) => {
    setErrorSnapshot((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Disable "Add question / Add dropdown" buttons when any existing question is incomplete.
  // Stops hosts from stacking empty cards on top of unfinished ones.
  // An empty option ROW counts as incomplete — the question isn't ready until every row has text.
  const hasIncompleteQuestion = (formData.registrationFields || []).some((field) => {
    if (!field.fieldName?.trim()) return true;
    if (field.fieldType === 'select') {
      const options = field.fieldOptions || [];
      if (options.length === 0) return true;
      if (options.some((o) => !o?.trim())) return true;
      const lowered = options.map((o) => o.trim().toLowerCase());
      if (new Set(lowered).size !== lowered.length) return true;
    }
    return false;
  });

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
        Attendee Information
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Collect additional info (Name & Mobile are collected by default)
      </p>

      {(formData.registrationFields || []).length > 0 && (
        <div className="space-y-2 mb-4">
          {(formData.registrationFields || []).map((field, index) => {
            const isDropdown = field?.fieldType === 'select';
            const nameError = getNameError(field, index);
            const optionsError = getOptionsError(field, index);
            const hasAnyError = !!(nameError || optionsError);
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-lg p-3 bg-white ${
                  hasAnyError ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                {/* Header — always visible: name (collapsed only) + pencil toggle + remove */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {!isExpanded && (
                      <span className="text-sm text-slate-700 truncate block">
                        {field?.fieldName?.trim() ? (
                          field.fieldName
                        ) : (
                          <span className="italic text-slate-400">Untitled question</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isExpanded
                          ? 'text-teal-600 bg-teal-50'
                          : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                      }`}
                      aria-label={isExpanded ? 'Collapse question' : 'Edit question'}
                      title={isExpanded ? 'Collapse' : 'Edit'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(index)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove question"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded body — name input, options (if dropdown), required */}
                {isExpanded && (
                  <div className="mt-3">
                    {/* Question text */}
                    <input
                      type="text"
                      value={field?.fieldName || ''}
                      onChange={(e) => {
                        dispatch(updateRegistrationField({ index, field: 'fieldName', value: e.target.value }));
                        clearSnapshotEntry(`${index}-name`);
                      }}
                      className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                        nameError ? 'border-red-300' : 'border-slate-300'
                      }`}
                      placeholder={isDropdown ? 'e.g., T-shirt size' : 'e.g., Dietary requirements'}
                      maxLength="100"
                    />
                    {nameError && (
                      <p className="text-xs text-red-600 mt-1">{nameError}</p>
                    )}

                    {/* Options editor (only when type = Dropdown) */}
                    {isDropdown && (
                      <div className="mt-3 pl-3 border-l-2 border-teal-200">
                        <label className="block text-xs font-medium text-slate-600 mb-2">Options</label>
                        <div className="space-y-2">
                          {(field?.fieldOptions || []).map((option, optIdx) => (
                            <div key={optIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={option || ''}
                                onChange={(e) => {
                                  const newOptions = [...(field.fieldOptions || [])];
                                  newOptions[optIdx] = e.target.value;
                                  dispatch(updateFieldOptions({ index, options: newOptions }));
                                  clearSnapshotEntry(`${index}-options`);
                                }}
                                className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                                placeholder={`Option ${optIdx + 1}`}
                                maxLength="80"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newOptions = (field.fieldOptions || []).filter((_, i) => i !== optIdx);
                                  dispatch(updateFieldOptions({ index, options: newOptions }));
                                  clearSnapshotEntry(`${index}-options`);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                aria-label="Remove option"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(field.fieldOptions || []), ''];
                            dispatch(updateFieldOptions({ index, options: newOptions }));
                            clearSnapshotEntry(`${index}-options`);
                          }}
                          disabled={(field.fieldOptions || []).some((o) => !o?.trim())}
                          className="mt-2 inline-flex items-center px-3 py-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-teal-700"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add option
                        </button>
                        {optionsError && (
                          <p className="text-xs text-red-600 mt-2">{optionsError}</p>
                        )}
                      </div>
                    )}

                    {/* Required */}
                    <div className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={field?.isRequired || false}
                        onChange={(e) => dispatch(updateRegistrationField({ index, field: 'isRequired', value: e.target.checked }))}
                        className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
                      />
                      <label htmlFor={`required-${index}`} className="ml-2 text-sm text-slate-600">
                        Required
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Top-level error box removed — errors now show inline under each input.
          Toast on Next/Submit still summarises all errors. */}

      {/* Add buttons — type-specific entry. Disabled when any existing question is incomplete,
          so hosts can't pile up empty cards on top of unfinished ones. */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAddField()}
          disabled={hasIncompleteQuestion}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-teal-200"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Add question
        </button>
        <button
          type="button"
          onClick={() => handleAddField({ fieldType: 'select' })}
          disabled={hasIncompleteQuestion}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-teal-200"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          Add dropdown
        </button>
        {hasIncompleteQuestion && (
          <p className="w-full text-xs text-slate-500 mt-1">
            Complete the question above to add another.
          </p>
        )}
      </div>
    </div>
  );
};

// Ticket Types Section (for paid events)
const TicketTypesSection = ({ formData, errors, dispatch }) => {
  const [priceErrors, setPriceErrors] = useState({});

  const validatePriceDecimals = (value) => {
    if (!value || value === '') return true;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return true;
    return strValue.length - decimalIndex - 1 <= 2;
  };

  const getInputClasses = (hasError) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm text-slate-700 border rounded-lg focus:outline-none focus:ring-2';
    return `${base} ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
        Ticket Types
      </h3>
      <p className="text-xs text-slate-500 mb-4">Define pricing tiers for your event</p>

      {(formData.ticketTypes || []).length > 0 && (
        <div className="space-y-3 mb-4">
          {(formData.ticketTypes || []).map((ticket, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-700">
                  Ticket {index + 1}{ticket?.name ? `: ${ticket.name}` : ''}
                </span>
                {(formData.ticketTypes || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch(removeTicketType(index))}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ticket Name */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticket?.name || ''}
                    onChange={(e) => {
                      dispatch(updateTicketType({ index, field: 'name', value: e.target.value }));
                      if (errors?.[`ticketName_${index}`]) {
                        const newErrors = { ...errors };
                        delete newErrors[`ticketName_${index}`];
                        dispatch(setFormErrors(newErrors));
                      }
                    }}
                    placeholder="Early Bird"
                    className={getInputClasses(!!errors?.[`ticketName_${index}`])}
                    maxLength="100"
                  />
                  {errors?.[`ticketName_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`ticketName_${index}`][0]}</p>
                  )}
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={ticket.price === undefined || ticket.price === null ? '' : ticket.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!validatePriceDecimals(val)) {
                        setPriceErrors({ ...priceErrors, [index]: 'Maximum 2 decimal places allowed' });
                      } else if (val !== '' && Number(val) < 1) {
                        setPriceErrors({ ...priceErrors, [index]: 'Minimum ticket price is $1' });
                      } else {
                        const newErrors = { ...priceErrors };
                        delete newErrors[index];
                        setPriceErrors(newErrors);
                      }
                      dispatch(updateTicketType({ index, field: 'price', value: val }));
                      if (errors?.[`ticketPrice_${index}`]) {
                        const newErrors = { ...errors };
                        delete newErrors[`ticketPrice_${index}`];
                        dispatch(setFormErrors(newErrors));
                      }
                    }}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(!!errors?.[`ticketPrice_${index}`] || !!priceErrors[index])}
                    placeholder="0.00"
                  />
                  {errors?.[`ticketPrice_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`ticketPrice_${index}`][0]}</p>
                  )}
                  {priceErrors[index] && (
                    <p className="text-red-500 text-xs mt-1">{priceErrors[index]}</p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={ticket.startDate ? (ticket.startDate.includes('T') ? ticket.startDate.slice(0, 10) : ticket.startDate) : ''}
                    onChange={(e) => dispatch(updateTicketType({ index, field: 'startDate', value: e.target.value || null }))}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(false)}
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={ticket.expiryDate ? (ticket.expiryDate.includes('T') ? ticket.expiryDate.slice(0, 10) : ticket.expiryDate) : ''}
                    onChange={(e) => dispatch(updateTicketType({ index, field: 'expiryDate', value: e.target.value || null }))}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(false)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(addTicketType())}
        className="inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Ticket Type
      </button>
    </div>
  );
};

// Discount Codes (Paid Events Only) — see feature-add-discountcode.md S1.
// Mirrors TicketTypesSection. appliesToTicketTypes stores ticket-type NAMES (explicit — no
// "all by default"). kind is 'percent' | 'fixed' to match the backend enum exactly.
const DiscountCodesSection = ({ formData, errors, dispatch }) => {
  const getInputClasses = (hasError) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm text-slate-700 border rounded-lg focus:outline-none focus:ring-2';
    return `${base} ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  const clearError = (key) => {
    if (errors?.[key]) {
      const next = { ...errors };
      delete next[key];
      dispatch(setFormErrors(next));
    }
  };

  const codes = formData.discountCodes || [];
  // A code references ticket types by NAME, so only named ticket types can be covered.
  const namedTicketTypes = (formData.ticketTypes || []).filter((t) => (t?.name || '').trim());

  const toggleApplies = (index, name, checked) => {
    const current = codes[index]?.appliesToTicketTypes || [];
    const updated = checked ? [...new Set([...current, name])] : current.filter((nm) => nm !== name);
    dispatch(updateDiscountCode({ index, field: 'appliesToTicketTypes', value: updated }));
    clearError(`discountApplies_${index}`);
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
        Discount Codes
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Optional. Create promo codes buyers apply at checkout. Each code discounts only the ticket types you tick.
      </p>

      {codes.length > 0 && (
        <div className="space-y-3 mb-4">
          {codes.map((dc, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-700">
                  Code {index + 1}{dc?.code ? `: ${dc.code}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(removeDiscountCode(index))}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove discount code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={dc?.code || ''}
                    onChange={(e) => { dispatch(updateDiscountCode({ index, field: 'code', value: e.target.value.toUpperCase() })); clearError(`discountCode_${index}`); }}
                    placeholder="SUMMER20"
                    maxLength="50"
                    className={getInputClasses(!!errors?.[`discountCode_${index}`])}
                  />
                  {errors?.[`discountCode_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`discountCode_${index}`][0]}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type <span className="text-red-500">*</span></label>
                  <select
                    value={dc?.kind || 'percent'}
                    onChange={(e) => dispatch(updateDiscountCode({ index, field: 'kind', value: e.target.value }))}
                    className={getInputClasses(false)}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed amount ($)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {dc?.kind === 'fixed' ? 'Amount ($)' : 'Percent (1–90)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={dc?.kind === 'fixed' ? '0.01' : '1'}
                    max={dc?.kind === 'fixed' ? undefined : '90'}
                    step={dc?.kind === 'fixed' ? '0.01' : '1'}
                    value={dc.value === null || dc.value === undefined ? '' : dc.value}
                    onChange={(e) => { const v = e.target.value; dispatch(updateDiscountCode({ index, field: 'value', value: v === '' ? null : Number(v) })); clearError(`discountValue_${index}`); }}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(!!errors?.[`discountValue_${index}`])}
                    placeholder={dc?.kind === 'fixed' ? '5.00' : '10'}
                  />
                  {errors?.[`discountValue_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`discountValue_${index}`][0]}</p>}
                </div>

                {/* Max uses */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Max uses (blank = unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={dc.maxUses === null || dc.maxUses === undefined ? '' : dc.maxUses}
                    onChange={(e) => { const v = e.target.value; dispatch(updateDiscountCode({ index, field: 'maxUses', value: v === '' ? null : Number(v) })); clearError(`discountUses_${index}`); }}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(!!errors?.[`discountUses_${index}`])}
                    placeholder="Unlimited"
                  />
                  {errors?.[`discountUses_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`discountUses_${index}`][0]}</p>}
                </div>

                {/* Valid from */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Valid from</label>
                  <input
                    type="date"
                    value={dc.validFrom ? (dc.validFrom.includes('T') ? dc.validFrom.slice(0, 10) : dc.validFrom) : ''}
                    onChange={(e) => { dispatch(updateDiscountCode({ index, field: 'validFrom', value: e.target.value || null })); clearError(`discountDates_${index}`); }}
                    className={getInputClasses(!!errors?.[`discountDates_${index}`])}
                  />
                </div>

                {/* Valid until */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Valid until</label>
                  <input
                    type="date"
                    value={dc.validUntil ? (dc.validUntil.includes('T') ? dc.validUntil.slice(0, 10) : dc.validUntil) : ''}
                    onChange={(e) => { dispatch(updateDiscountCode({ index, field: 'validUntil', value: e.target.value || null })); clearError(`discountDates_${index}`); }}
                    className={getInputClasses(!!errors?.[`discountDates_${index}`])}
                  />
                </div>
              </div>

              {errors?.[`discountDates_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`discountDates_${index}`][0]}</p>}

              {/* Applies to (ticket-type NAMES, explicit) */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-600 mb-2">
                  Applies to <span className="text-red-500">*</span>
                  <span className="font-normal text-slate-400"> — tick the ticket types this code discounts</span>
                </label>
                {namedTicketTypes.length === 0 ? (
                  <p className="text-xs text-amber-600">Name your ticket types above first, then choose which ones this code applies to.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {namedTicketTypes.map((t) => (
                      <label key={t.name} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={(dc.appliesToTicketTypes || []).includes(t.name)}
                          onChange={(e) => toggleApplies(index, t.name, e.target.checked)}
                          className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
                        />
                        <span className="text-sm text-slate-600">{t.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {errors?.[`discountApplies_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`discountApplies_${index}`][0]}</p>}
              </div>

              {/* Active + Show hint */}
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dc?.active !== false}
                    onChange={(e) => dispatch(updateDiscountCode({ index, field: 'active', value: e.target.checked }))}
                    className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
                  />
                  <span className="text-sm text-slate-600">Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dc?.showHint === true}
                    onChange={(e) => dispatch(updateDiscountCode({ index, field: 'showHint', value: e.target.checked }))}
                    className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
                  />
                  <span className="text-sm text-slate-600">Show discount code during checkout</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(addDiscountCode())}
        className="inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Discount Code
      </button>
    </div>
  );
};

// GST Configuration
const GSTConfiguration = ({ formData, dispatch }) => {
  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="gstIncluded"
          checked={formData.gstIncluded || false}
          onChange={(e) => dispatch(updateGstIncluded(e.target.checked))}
          className="mt-0.5 w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
        />
        <div className="flex-1">
          <label htmlFor="gstIncluded" className="block text-sm font-medium text-slate-700 cursor-pointer">
            Prices include GST
          </label>
          {formData.gstIncluded && (
            <p className="text-xs text-slate-500 mt-1">
              Prices will display as "$100 (incl GST)"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main RegistrationStep Component
const RegistrationStep = ({
  formData = {},
  errors = {},
  mode = 'add',
  readOnly = false,
  onSeatingImagesChange
}) => {
  const dispatch = useDispatch();
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const disabled = readOnly || isViewMode;

  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  const isPromotionalEvent = formData.eventIntent === 'promote';
  const isHostEvent = formData.eventIntent === 'host';
  const isPaidEvent = formData.isPaid || false;

  return (
    <div className="space-y-6">
      {/* Promotional Event Configuration */}
      {isPromotionalEvent && (
        <PromotionalConfig
          formData={formData}
          disabled={disabled}
          dispatch={dispatch}
          errors={errors}
        />
      )}

      {/* Host Event Configuration */}
      {isHostEvent && (
        <>
          {/* Configuration based on Free/Paid */}
          <div className="space-y-6">
            {/* Capacity Management */}
            <CapacityManagement
              formData={formData}
              errors={errors}
              dispatch={dispatch}
              isPaid={isPaidEvent}
            />

            {/* Ticket Types (Paid Only) */}
            {isPaidEvent && (
              <TicketTypesSection
                formData={formData}
                errors={errors}
                dispatch={dispatch}
              />
            )}

            {/* Discount Codes (Paid Only) */}
            {isPaidEvent && (
              <DiscountCodesSection
                formData={formData}
                errors={errors}
                dispatch={dispatch}
              />
            )}

            {/* GST Configuration (Paid Only) */}
            {isPaidEvent && (
              <GSTConfiguration
                formData={formData}
                dispatch={dispatch}
              />
            )}

            {/* Seating Layout (Paid Only) */}
            {isPaidEvent && (
              <SeatingLayoutSection
                formData={formData}
                errors={errors}
                dispatch={dispatch}
                isEditMode={isEditMode}
                onSeatingImagesChange={onSeatingImagesChange}
              />
            )}

            {/* Attendee Information */}
            <CustomRegistrationFields
              formData={formData}
              errors={errors}
              dispatch={dispatch}
              isRecurring={isRecurringEvent}
            />
          </div>
        </>
      )}

      {/* No Intent Selected - Should not happen since intent is in Step 1 */}
      {!formData.eventIntent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <svg className="w-10 h-10 mx-auto text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-amber-700 font-medium">Event type not selected</p>
          <p className="text-amber-600 text-sm mt-1">Please go back to Step 1 and select whether you want to promote or host this event.</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationStep;
