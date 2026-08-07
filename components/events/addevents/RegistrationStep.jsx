// components/events/addevents/RegistrationStep.jsx
// Step 3: Registration - Intent selection + registration/ticket configuration

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FaInfoCircle } from 'react-icons/fa';
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

// Day part (yyyy-mm-dd) of a date string/Date, in local terms — used to compare ticket/discount
// dates against the event day (by day, ignoring time).
const dayOf = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  try {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
};

// Promotional Event Configuration
const PromotionalConfig = ({ formData, disabled, dispatch, errors }) => {
  const isPaidSelected = formData.isPaid === true;
  const isFreeSelected = formData.isPaid === false;

  return (
    <div className="space-y-4">
      {/* Free/Paid Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event Type <span className="text-red-600">*</span>
        </label>
        <div className={`inline-grid grid-cols-2 gap-2 ${disabled ? 'opacity-60' : ''}`}>
          <button
            type="button"
            onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: false }))}
            disabled={disabled}
            className={`py-2 px-6 text-sm rounded-lg border transition-colors ${
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
            className={`py-2 px-6 text-sm rounded-lg border transition-colors ${
              isPaidSelected
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Paid
          </button>
        </div>
        {errors?.isPaid && (
          <p className="text-red-600 text-xs mt-1">
            {Array.isArray(errors.isPaid) ? errors.isPaid[0] : errors.isPaid}
          </p>
        )}
      </div>

      {/* External Ticket URL */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          External Registration Link
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.externalTicketUrl || ''}
          onChange={(e) => dispatch(setExternalTicketUrl(e.target.value))}
          disabled={disabled}
          className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
          placeholder="https://eventbrite.com/your-event"
        />
        <p className="text-xs text-slate-500 mt-1">
          Link where attendees can register or purchase tickets
        </p>
        {errors?.externalTicketUrl && (
          <p className="text-red-600 text-xs mt-1">
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
    const base = 'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:border-teal-400';
    return `${base} ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Event Capacity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Capacity {isPaid
              ? <span className="text-red-600">*</span>
              : <span className="font-normal text-slate-400 ml-1">(optional)</span>}
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
          {errors?.capacity ? (
            <p className="text-red-600 text-xs mt-1">{errors.capacity}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">0 = unlimited capacity</p>
          )}
        </div>

        {/* Booking Limit */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Booking Limit <span className="text-red-600">*</span>
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
          {errors?.maxAttendeesPerRegistration ? (
            <p className="text-red-600 text-xs mt-1">{errors.maxAttendeesPerRegistration}</p>
          ) : bookingLimitError ? (
            <p className="text-red-600 text-xs mt-1">{bookingLimitError}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Maximum seats per order</p>
          )}
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
  // Which question is awaiting delete confirmation (null = none).
  const [confirmDeleteField, setConfirmDeleteField] = useState(null);

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
    setConfirmDeleteField(null);
  };

  // Add a new field (text or dropdown) and immediately expand it for editing
  const handleAddField = (opts) => {
    const newIndex = (formData.registrationFields || []).length;
    dispatch(addRegistrationField(opts));
    setExpandedIndex(newIndex);
  };

  // A question is "empty" when it has no text and no real options.
  const isEmptyField = (f) =>
    !f?.fieldName?.trim() && !(f?.fieldOptions || []).some((o) => o?.trim());

  // Done: discard a blank card; validate (name + options) and keep it open if invalid, else collapse.
  const handleDoneField = (index) => {
    const f = (formData.registrationFields || [])[index];
    if (isEmptyField(f)) { handleRemoveField(index); return; }
    const snap = {};
    if (!f.fieldName?.trim()) snap[`${index}-name`] = true;
    if (f.fieldType === 'select') {
      const opts = f.fieldOptions || [];
      const lowered = opts.map((o) => (o || '').trim().toLowerCase());
      const bad = opts.length === 0 || opts.some((o) => !o?.trim()) || new Set(lowered).size !== lowered.length;
      if (bad) snap[`${index}-options`] = true;
    }
    if (Object.keys(snap).length) { setErrorSnapshot((prev) => ({ ...prev, ...snap })); return; } // stays open
    setErrorSnapshot((prev) => { const n = { ...prev }; delete n[`${index}-name`]; delete n[`${index}-options`]; return n; });
    setExpandedIndex(null);
  };

  // Cancel: discard a blank card, else just collapse (keeps typed values).
  const handleCancelField = (index) => {
    const f = (formData.registrationFields || [])[index];
    if (isEmptyField(f)) { handleRemoveField(index); return; }
    setErrorSnapshot((prev) => { const n = { ...prev }; delete n[`${index}-name`]; delete n[`${index}-options`]; return n; });
    setExpandedIndex(null);
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
      <h3 className="font-medium text-sm mb-1 text-slate-700">
        Attendee Information
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Collect additional info{!formData.isPaid && ' (Name & Mobile are collected by default)'}
      </p>

      {(formData.registrationFields || []).length > 0 && (
        <div className="space-y-2 mb-4">
          {(formData.registrationFields || []).map((field, index) => {
            const isDropdown = field?.fieldType === 'select';
            const nameError = getNameError(field, index);
            const optionsError = getOptionsError(field, index);
            const hasAnyError = !!(nameError || optionsError);
            const isExpanded = expandedIndex === index || isEmptyField(field)
              || !!errorSnapshot[`${index}-name`] || !!errorSnapshot[`${index}-options`];
            return (
              <div
                key={index}
                className={`border rounded-lg p-3 bg-white ${
                  hasAnyError ? 'border-red-300' : 'border-slate-200'
                }`}
              >
                {isExpanded ? (
                  <>
                    {/* Question text */}
                    <input
                      type="text"
                      value={field?.fieldName || ''}
                      onChange={(e) => {
                        dispatch(updateRegistrationField({ index, field: 'fieldName', value: e.target.value }));
                        clearSnapshotEntry(`${index}-name`);
                      }}
                      className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                        nameError ? 'border-red-500 bg-red-50' : 'border-slate-300'
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
                        <label className="block text-xs font-medium text-slate-700 mb-2">Options</label>
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
                                className="flex-1 px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
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
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                        className="w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300"
                      />
                      <label htmlFor={`required-${index}`} className="ml-2 text-sm text-slate-700">
                        Required
                      </label>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => handleCancelField(index)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDoneField(index)}
                        className="text-sm font-medium text-teal-700 hover:text-teal-800"
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : (
                  /* Collapsed summary: question · type (· Required) + edit/delete */
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 min-w-0 flex-1 text-sm">
                      <span className="truncate text-slate-700">
                        {field?.fieldName?.trim() ? field.fieldName : <span className="italic text-slate-400">Untitled question</span>}
                      </span>
                      <span className="shrink-0 font-normal text-slate-400">
                        · {isDropdown ? 'Dropdown' : 'Text'}{field?.isRequired ? ' · Required' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDeleteField === index ? (
                        <span className="flex items-center gap-2 text-xs text-slate-600">
                          Delete?
                          <button
                            type="button"
                            onClick={() => { handleRemoveField(index); setConfirmDeleteField(null); }}
                            className="font-medium text-red-600 hover:text-red-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteField(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(index)}
                            aria-label="Edit question"
                            className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteField(index)}
                            aria-label="Delete question"
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
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
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <button
          type="button"
          onClick={() => handleAddField()}
          disabled={hasIncompleteQuestion}
          className="inline-flex items-center text-sm font-medium text-teal-700 hover:text-teal-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-teal-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add question
        </button>
        <button
          type="button"
          onClick={() => handleAddField({ fieldType: 'select' })}
          disabled={hasIncompleteQuestion}
          className="inline-flex items-center text-sm font-medium text-teal-700 hover:text-teal-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-teal-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
  // Ticket accordion: which row is expanded (null = none) + per-row errors captured on Done.
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketRowErrors, setTicketRowErrors] = useState({});
  // Which row is awaiting delete confirmation (null = none).
  const [confirmDeleteTicket, setConfirmDeleteTicket] = useState(null);

  const validatePriceDecimals = (value) => {
    if (!value || value === '') return true;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return true;
    return strValue.length - decimalIndex - 1 <= 2;
  };

  const getInputClasses = (hasError) => {
    const base = 'w-full px-3 py-2.5 text-sm text-slate-700 bg-white [color-scheme:light] placeholder:text-slate-400 hover:border-slate-400 border rounded-lg focus:outline-none focus:ring-2 focus:border-teal-400';
    return `${base} ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  // --- Ticket accordion helpers ---
  const priceIsEmpty = (p) => p === null || p === undefined || p === '';
  const isEmptyTicket = (t) =>
    !t?.name?.trim() && priceIsEmpty(t?.price) && !t?.startDate && !t?.expiryDate;

  const eventDay = dayOf(formData.dateTime);
  const maxPer = Number(formData.maxAttendeesPerRegistration) || 0;

  // A ticket type is a bundle when its bundleSize holds a value (empty = normal single ticket).
  const isBundle = (t) => t?.bundleSize !== '' && t?.bundleSize !== null && t?.bundleSize !== undefined;

  // Same rule as the step validator (name + price required, $1 min, 2 decimals) + date window.
  const validateTicket = (t) => {
    const errs = {};
    if (!t?.name?.trim()) errs.name = 'Name is required';
    if (priceIsEmpty(t?.price)) errs.price = 'Price is required';
    else if (!validatePriceDecimals(t.price)) errs.price = 'Maximum 2 decimal places allowed';
    else if (Number(t.price) < 1) errs.price = 'Minimum ticket price is $1';
    // Bundle rules mirror the server: size >= 2 (whole), no bigger than the per-order limit, and the
    // Price field (the whole-bundle price) must divide evenly into per-person shares of at least $1.
    if (isBundle(t)) {
      const size = Number(t.bundleSize);
      const price = Number(t.price);
      if (!Number.isInteger(size) || size < 2) {
        errs.bundle = 'Bundle size must be a whole number of 2 or more';
      } else if (maxPer && size > maxPer) {
        errs.bundle = `Bundle size can't be more than the ${maxPer} tickets allowed per order`;
      } else if (!priceIsEmpty(t?.price) && !isNaN(price)) {
        if (price % size !== 0) errs.bundle = `Bundle price must divide evenly by ${size}`;
        else if (price / size < 1) errs.bundle = "Each person's share must be at least $1";
      }
    }
    // Date window: start/expiry on or before the event day (by day); expiry on or after start.
    const start = dayOf(t?.startDate);
    const expiry = dayOf(t?.expiryDate);
    if (eventDay && start && start > eventDay) errs.dates = "Start date can't be after the event day";
    else if (eventDay && expiry && expiry > eventDay) errs.dates = "Expiry date can't be after the event day";
    else if (start && expiry && expiry < start) errs.dates = 'Expiry must be on or after the start';
    return errs;
  };

  // Show the per-row (Done) error first, else the global Next/Submit error, else the live price check.
  const ticketNameError = (index) => ticketRowErrors[index]?.name || errors?.[`ticketName_${index}`]?.[0];
  const ticketPriceError = (index) =>
    ticketRowErrors[index]?.price || errors?.[`ticketPrice_${index}`]?.[0] || priceErrors[index];
  const ticketDateError = (index) => ticketRowErrors[index]?.dates || errors?.[`ticketDate_${index}`]?.[0];
  const ticketBundleError = (index) => ticketRowErrors[index]?.bundle || errors?.[`ticketBundle_${index}`]?.[0];

  // Never collapse a blank or invalid row, so its error is always reachable before Next.
  const isTicketOpen = (t, index) =>
    editingTicket === index ||
    isEmptyTicket(t) ||
    !!ticketRowErrors[index] ||
    !!errors?.[`ticketName_${index}`] ||
    !!errors?.[`ticketPrice_${index}`] ||
    !!errors?.[`ticketDate_${index}`] ||
    !!errors?.[`ticketBundle_${index}`] ||
    !!priceErrors[index];

  const clearTicketRowError = (index, field) => {
    setTicketRowErrors((prev) => {
      if (!prev[index]?.[field]) return prev;
      const nextRow = { ...prev[index] };
      delete nextRow[field];
      const next = { ...prev };
      if (Object.keys(nextRow).length) next[index] = nextRow;
      else delete next[index];
      return next;
    });
  };

  const handleAddTicket = () => {
    const newIndex = (formData.ticketTypes || []).length;
    dispatch(addTicketType());
    setEditingTicket(newIndex); // open the new row
    if (errors?.ticketTypes) {
      const next = { ...errors };
      delete next.ticketTypes;
      dispatch(setFormErrors(next));
    }
  };

  const handleRemoveTicket = (index) => {
    dispatch(removeTicketType(index));
    // Indices shift on remove; reset local row state to avoid mismatches.
    setEditingTicket(null);
    setTicketRowErrors({});
    setPriceErrors({});
  };

  const handleDoneTicket = (index) => {
    const t = (formData.ticketTypes || [])[index];
    if (isEmptyTicket(t)) {
      if ((formData.ticketTypes || []).length > 1) dispatch(removeTicketType(index));
      setEditingTicket(null);
      return;
    }
    const errs = validateTicket(t);
    if (Object.keys(errs).length > 0) {
      setTicketRowErrors((prev) => ({ ...prev, [index]: errs }));
      setEditingTicket(index); // keep open to show errors
      return;
    }
    setTicketRowErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setEditingTicket(null); // valid -> collapse
  };

  // Cancel = simple close: discard a blank new row, else just collapse (keeps typed values;
  // the Next/Submit safety net still catches an invalid row).
  const handleCancelTicket = (index) => {
    const t = (formData.ticketTypes || [])[index];
    if (isEmptyTicket(t) && (formData.ticketTypes || []).length > 1) {
      dispatch(removeTicketType(index));
    }
    setTicketRowErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setPriceErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setEditingTicket(null);
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-medium text-sm mb-4 text-slate-700">
        Tickets Configuration <span className="text-red-600">*</span>
      </h3>

      {(formData.ticketTypes || []).length > 0 && (
        <div className="space-y-3 mb-4">
          {(formData.ticketTypes || []).map((ticket, index) => {
            // Collapsed summary row: Name · $Price + edit/delete icons.
            if (!isTicketOpen(ticket, index)) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg"
                >
                  <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {ticket.name}
                    <span className="font-normal text-slate-500"> · ${Number(ticket.price).toFixed(2)}{isBundle(ticket) ? ` · admits ${ticket.bundleSize}` : ''}</span>
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDeleteTicket === index ? (
                      <span className="flex items-center gap-2 text-xs text-slate-600">
                        Delete?
                        <button
                          type="button"
                          onClick={() => { handleRemoveTicket(index); setConfirmDeleteTicket(null); }}
                          className="font-medium text-red-600 hover:text-red-700"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTicket(null)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingTicket(index)}
                          aria-label="Edit ticket type"
                          className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {(formData.ticketTypes || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTicket(index)}
                            aria-label="Delete ticket type"
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Expanded editor.
            return (
              <div key={index} className="border border-slate-200 rounded-lg p-3">
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Ticket {index + 1}{ticket?.name ? `: ${ticket.name}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Ticket Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={ticket?.name || ''}
                      onChange={(e) => {
                        setEditingTicket(index); // claim this row so it stays open while typing
                        dispatch(updateTicketType({ index, field: 'name', value: e.target.value }));
                        if (errors?.[`ticketName_${index}`]) {
                          const newErrors = { ...errors };
                          delete newErrors[`ticketName_${index}`];
                          dispatch(setFormErrors(newErrors));
                        }
                        clearTicketRowError(index, 'name');
                      }}
                      placeholder="Early Bird"
                      className={getInputClasses(!!ticketNameError(index))}
                      maxLength="100"
                    />
                    {ticketNameError(index) && (
                      <p className="text-red-600 text-xs mt-1">{ticketNameError(index)}</p>
                    )}
                  </div>

                  {/* Ticket Price (whole-bundle price when this type is a bundle) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {isBundle(ticket) ? 'Bundle price' : 'Price'} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={ticket.price === undefined || ticket.price === null ? '' : ticket.price}
                      onChange={(e) => {
                        setEditingTicket(index); // claim this row so it stays open while typing
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
                        clearTicketRowError(index, 'price');
                      }}
                      onWheel={(e) => e.target.blur()}
                      className={getInputClasses(!!ticketPriceError(index))}
                      placeholder="0.00"
                    />
                    {ticketPriceError(index) && (
                      <p className="text-red-600 text-xs mt-1">{ticketPriceError(index)}</p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Start Date <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="date"
                      value={ticket.startDate ? (ticket.startDate.includes('T') ? ticket.startDate.slice(0, 10) : ticket.startDate) : ''}
                      onChange={(e) => { setEditingTicket(index); dispatch(updateTicketType({ index, field: 'startDate', value: e.target.value || null })); }}
                      onWheel={(e) => e.target.blur()}
                      max={eventDay || undefined}
                      className={getInputClasses(!!ticketDateError(index))}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expiry Date <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="date"
                      value={ticket.expiryDate ? (ticket.expiryDate.includes('T') ? ticket.expiryDate.slice(0, 10) : ticket.expiryDate) : ''}
                      onChange={(e) => { setEditingTicket(index); dispatch(updateTicketType({ index, field: 'expiryDate', value: e.target.value || null })); }}
                      onWheel={(e) => e.target.blur()}
                      min={dayOf(ticket.startDate) || undefined}
                      max={eventDay || undefined}
                      className={getInputClasses(!!ticketDateError(index))}
                    />
                  </div>
                </div>
                {ticketDateError(index) && (
                  <p className="text-red-600 text-xs mt-1">{ticketDateError(index)}</p>
                )}

                {/* Optional display-only note shown to buyers while choosing (e.g. "Includes dinner"). */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Note <span className="font-normal text-slate-400">(optional, shown to buyers)</span>
                  </label>
                  <input
                    type="text"
                    value={ticket.note || ''}
                    onChange={(e) => { setEditingTicket(index); dispatch(updateTicketType({ index, field: 'note', value: e.target.value })); }}
                    placeholder="e.g. Includes dinner, 18+ only"
                    maxLength="120"
                    className={getInputClasses(false)}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{(ticket.note || '').length}/120</p>
                </div>

                {/* Bundle: one price admits several people. When on, the Price field above is the
                    whole-bundle price and must divide evenly by the bundle size. */}
                <div className="mt-3">
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={isBundle(ticket)}
                      onChange={(e) => {
                        setEditingTicket(index);
                        dispatch(updateTicketType({ index, field: 'bundleSize', value: e.target.checked ? 2 : '' }));
                        clearTicketRowError(index, 'bundle');
                      }}
                      className="h-4 w-4 rounded border-slate-300 accent-teal-700 focus:ring-teal-300"
                    />
                    <span className="text-xs font-medium text-slate-700">Sell as a bundle (one price admits several people)</span>
                  </label>
                  {isBundle(ticket) && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Bundle size (people per purchase) <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="2"
                        step="1"
                        value={ticket.bundleSize === '' || ticket.bundleSize === null || ticket.bundleSize === undefined ? '' : ticket.bundleSize}
                        onChange={(e) => { setEditingTicket(index); dispatch(updateTicketType({ index, field: 'bundleSize', value: e.target.value })); clearTicketRowError(index, 'bundle'); }}
                        onWheel={(e) => e.target.blur()}
                        placeholder="4"
                        className={getInputClasses(!!ticketBundleError(index))}
                      />
                      <p className="text-xs text-slate-400 mt-1">The Price above is the total for the whole bundle (e.g. size 4 at $72 admits 4 for $18 each).</p>
                      {ticketBundleError(index) && (
                        <p className="text-red-600 text-xs mt-1">{ticketBundleError(index)}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => handleCancelTicket(index)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDoneTicket(index)}
                    className="text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errors?.ticketTypes && (
        <p className="text-red-600 text-xs mb-2">
          {Array.isArray(errors.ticketTypes) ? errors.ticketTypes[0] : errors.ticketTypes}
        </p>
      )}

      <button
        type="button"
        onClick={handleAddTicket}
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
  // Accordion: which code is expanded (null = none) + per-row errors captured on Done + delete confirm.
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showDiscountInfo, setShowDiscountInfo] = useState(false);
  const [discountRowErrors, setDiscountRowErrors] = useState({});
  const [confirmDeleteDiscount, setConfirmDeleteDiscount] = useState(null);

  const getInputClasses = (hasError) => {
    const base = 'w-full px-3 py-2.5 text-sm text-slate-700 bg-white [color-scheme:light] placeholder:text-slate-400 hover:border-slate-400 border rounded-lg focus:outline-none focus:ring-2 focus:border-teal-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed';
    return `${base} ${hasError ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
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
  const eventDay = dayOf(formData.dateTime);

  // Show the per-row (Done) error first, else the global Next/Submit error.
  const ERR_KEY = { code: 'discountCode', value: 'discountValue', applies: 'discountApplies', dates: 'discountDates', uses: 'discountUses' };
  const discountFieldError = (index, field) =>
    discountRowErrors[index]?.[field] || errors?.[`${ERR_KEY[field]}_${index}`]?.[0];
  const hasGlobalDiscountError = (index) =>
    Object.values(ERR_KEY).some((k) => errors?.[`${k}_${index}`]);

  const clearDiscountRowError = (index, field) => {
    setDiscountRowErrors((prev) => {
      if (!prev[index]?.[field]) return prev;
      const nextRow = { ...prev[index] };
      delete nextRow[field];
      const next = { ...prev };
      if (Object.keys(nextRow).length) next[index] = nextRow;
      else delete next[index];
      return next;
    });
  };

  const isEmptyDiscount = (dc) =>
    !(dc?.code || '').trim() &&
    (dc?.value === null || dc?.value === undefined || dc?.value === '') &&
    (dc?.maxUses === null || dc?.maxUses === undefined) &&
    !dc?.validFrom && !dc?.validUntil &&
    (dc?.appliesToTicketTypes || []).length === 0;

  // Per-row validation mirrors validateDiscountCodesList in StepManager, so a row can't collapse invalid.
  const validateDiscount = (dc, index) => {
    const errs = {};
    const code = (dc.code || '').trim().toUpperCase();
    if (!code) errs.code = 'Discount code is required';
    else if (code.length < 3 || code.length > 20) errs.code = 'Code must be 3-20 characters';
    else if (codes.some((o, i) => i !== index && (o.code || '').trim().toUpperCase() === code)) {
      errs.code = 'Duplicate code — each code must be unique';
    }
    const val = Number(dc.value);
    if (dc.value === null || dc.value === undefined || dc.value === '' || isNaN(val)) {
      errs.value = 'Discount value is required';
    } else if (dc.kind === 'percent') {
      if (!Number.isInteger(val) || val < 1 || val > 90) errs.value = 'Percent must be a whole number from 1 to 90';
    } else if (val <= 0) {
      errs.value = 'Amount must be greater than 0';
    } else if (Math.abs(val * 100 - Math.round(val * 100)) > 1e-9) {
      errs.value = 'Amount can have at most 2 decimal places';
    }
    const ticketNames = new Set(namedTicketTypes.map((t) => t.name));
    const applies = (dc.appliesToTicketTypes || []).filter((n) => ticketNames.has(n));
    if (dc.active !== false && applies.length === 0) {
      errs.applies = 'Pick at least one ticket type this code applies to';
    }
    const vFrom = dayOf(dc.validFrom);
    const vUntil = dayOf(dc.validUntil);
    if (eventDay && vFrom && vFrom > eventDay) errs.dates = "Valid from can't be after the event day";
    else if (eventDay && vUntil && vUntil > eventDay) errs.dates = "Valid until can't be after the event day";
    else if (vFrom && vUntil && vFrom > vUntil) errs.dates = '"Valid from" must be on or before "valid until"';
    const used = dc.usedCount || 0;
    if (dc.maxUses != null) {
      if (!Number.isInteger(dc.maxUses) || dc.maxUses < 1) errs.uses = 'Max uses must be a whole number (1 or more)';
      else if (dc.maxUses < used) errs.uses = `${used} already used — max uses cannot be below ${used}`;
    }
    if (applies.length > 0 && !isNaN(val)) {
      const coveredPrices = (formData.ticketTypes || [])
        .filter((t) => applies.includes(t.name) && t.price !== null && t.price !== undefined && t.price !== '')
        .map((t) => Number(t.price)).filter((p) => !isNaN(p));
      if (coveredPrices.length > 0) {
        const cheapest = Math.min(...coveredPrices);
        const after = dc.kind === 'percent' ? cheapest * (1 - val / 100) : cheapest - val;
        if (Math.round(after * 100) < 100) errs.value = 'This makes a ticket cost under $1. Lower the discount or uncheck that ticket type.';
      }
    }
    return errs;
  };

  // Never collapse a blank or invalid row, so its error is always reachable before Next.
  const isDiscountOpen = (dc, index) =>
    editingDiscount === index || isEmptyDiscount(dc) || !!discountRowErrors[index] || hasGlobalDiscountError(index);

  const handleAddDiscount = () => {
    const newIndex = codes.length;
    dispatch(addDiscountCode());
    setEditingDiscount(newIndex); // open the new row
  };

  const handleRemoveDiscount = (index) => {
    dispatch(removeDiscountCode(index));
    setEditingDiscount(null);
    setDiscountRowErrors({});
  };

  const handleDoneDiscount = (index) => {
    const dc = codes[index];
    if (isEmptyDiscount(dc)) {
      dispatch(removeDiscountCode(index)); // discard a blank row
      setEditingDiscount(null);
      return;
    }
    const errs = validateDiscount(dc, index);
    if (Object.keys(errs).length > 0) {
      setDiscountRowErrors((prev) => ({ ...prev, [index]: errs }));
      setEditingDiscount(index); // keep open to show errors
      return;
    }
    setDiscountRowErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setEditingDiscount(null); // valid -> collapse
  };

  const handleCancelDiscount = (index) => {
    const dc = codes[index];
    if (isEmptyDiscount(dc)) {
      dispatch(removeDiscountCode(index)); // nothing entered — discard
    } else {
      // Active code left without a ticket type would be invalid — keep it but deactivate it
      // (an inactive code is valid without a ticket) rather than leave an invalid active code.
      const ticketNames = new Set(namedTicketTypes.map((t) => t.name));
      const hasTicket = (dc.appliesToTicketTypes || []).some((n) => ticketNames.has(n));
      if (dc.active !== false && !hasTicket) {
        dispatch(updateDiscountCode({ index, field: 'active', value: false }));
      }
    }
    setDiscountRowErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setEditingDiscount(null);
  };

  const toggleApplies = (index, name, checked) => {
    setEditingDiscount(index);
    const current = codes[index]?.appliesToTicketTypes || [];
    const updated = checked ? [...new Set([...current, name])] : current.filter((nm) => nm !== name);
    dispatch(updateDiscountCode({ index, field: 'appliesToTicketTypes', value: updated }));
    // Linkage: selecting a ticket on an inactive code auto-activates it (organiser intent);
    // unticking the last ticket auto-deactivates it (an active code can't have no ticket).
    if (checked && codes[index]?.active === false) {
      dispatch(updateDiscountCode({ index, field: 'active', value: true }));
    } else if (!checked && updated.length === 0 && codes[index]?.active !== false) {
      dispatch(updateDiscountCode({ index, field: 'active', value: false }));
    }
    clearError(`discountApplies_${index}`);
    clearDiscountRowError(index, 'applies');
  };

  const fmtDiscountValue = (dc) => (dc.kind === 'fixed' ? `$${Number(dc.value).toFixed(2)}` : `${dc.value}%`);

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-medium text-sm text-slate-700">
          Discount Codes
        </h3>
        <button
          type="button"
          onClick={() => setShowDiscountInfo(true)}
          aria-label="How discount codes work"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="How discount codes work"
        >
          <FaInfoCircle className="text-lg" />
        </button>
      </div>

      {codes.length > 0 && (
        <div className="space-y-3 mb-4">
          {codes.map((dc, index) => {
            // Edit-mode locks: a saved code's word is immutable; once it's been used, kind/value/
            // valid-from also lock and it can't be deleted (deactivate instead). See feature doc.
            const dcUsed = (dc.usedCount || 0) > 0;
            const lockWord = dc.existing === true;     // saved code → word immutable
            const lockUsed = lockWord && dcUsed;       // used → kind/value/valid-from locked, no delete
            // Collapsed summary row: CODE · value (+ Inactive) + edit/delete icons.
            if (!isDiscountOpen(dc, index)) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg"
                >
                  <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {dc.code}
                    <span className="font-normal text-slate-500"> · {fmtDiscountValue(dc)}</span>
                    {(dc.appliesToTicketTypes || []).length > 0 && (
                      <span className="font-normal text-slate-500"> · {(dc.appliesToTicketTypes || []).join(', ')}</span>
                    )}
                    {dc.active === false && <span className="font-normal text-slate-400"> · Inactive</span>}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDeleteDiscount === index ? (
                      <span className="flex items-center gap-2 text-xs text-slate-600">
                        Delete?
                        <button
                          type="button"
                          onClick={() => { handleRemoveDiscount(index); setConfirmDeleteDiscount(null); }}
                          className="font-medium text-red-600 hover:text-red-700"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDiscount(null)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingDiscount(index)}
                          aria-label="Edit discount code"
                          className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDiscount(index)}
                          disabled={lockUsed}
                          aria-label="Delete discount code"
                          title={lockUsed ? "This code has been used — switch it off instead of deleting" : undefined}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // Expanded editor.
            return (
              <div key={index} className="border border-slate-200 rounded-lg p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    Code {index + 1}{dc?.code ? `: ${dc.code}` : ''}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`text-xs ${dc?.active !== false ? 'text-teal-700 font-medium' : 'text-slate-400'}`}>
                      {dc?.active !== false ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dc?.active !== false}
                      disabled={namedTicketTypes.length === 0 && dc?.active === false}
                      title={namedTicketTypes.length === 0 ? 'Add a named ticket type first' : undefined}
                      onClick={() => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'active', value: !(dc?.active !== false) })); clearDiscountRowError(index, 'applies'); }}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${dc?.active !== false ? 'bg-teal-700' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dc?.active !== false ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                    </button>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Code */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Code <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      value={dc?.code || ''}
                      onChange={(e) => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'code', value: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })); clearError(`discountCode_${index}`); clearDiscountRowError(index, 'code'); }}
                      placeholder="e.g. 10OFF"
                      maxLength="20"
                      disabled={lockWord}
                      title={lockWord ? "A saved code can't be renamed — delete it (if unused) or switch it off and make a new one" : undefined}
                      className={getInputClasses(!!discountFieldError(index, 'code'))}
                    />
                    {discountFieldError(index, 'code') && (
                      <p className="text-red-600 text-xs mt-1">{discountFieldError(index, 'code')}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {lockWord ? "A saved code can't be renamed." : 'Max 20 characters, letters and numbers only.'}
                    </p>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Type <span className="text-red-600">*</span></label>
                    <select
                      value={dc?.kind || 'percent'}
                      onChange={(e) => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'kind', value: e.target.value })); clearDiscountRowError(index, 'value'); }}
                      disabled={lockUsed}
                      title={lockUsed ? "Locked — this code has been used" : undefined}
                      className={getInputClasses(false)}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed amount ($)</option>
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {dc?.kind === 'fixed' ? 'Amount ($)' : 'Percent (1–90)'} <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={dc?.kind === 'fixed' ? '0.01' : '1'}
                      max={dc?.kind === 'fixed' ? undefined : '90'}
                      step={dc?.kind === 'fixed' ? '0.01' : '1'}
                      value={dc.value === null || dc.value === undefined ? '' : dc.value}
                      onChange={(e) => { setEditingDiscount(index); const v = e.target.value; dispatch(updateDiscountCode({ index, field: 'value', value: v === '' ? null : Number(v) })); clearError(`discountValue_${index}`); clearDiscountRowError(index, 'value'); }}
                      onWheel={(e) => e.target.blur()}
                      disabled={lockUsed}
                      title={lockUsed ? "Locked — this code has been used" : undefined}
                      className={getInputClasses(!!discountFieldError(index, 'value'))}
                      placeholder={dc?.kind === 'fixed' ? '5.00' : '10'}
                    />
                    {discountFieldError(index, 'value') && <p className="text-red-600 text-xs mt-1">{discountFieldError(index, 'value')}</p>}
                  </div>

                  {/* Max uses */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Max uses <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={dc.maxUses === null || dc.maxUses === undefined ? '' : dc.maxUses}
                      onChange={(e) => { setEditingDiscount(index); const v = e.target.value; dispatch(updateDiscountCode({ index, field: 'maxUses', value: v === '' ? null : Number(v) })); clearError(`discountUses_${index}`); clearDiscountRowError(index, 'uses'); }}
                      onWheel={(e) => e.target.blur()}
                      className={getInputClasses(!!discountFieldError(index, 'uses'))}
                      placeholder="Unlimited"
                    />
                    {discountFieldError(index, 'uses') && <p className="text-red-600 text-xs mt-1">{discountFieldError(index, 'uses')}</p>}
                  </div>

                  {/* Valid from */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Valid from <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="date"
                      value={dc.validFrom ? (dc.validFrom.includes('T') ? dc.validFrom.slice(0, 10) : dc.validFrom) : ''}
                      onChange={(e) => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'validFrom', value: e.target.value || null })); clearError(`discountDates_${index}`); clearDiscountRowError(index, 'dates'); }}
                      max={eventDay || undefined}
                      disabled={lockUsed}
                      title={lockUsed ? "Locked — this code has been used" : undefined}
                      className={getInputClasses(!!discountFieldError(index, 'dates'))}
                    />
                  </div>

                  {/* Valid until */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Valid until <span className="font-normal text-slate-400">(optional)</span></label>
                    <input
                      type="date"
                      value={dc.validUntil ? (dc.validUntil.includes('T') ? dc.validUntil.slice(0, 10) : dc.validUntil) : ''}
                      onChange={(e) => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'validUntil', value: e.target.value || null })); clearError(`discountDates_${index}`); clearDiscountRowError(index, 'dates'); }}
                      min={dayOf(dc.validFrom) || undefined}
                      max={eventDay || undefined}
                      className={getInputClasses(!!discountFieldError(index, 'dates'))}
                    />
                  </div>
                </div>

                {discountFieldError(index, 'dates') && <p className="text-red-600 text-xs mt-1">{discountFieldError(index, 'dates')}</p>}

                {/* Applies to (ticket-type NAMES, explicit) */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Select ticket types to discount <span className="text-red-600">*</span>
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
                            className="w-4 h-4 accent-teal-700 border-slate-300 rounded focus:ring-teal-300"
                          />
                          <span className="text-sm text-slate-700">{t.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {discountFieldError(index, 'applies') && <p className="text-red-600 text-xs mt-1">{discountFieldError(index, 'applies')}</p>}
                </div>

                {/* Advertise at ticket selection — yes/no toggle (only meaningful when the code is active) */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dc?.showHint === true && dc?.active !== false}
                    disabled={dc?.active === false}
                    title={dc?.active === false ? 'Activate the code to advertise it' : undefined}
                    onClick={() => { setEditingDiscount(index); dispatch(updateDiscountCode({ index, field: 'showHint', value: !(dc?.showHint === true) })); }}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(dc?.showHint === true && dc?.active !== false) ? 'bg-teal-700' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${(dc?.showHint === true && dc?.active !== false) ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-sm ${dc?.active === false ? 'text-slate-400' : 'text-slate-700'}`}>
                    {dc?.code ? `Advertise "${dc.code}" at ticket selection` : 'Advertise this code at ticket selection'}
                    {dc?.active === false ? ' (activate first)' : ''}
                  </span>
                </div>

                <div className="mt-3 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => handleCancelDiscount(index)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDoneDiscount(index)}
                    className="text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddDiscount}
        className="inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Discount Code
      </button>

      {/* How discount codes work — info popup */}
      {showDiscountInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50" onClick={() => setShowDiscountInfo(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">How discount codes work</h3>
              <button
                type="button"
                onClick={() => setShowDiscountInfo(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                <li>Buyers type the code at checkout. Codes are 3–20 letters/numbers, shown in capitals.</li>
                <li>A code only works when <strong>Active</strong> — and an active code must apply to at least one ticket type (ticking a ticket activates it automatically).</li>
                <li>The discount is a percentage (1–90%) or a fixed $ amount, and can't bring a ticket under $1.</li>
                <li><strong>Advertise at ticket selection</strong>: on = the code is shown publicly on the tickets page; off = secret (buyers must know it).</li>
                <li>Once a code has been used, you can't change its name, type, value or start date, and can't delete it — switch it <strong>off</strong> to stop it.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// GST Configuration
const GSTConfiguration = ({ formData, dispatch }) => {
  const on = formData.gstIncluded || false;
  // Preview uses the cheapest entered ticket price, else a $100 example.
  const prices = (formData.ticketTypes || [])
    .map((t) => Number(t.price))
    .filter((p) => !isNaN(p) && p > 0);
  const sampleLabel = `$${(prices.length ? Math.min(...prices) : 100).toFixed(2)}`;

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-medium text-sm mb-3 text-slate-700">GST</h3>

      <div className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => dispatch(updateGstIncluded(!on))}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-300 ${on ? 'bg-teal-700' : 'bg-slate-200'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">Ticket prices include GST</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Turn on if your ticket prices already include 10% GST.
          </p>

          {/* Live preview of the checkout total line */}
          <div className="mt-3 max-w-xs">
            <p className="text-xs text-slate-500 mb-1">At checkout, the total reads:</p>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-700">{on ? 'Total (incl. GST)' : 'Total'}</span>
              <span className="font-medium text-slate-900">{sampleLabel}</span>
            </div>
          </div>
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

            {/* GST Configuration (Paid Only) - sits with ticket pricing, before discounts */}
            {isPaidEvent && (
              <GSTConfiguration
                formData={formData}
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
