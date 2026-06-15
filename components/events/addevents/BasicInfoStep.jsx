// components/events/addevents/BasicInfoStep.jsx
// Step 1: Intent Selection + Basic event information - Title, Date/Time, Venue, Address, Images

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  updateField,
  setAddress,
  setImages,
  setEventIntent,
  toggleIsPaid,
  toggleRecurring,
  addRepeatSchedule,
  updateRepeatSchedule,
  removeRepeatSchedule,
  setRecurrenceEndDate,
} from '@/store/slices/events/eventSlice';
import AddressInput from '@/components/events/addevents/AddressInput';
import ImageUploader from '@/components/events/addevents/ImageUploader';
import TimezoneSelector from '@/components/shared/TimezoneSelector';
import DateTimePicker from '@/components/shared/DateTimePicker';
import CategorySelector from '@/components/events/CategorySelector';
import CommunitySelector from '@/components/shared/CommunitySelector';
import { needsCommunityField } from '@/components/events/addevents/EventCategories';
import { utcToZonedTime, format } from 'date-fns-tz';

const AU_TIMEZONES = [
  { label: 'Sydney (NSW)', value: 'Australia/Sydney', key: 'nsw' },
  { label: 'Melbourne (VIC)', value: 'Australia/Melbourne', key: 'vic' },
  { label: 'Brisbane (QLD)', value: 'Australia/Brisbane', key: 'qld' },
  { label: 'Perth (WA)', value: 'Australia/Perth', key: 'wa' },
  { label: 'Adelaide (SA)', value: 'Australia/Adelaide', key: 'sa' },
  { label: 'Hobart (TAS)', value: 'Australia/Hobart', key: 'tas' },
  { label: 'Darwin (NT)', value: 'Australia/Darwin', key: 'nt' },
  { label: 'Canberra (ACT)', value: 'Australia/Sydney', key: 'act' },
];

// Intent Selection Component - Clean toggle buttons
const IntentSelection = ({ formData, disabled, dispatch, errors, isEditMode }) => {
  const currentIntent = formData.eventIntent;
  const isPaid = formData.isPaid || false;

  const handleIntentSelect = (intent) => {
    if (disabled || isEditMode) return;
    dispatch(setEventIntent(intent));
  };

  const handlePaidToggle = (paid) => {
    if (disabled || isEditMode) return;
    dispatch(toggleIsPaid(paid));
  };

  const isLocked = disabled || isEditMode;

  return (
    <div className="space-y-4">
      {/* Event Type */}
      <div>
        <div className="flex items-baseline gap-4">
          <label className="font-semibold sm:font-bold text-slate-700 text-sm sm:text-base whitespace-nowrap">
            Event Type <span className="text-red-500">*</span>
            {isEditMode && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
          </label>

          <div className={`flex items-center ${isLocked ? 'opacity-60' : ''}`}>
            <button
              type="button"
              onClick={() => handleIntentSelect('host')}
              disabled={isLocked}
              className={`pb-1 text-sm sm:text-base border-b-2 transition-colors ${
                currentIntent === 'host'
                  ? 'text-teal-700 font-semibold border-teal-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              } ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
              Host
            </button>
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-slate-300"></span>
            <button
              type="button"
              onClick={() => handleIntentSelect('promote')}
              disabled={isLocked}
              className={`pb-1 text-sm sm:text-base border-b-2 transition-colors ${
                currentIntent === 'promote'
                  ? 'text-teal-700 font-semibold border-teal-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              } ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
              Promote
            </button>
          </div>
        </div>
        {errors?.eventIntent && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {Array.isArray(errors.eventIntent) ? errors.eventIntent[0] : errors.eventIntent}
          </p>
        )}
      </div>

      {/* Free/Paid Toggle - Only shown when "Host" is selected */}
      {currentIntent === 'host' && (
        <div className="flex items-baseline gap-4">
          <label className="font-semibold sm:font-bold text-slate-700 text-sm sm:text-base whitespace-nowrap">
            Ticket Type <span className="text-red-500">*</span>
            {isEditMode && <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
          </label>

          <div className={`flex items-center ${isLocked ? 'opacity-60' : ''}`}>
            <button
              type="button"
              onClick={() => handlePaidToggle(false)}
              disabled={isLocked}
              className={`pb-1 text-sm sm:text-base border-b-2 transition-colors ${
                !isPaid
                  ? 'text-teal-700 font-semibold border-teal-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              } ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
              RSVP
            </button>
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-slate-300"></span>
            <button
              type="button"
              onClick={() => handlePaidToggle(true)}
              disabled={isLocked}
              className={`pb-1 text-sm sm:text-base border-b-2 transition-colors ${
                isPaid
                  ? 'text-teal-700 font-semibold border-teal-700'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              } ${isLocked ? 'cursor-not-allowed' : ''}`}
            >
              Paid
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const BasicInfoStep = ({
  formData,
  errors = {},
  onImagesChange,
  mode = 'add',
  readOnly = false
}) => {
  const dispatch = useDispatch();
  const [endDateError, setEndDateError] = useState('');
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const disabled = readOnly || isViewMode;

  // Check if this is a recurring event (affects timezone/datetime editability)
  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  // Check if recurring is allowed (only for host + free events)
  const isPromotionalEvent = formData.eventIntent === 'promote';
  const isPaidEvent = formData.isPaid || false;
  const canShowRecurring = formData.eventIntent === 'host' && !isPaidEvent;

  const handleChange = (e) => {
    if (disabled) return;
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  const handleAddressChange = (address) => {
    if (disabled) return;
    dispatch(setAddress(address));
  };

  // Format datetime for input field
  const formatDateTimeLocal = (dateTime) => {
    if (!dateTime) return '';

    try {
      if (typeof dateTime === 'string' && dateTime.includes('Z')) {
        const eventTimeZone = formData.timeZone || 'Australia/Sydney';
        const zonedDate = utcToZonedTime(dateTime, eventTimeZone);
        return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
      }

      if (typeof dateTime === 'string' && dateTime.includes('T') && !dateTime.includes('Z')) {
        return dateTime.slice(0, 16);
      }

      const date = new Date(dateTime);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getMinDate = () => {
    if (isViewMode || isEditMode) return '';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Field styling helper
  const getFieldClasses = (fieldName) => {
    const baseClasses = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300';
    const readOnlyClasses = disabled
      ? 'bg-slate-100 cursor-not-allowed text-slate-600'
      : '';

    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  // Recurring event handlers
  const handleRecurringToggle = (e) => {
    if (disabled) return;
    dispatch(toggleRecurring(e.target.checked));
  };

  const handleAddRepeatSchedule = () => {
    if (disabled) return;
    dispatch(addRepeatSchedule());
  };

  const handleUpdateRepeatSchedule = (index, field, value) => {
    if (disabled) return;
    dispatch(updateRepeatSchedule({ index, field, value }));
  };

  const handleRemoveRepeatSchedule = (index) => {
    if (disabled) return;
    dispatch(removeRepeatSchedule(index));
  };

  const handleRecurrenceEndDateChange = (e) => {
    if (disabled) return;

    // Validate 6-month limit for free recurring events
    if (formData.dateTime && e.target.value) {
      const startDate = new Date(formData.dateTime);
      const selectedDate = new Date(e.target.value);
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 6);

      if (selectedDate > maxDate) {
        setEndDateError('RSVP recurring events are limited to 6 months. Date has been adjusted to the maximum allowed.');
        dispatch(setRecurrenceEndDate(maxDate.toISOString().split('T')[0]));
        setTimeout(() => setEndDateError(''), 5000);
        return;
      }
    }

    setEndDateError('');
    dispatch(setRecurrenceEndDate(e.target.value || null));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intent Selection - First thing users choose */}
      <IntentSelection
        formData={formData}
        disabled={disabled}
        dispatch={dispatch}
        errors={errors}
        isEditMode={isEditMode}
      />

      {/* Rest of fields only shown after intent is selected */}
      {formData.eventIntent && (
        <>
          {/* Title */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              disabled={disabled}
              className={getFieldClasses('title')}
              placeholder={disabled ? '' : 'Enter event title'}
              maxLength="200"
            />
            {errors?.title && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Category <span className="text-red-500">*</span>
            </label>
            {disabled ? (
              <input
                type="text"
                value={formData.category || 'No category selected'}
                disabled={true}
                className={getFieldClasses('category')}
              />
            ) : (
              <CategorySelector
                value={formData.category || ''}
                onChange={(value) => {
                  handleChange({ target: { name: 'category', value } });
                  if (!needsCommunityField(value)) {
                    handleChange({ target: { name: 'communities', value: [] } });
                  }
                }}
                placeholder="Select a category"
                required={true}
              />
            )}
            {errors?.category && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">
                {Array.isArray(errors.category) ? errors.category[0] : errors.category}
              </p>
            )}
          </div>

          {/* Community/Language Selection - Only for eligible categories */}
          {!disabled && needsCommunityField(formData.category) && (
            <div className="space-y-2">
              <CommunitySelector
                value={formData.communities || []}
                onChange={(value) => handleChange({ target: { name: 'communities', value } })}
                label="Community/Language (Optional)"
                showHint={true}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={disabled}
              className={`${getFieldClasses('description')} min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y`}
              rows="6"
              placeholder={disabled ? '' : 'Describe your event - what attendees can expect, agenda, special requirements, etc.'}
              maxLength="15000"
            />
            <div className="flex justify-between items-start gap-2 mt-1">
              <div className="flex-1">
                {errors?.description && (
                  <p className="text-red-500 text-xs sm:text-sm">
                    {Array.isArray(errors.description) ? errors.description[0] : errors.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {(formData.description || '').length}/15000
              </span>
            </div>
          </div>

          {/* Timezone + DateTime - Side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Zone */}
            <div>
              <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                Timezone <span className="text-red-500">*</span>
                {isEditMode && isRecurringEvent && <span className="text-xs font-normal text-slate-500 ml-2">(Locked)</span>}
              </label>
              {disabled || (isEditMode && isRecurringEvent) ? (
                <input
                  type="text"
                  value={AU_TIMEZONES.find(tz => tz.value === formData.timeZone)?.label || 'No timezone selected'}
                  disabled={true}
                  className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              ) : (
                <TimezoneSelector
                  value={formData.timeZone || ''}
                  onChange={(value) => handleChange({ target: { name: 'timeZone', value } })}
                  timezones={AU_TIMEZONES}
                  placeholder="Select timezone"
                  required={true}
                />
              )}
              {errors?.timeZone && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  {Array.isArray(errors.timeZone) ? errors.timeZone[0] : errors.timeZone}
                </p>
              )}
            </div>

            {/* Date & Time */}
            <div>
              <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
                Date & Time <span className="text-red-500">*</span>
                {isEditMode && isRecurringEvent && <span className="text-xs font-normal text-slate-500 ml-2">(Locked)</span>}
              </label>
              <DateTimePicker
                value={formatDateTimeLocal(formData.dateTime)}
                onChange={handleChange}
                min={getMinDate()}
                disabled={disabled || (isEditMode && isRecurringEvent)}
                error={!!errors?.dateTime}
              />
              {errors?.dateTime && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">
                  {Array.isArray(errors.dateTime) ? errors.dateTime[0] : errors.dateTime}
                </p>
              )}
            </div>
          </div>

      {/* Recurring Event Section - Only show for hosted free events */}
      {canShowRecurring && (
        <div>
          <label className="cursor-pointer">
            <span className="block font-semibold sm:font-bold text-slate-700 text-sm sm:text-base">
              Recurring Event
              {isEditMode && <span className="text-xs font-normal text-slate-500 ml-2">(Cannot be changed)</span>}
            </span>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Set up a repeating schedule for this event (Optional)
            </p>
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.recurrence?.isRecurring || false}
              onChange={handleRecurringToggle}
              disabled={disabled || isEditMode}
              className="w-5 h-5 text-teal-700 rounded focus:ring-teal-500 disabled:opacity-50"
            />
          </label>

          {formData.recurrence?.isRecurring && (
            <div className="space-y-4 mt-4 pt-4 border-t border-slate-200">
              {/* Repeat Schedule */}
              <div className="space-y-3">
                <label className="block font-medium text-slate-600 text-sm">
                  Repeat Schedule
                  {isEditMode && isRecurringEvent && <span className="text-xs font-normal text-slate-400 ml-2">(Locked)</span>}
                </label>

                {(formData.recurrence?.repeatSchedule || []).map((schedule, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Day</label>
                      <select
                        value={schedule?.day || 'Mon'}
                        onChange={(e) => handleUpdateRepeatSchedule(index, 'day', e.target.value)}
                        disabled={disabled || (isEditMode && isRecurringEvent)}
                        className={`w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="Mon">Monday</option>
                        <option value="Tue">Tuesday</option>
                        <option value="Wed">Wednesday</option>
                        <option value="Thu">Thursday</option>
                        <option value="Fri">Friday</option>
                        <option value="Sat">Saturday</option>
                        <option value="Sun">Sunday</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Time</label>
                      <input
                        type="time"
                        value={schedule?.time || '18:00'}
                        onChange={(e) => handleUpdateRepeatSchedule(index, 'time', e.target.value)}
                        disabled={disabled || (isEditMode && isRecurringEvent)}
                        onWheel={(e) => e.target.blur()}
                        className={`w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      />
                    </div>

                    {!disabled && !(isEditMode && isRecurringEvent) && (formData.recurrence?.repeatSchedule || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRepeatSchedule(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                {!disabled && !(isEditMode && isRecurringEvent) && (
                  <button
                    type="button"
                    onClick={handleAddRepeatSchedule}
                    className="text-sm text-teal-700 hover:text-teal-800 font-medium"
                  >
                    + Add Another Day/Time
                  </button>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block font-medium mb-2 text-slate-600 text-sm">
                  End Date <span className="text-red-500">*</span>
                  {isEditMode && isRecurringEvent && <span className="text-xs font-normal text-slate-400 ml-2">(Locked)</span>}
                </label>
                <input
                  type="date"
                  value={formData.recurrence?.endDate ? new Date(formData.recurrence.endDate).toISOString().split('T')[0] : ''}
                  onChange={handleRecurrenceEndDateChange}
                  min={formData.dateTime ? new Date(formData.dateTime).toISOString().split('T')[0] : ''}
                  max={(() => {
                    if (!formData.dateTime) return '';
                    const startDate = new Date(formData.dateTime);
                    const maxDate = new Date(startDate);
                    maxDate.setMonth(maxDate.getMonth() + 6);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  disabled={disabled || (isEditMode && isRecurringEvent)}
                  onWheel={(e) => e.target.blur()}
                  className={getFieldClasses('recurrenceEndDate')}
                  required={formData.recurrence?.isRecurring}
                />
                {endDateError && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{endDateError}</p>
                )}
                {errors?.recurrenceEndDate && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {Array.isArray(errors.recurrenceEndDate) ? errors.recurrenceEndDate[0] : errors.recurrenceEndDate}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">Maximum 6 months from start date</p>
              </div>

              {errors?.recurrence && (
                <div className="text-red-500 text-xs sm:text-sm space-y-1">
                  {Array.isArray(errors.recurrence)
                    ? errors.recurrence.map((err, i) => <p key={i}>• {err}</p>)
                    : <p>• {errors.recurrence}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Venue + Address - Side by side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Venue */}
        <div>
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Venue <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue || ''}
            onChange={handleChange}
            disabled={disabled}
            className={getFieldClasses('venue')}
            placeholder={disabled ? '' : 'Enter venue name'}
            maxLength="200"
          />
          {errors?.venue && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">
              {Array.isArray(errors.venue) ? errors.venue[0] : errors.venue}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <AddressInput
            formData={formData}
            setFormData={(newDataOrUpdater) => {
              if (disabled) return;

              if (typeof newDataOrUpdater === 'function') {
                const dummyPrev = { address: formData.address || {} };
                const result = newDataOrUpdater(dummyPrev);
                handleAddressChange(result.address);
              } else if (newDataOrUpdater && newDataOrUpdater.address) {
                handleAddressChange(newDataOrUpdater.address);
              }
            }}
            errors={errors?.address}
            placeholder={disabled ? 'Event address' : 'Enter event address'}
            disabled={disabled}
            mode={mode}
          />
        </div>
      </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <ImageUploader
              images={formData.images || []}
              onImagesChange={disabled ? () => {} : onImagesChange}
              maxImages={10}
              className="space-y-3"
              disabled={disabled}
              mode={mode}
            />
            {errors?.images && (
              <p className="text-red-500 text-xs sm:text-sm">
                {Array.isArray(errors.images) ? errors.images[0] : errors.images}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BasicInfoStep;
