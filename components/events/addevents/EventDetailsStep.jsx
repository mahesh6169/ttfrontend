// components/events/addevents/EventDetailsStep.jsx
// Step 2: Event Details - Category, Description, Organizer Info, Coordinators

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  addCoordinator,
  updateCoordinator,
  removeCoordinator,
  updateOrganizerField,
  addOrganizerSocialMedia,
  updateOrganizerSocialMedia,
  removeOrganizerSocialMedia,
  setFormErrors,
} from '@/store/slices/events/eventSlice';
import { isValidAuMobile, isHttpsUrl, isValidEmail as isValidEmailHelper } from '@/utils/events/wizardValidation';

const SOCIAL_PLATFORMS = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'X', label: 'X (Twitter)' },
];

// Simple category-style dropdown for the social platform (no search — only a few options).
const PlatformDropdown = ({ value, options, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const selectedLabel = value
    ? (SOCIAL_PLATFORMS.find((p) => p.value === value)?.label || value)
    : 'Select platform';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-left flex items-center justify-between transition-colors ${
          open ? 'border-teal-400 ring-2 ring-teal-300' : 'border-slate-300'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'text-slate-700'}`}
      >
        <span className={`truncate pr-2 ${value ? '' : 'text-slate-400'}`}>{selectedLabel}</span>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {options.length > 0 ? (
            options.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => { onChange(p.value); setOpen(false); }}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-teal-50 transition-colors ${
                  value === p.value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2.5 text-sm text-slate-400">No platforms left</div>
          )}
        </div>
      )}
    </div>
  );
};

const EventDetailsStep = ({
  formData,
  errors = {},
  mode = 'add',
  readOnly = false
}) => {
  const dispatch = useDispatch();
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const disabled = readOnly || isViewMode;

  // Coordinator accordion: which row is expanded for editing (null = none), plus the
  // per-row errors captured on "Done" (separate from the global Next/Submit errors).
  const [editingCoordinator, setEditingCoordinator] = useState(null);
  const [coordinatorRowErrors, setCoordinatorRowErrors] = useState({});
  // Which coordinator row is awaiting delete confirmation (null = none).
  const [confirmDeleteCoordinator, setConfirmDeleteCoordinator] = useState(null);

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  const isPaidEvent = formData.isPaid || false;

  // Organizer handlers
  const handleOrganizerChange = (field, value) => {
    if (disabled) return;
    dispatch(updateOrganizerField({ field, value }));
    // Clear the organiser error once the user edits the name (re-checked on next Next/Submit).
    if (errors?.organizer) {
      const next = { ...errors };
      delete next.organizer;
      dispatch(setFormErrors(next));
    }
  };

  const handleAddSocialMedia = () => {
    if (disabled) return;
    dispatch(addOrganizerSocialMedia());
  };

  const handleUpdateSocialMedia = (index, field, value) => {
    if (disabled) return;
    dispatch(updateOrganizerSocialMedia({ index, field, value }));
  };

  const handleRemoveSocialMedia = (index) => {
    if (disabled) return;
    dispatch(removeOrganizerSocialMedia(index));
  };

  // Coordinator handlers
  const handleAddCoordinator = () => {
    if (disabled) return;
    if ((formData.coordinators || []).length < 10) {
      const newIndex = (formData.coordinators || []).length;
      dispatch(addCoordinator());
      setEditingCoordinator(newIndex); // open the new row for editing
    }
  };

  const handleUpdateCoordinator = (index, field, value) => {
    if (disabled) return;
    setEditingCoordinator(index); // claim this row so it stays open while typing (don't auto-collapse)
    dispatch(updateCoordinator({ index, field, value }));
    // Clear this coordinator's error(s) on edit (re-checked on next Next/Submit). Match the
    // "Coordinator N:" prefix with the colon so "Coordinator 1" doesn't also clear "Coordinator 10".
    if (Array.isArray(errors?.coordinators)) {
      const remaining = errors.coordinators.filter(
        (msg) => !msg.includes(`Coordinator ${index + 1}:`)
      );
      const next = { ...errors };
      if (remaining.length) next.coordinators = remaining;
      else delete next.coordinators;
      dispatch(setFormErrors(next));
    }
    // Also clear the per-row (Done) error for this field as the user edits.
    setCoordinatorRowErrors((prev) => {
      if (!prev[index]?.[field]) return prev;
      const nextRow = { ...prev[index] };
      delete nextRow[field];
      const next = { ...prev };
      if (Object.keys(nextRow).length) next[index] = nextRow;
      else delete next[index];
      return next;
    });
  };

  const handleRemoveCoordinator = (index) => {
    if (disabled) return;
    // Coordinators are optional - allow removing down to zero.
    dispatch(removeCoordinator(index));
    // Indices shift on remove; reset the open row + row errors to avoid mismatches.
    setEditingCoordinator(null);
    setCoordinatorRowErrors({});
  };

  // Validation helpers. Phone must be a valid AU mobile (D6); email is checked only when filled.
  const isValidPhone = (phone) => isValidAuMobile(phone);
  const isValidEmail = (email) => isValidEmailHelper(email);

  const getFieldError = (index, field) => {
    if (!errors?.coordinators) return null;
    const coordinatorErrors = Array.isArray(errors.coordinators) ? errors.coordinators : [];
    // Match by "Coordinator N:" (with colon, so 1 doesn't match 10) + the field keyword,
    // then strip the routing prefix so the user sees just "Name is required" / "Phone is required".
    const match = coordinatorErrors.find(
      (err) => err.includes(`Coordinator ${index + 1}:`) && err.toLowerCase().includes(field.toLowerCase())
    );
    return match ? match.replace(/^Coordinator \d+:\s*/, '') : null;
  };

  // Field styling helper
  const getFieldClasses = (hasError = false) => {
    const baseClasses = 'w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2';
    const errorClasses = hasError ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300 focus:border-teal-400';
    const readOnlyClasses = disabled ? 'bg-slate-100 cursor-not-allowed text-slate-600' : '';
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  // --- Coordinator accordion helpers ---
  const isEmptyCoordinator = (c) =>
    !c?.name?.trim() && !c?.phone?.trim() && !c?.email?.trim() && !c?.role?.trim();

  // Same rule as the step validator, so a row can't collapse while invalid.
  // Returns { name?, phone?, email? } messages; empty object = valid.
  const validateCoordinator = (c) => {
    const errs = {};
    const hasName = !!c?.name?.trim();
    const hasOther = !!(c?.phone?.trim() || c?.email?.trim() || c?.role?.trim());
    if (hasName && !c?.phone?.trim()) errs.phone = 'Phone is required';
    else if (c?.phone?.trim() && !isValidPhone(c.phone)) errs.phone = 'Enter a valid Australian mobile (starts 04)';
    if (!hasName && hasOther) errs.name = 'Name is required';
    if (c?.email?.trim() && !isValidEmail(c.email)) errs.email = 'Email is invalid';
    return errs;
  };

  const hasGlobalCoordinatorError = (index) =>
    Array.isArray(errors?.coordinators) &&
    errors.coordinators.some((m) => m.includes(`Coordinator ${index + 1}:`));

  // A row is open (editor shown) when it's being edited, still blank, or has any error —
  // never collapse a blank or invalid row (so its error is always reachable before Next).
  const isCoordinatorOpen = (c, index) =>
    editingCoordinator === index ||
    isEmptyCoordinator(c) ||
    !!coordinatorRowErrors[index] ||
    hasGlobalCoordinatorError(index);

  // Show the per-row (Done) error if present, else the global Next/Submit error.
  const coordinatorFieldError = (index, field) =>
    coordinatorRowErrors[index]?.[field] || getFieldError(index, field);

  const handleDoneCoordinator = (index) => {
    const c = (formData.coordinators || [])[index];
    if (isEmptyCoordinator(c)) {
      dispatch(removeCoordinator(index)); // discard a blank row (coordinators are optional)
      setEditingCoordinator(null);
      return;
    }
    const errs = validateCoordinator(c);
    if (Object.keys(errs).length > 0) {
      setCoordinatorRowErrors((prev) => ({ ...prev, [index]: errs }));
      setEditingCoordinator(index); // keep open to show the errors
      return;
    }
    setCoordinatorRowErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setEditingCoordinator(null); // valid -> collapse to summary
  };

  // Cancel = simple close: discard a blank new row, else just collapse (keeps typed values;
  // the Next/Submit safety net still catches an invalid row).
  const handleCancelCoordinator = (index) => {
    const c = (formData.coordinators || [])[index];
    if (isEmptyCoordinator(c)) {
      dispatch(removeCoordinator(index));
    }
    setCoordinatorRowErrors((prev) => { const next = { ...prev }; delete next[index]; return next; });
    setEditingCoordinator(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Organiser Details Section */}
      <div>
        <h3 className="font-medium text-base mb-3 sm:mb-4 text-slate-600">
          Organiser Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Organiser / Organisation Name */}
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm">
              Organiser / Organisation <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.organizer?.name || ''}
              onChange={(e) => handleOrganizerChange('name', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(!!errors?.organizer)}
              placeholder="Your name or organisation name"
              maxLength="100"
            />
            {errors?.organizer && (
              <p className="text-red-600 text-xs mt-1">
                {Array.isArray(errors.organizer) ? errors.organizer[0] : errors.organizer}
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm">
              Contact Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              value={formData.organizer?.contact || ''}
              onChange={(e) => handleOrganizerChange('contact', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(!!errors?.organizerContact)}
              placeholder="+61 4XX XXX XXX"
              maxLength="20"
            />
            {errors?.organizerContact && (
              <p className="text-red-600 text-xs mt-1">
                {Array.isArray(errors.organizerContact) ? errors.organizerContact[0] : errors.organizerContact}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.organizer?.email || ''}
              onChange={(e) => handleOrganizerChange('email', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(false)}
              placeholder="contact@example.com"
              maxLength="100"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm">
              Website
            </label>
            <input
              type="url"
              value={formData.organizer?.website || ''}
              onChange={(e) => handleOrganizerChange('website', e.target.value)}
              disabled={disabled}
              className={getFieldClasses(!!errors?.organizerWebsite)}
              placeholder="https://yourwebsite.com"
              maxLength="200"
            />
            {errors?.organizerWebsite && (
              <p className="text-red-600 text-xs mt-1">
                {Array.isArray(errors.organizerWebsite) ? errors.organizerWebsite[0] : errors.organizerWebsite}
              </p>
            )}
          </div>

          {/* ABN - Only for paid events */}
          {isPaidEvent && (
            <div className="sm:col-span-2">
              <label className="block font-medium mb-2 text-slate-600 text-sm">
                ABN (Australian Business Number)
              </label>
              <input
                type="text"
                value={formData.organizer?.abn || ''}
                onChange={(e) => handleOrganizerChange('abn', e.target.value)}
                disabled={disabled}
                className={`${getFieldClasses(false)} sm:max-w-xs`}
                placeholder="XX XXX XXX XXX"
                maxLength="14"
              />
              <p className="text-xs text-slate-500 mt-1">
                For invoice purposes. Format: 11 digits
              </p>
            </div>
          )}
        </div>

        {/* Social Media — compact single-row repeater (design-system.md section 6): one row per link
            (platform + URL + trash), with "+ Add Social Link" in the section's title row. */}
        <div className="mt-6 pt-6 border-t border-slate-200" data-testid="social-links">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Social Media Links
            </label>
            {!disabled && (formData.organizer?.socialMedia?.length || 0) < 3 && (
              <button
                type="button"
                onClick={handleAddSocialMedia}
                className="inline-flex items-center gap-1 text-sm text-teal-700 hover:text-teal-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Social Link
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 mb-3">Add up to 3 social media links</p>

          {formData.organizer?.socialMedia && formData.organizer.socialMedia.length > 0 ? (
            <div className="space-y-2">
              {formData.organizer.socialMedia.map((social, index) => {
                // Get available platforms (exclude already selected ones)
                const selectedPlatforms = (formData.organizer.socialMedia || [])
                  .map((s, i) => i !== index ? s.platform : null)
                  .filter(Boolean);
                const availablePlatforms = SOCIAL_PLATFORMS.filter(p => !selectedPlatforms.includes(p.value));

                return (
                  <div key={index} data-testid="social-link-row" className="flex items-center gap-2">
                    <div className="w-32 sm:w-40 shrink-0">
                      <PlatformDropdown
                        value={social.platform}
                        options={availablePlatforms}
                        onChange={(v) => handleUpdateSocialMedia(index, 'platform', v)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="url"
                        value={social.url || ''}
                        onChange={(e) => handleUpdateSocialMedia(index, 'url', e.target.value)}
                        disabled={disabled}
                        className={getFieldClasses(!!errors?.[`socialUrl_${index}`])}
                        placeholder={social.platform ? `https://${social.platform.toLowerCase()}.com/...` : 'https://...'}
                        maxLength="200"
                      />
                      {errors?.[`socialUrl_${index}`] && (
                        <p className="text-red-600 text-xs mt-1">
                          {Array.isArray(errors[`socialUrl_${index}`]) ? errors[`socialUrl_${index}`][0] : errors[`socialUrl_${index}`]}
                        </p>
                      )}
                    </div>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialMedia(index)}
                        className="p-2 text-slate-500 hover:text-red-600 rounded-lg transition-colors shrink-0"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Event Coordinators Section */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <h3 className="font-medium text-base mb-1 text-slate-600">
          Event Coordinators
          <span className="text-sm font-normal text-slate-500 ml-2">(optional)</span>
        </h3>
        <p className="text-slate-500 text-sm mb-4">
          Add coordinators who will help manage this event.
        </p>

        {/* Coordinators List */}
        <div className="space-y-4">
          {(formData.coordinators || []).map((coordinator, index) => {
            // Collapsed summary row: Name · Role + edit/delete icons.
            if (!isCoordinatorOpen(coordinator, index)) {
              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-3 border border-slate-200 rounded-lg"
                >
                  <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                    {coordinator.name}
                    {coordinator.role && (
                      <span className="font-normal text-slate-500"> · {coordinator.role}</span>
                    )}
                  </p>
                  {!disabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDeleteCoordinator === index ? (
                        <span className="flex items-center gap-2 text-xs text-slate-600">
                          Delete?
                          <button
                            type="button"
                            onClick={() => { handleRemoveCoordinator(index); setConfirmDeleteCoordinator(null); }}
                            className="font-medium text-red-600 hover:text-red-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCoordinator(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingCoordinator(index)}
                            aria-label="Edit coordinator"
                            className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCoordinator(index)}
                            aria-label="Delete coordinator"
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Expanded editor.
            return (
              <div
                key={index}
                className="p-4 border border-slate-200 rounded-lg"
              >
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-600">
                    Coordinator {index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <label className="block font-medium mb-2 text-slate-600 text-sm">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={coordinator?.name || ''}
                      onChange={(e) => handleUpdateCoordinator(index, 'name', e.target.value)}
                      disabled={disabled}
                      className={getFieldClasses(!!coordinatorFieldError(index, 'name'))}
                      placeholder="Full name"
                      maxLength="100"
                    />
                    {coordinatorFieldError(index, 'name') && (
                      <p className="text-red-600 text-xs mt-1">{coordinatorFieldError(index, 'name')}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-medium mb-2 text-slate-600 text-sm">
                      Phone {coordinator?.name?.trim() && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={coordinator?.phone || ''}
                      onChange={(e) => handleUpdateCoordinator(index, 'phone', e.target.value)}
                      disabled={disabled}
                      className={getFieldClasses(!!coordinatorFieldError(index, 'phone') || (coordinator?.phone && !isValidPhone(coordinator.phone)))}
                      placeholder="+61 4XX XXX XXX"
                      maxLength="20"
                    />
                    {coordinatorFieldError(index, 'phone') ? (
                      <p className="text-red-600 text-xs mt-1">{coordinatorFieldError(index, 'phone')}</p>
                    ) : (coordinator?.phone && !isValidPhone(coordinator.phone)) ? (
                      <p className="text-red-600 text-xs mt-1">Enter a valid phone number</p>
                    ) : null}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block font-medium mb-2 text-slate-600 text-sm">
                      Role
                    </label>
                    <input
                      type="text"
                      value={coordinator?.role || ''}
                      onChange={(e) => handleUpdateCoordinator(index, 'role', e.target.value)}
                      disabled={disabled}
                      className={getFieldClasses(false)}
                      placeholder="e.g., Event Manager"
                      maxLength="100"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-medium mb-2 text-slate-600 text-sm">
                      Email
                    </label>
                    <input
                      type="email"
                      value={coordinator?.email || ''}
                      onChange={(e) => handleUpdateCoordinator(index, 'email', e.target.value)}
                      disabled={disabled}
                      className={getFieldClasses(!!coordinatorFieldError(index, 'email') || (coordinator?.email && !isValidEmail(coordinator.email)))}
                      placeholder="email@example.com"
                      maxLength="100"
                    />
                    {coordinatorFieldError(index, 'email') ? (
                      <p className="text-red-600 text-xs mt-1">{coordinatorFieldError(index, 'email')}</p>
                    ) : (coordinator?.email && !isValidEmail(coordinator.email)) ? (
                      <p className="text-red-600 text-xs mt-1">Email is invalid</p>
                    ) : null}
                  </div>
                </div>

                {!disabled && (
                  <div className="mt-3 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => handleCancelCoordinator(index)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDoneCoordinator(index)}
                      className="text-sm font-medium text-teal-700 hover:text-teal-800"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section-level coordinator error box removed —
            inline errors render under each specific field; the toast on submit
            already summarises all errors at the top of the screen. */}

        {/* Add Coordinator Button */}
        {!disabled && (formData.coordinators || []).length < 10 && (
          <button
            type="button"
            onClick={handleAddCoordinator}
            className="mt-4 inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Coordinator
            <span className="ml-1 text-slate-500">({(formData.coordinators || []).length}/10)</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default EventDetailsStep;
