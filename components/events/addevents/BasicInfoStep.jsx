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

// Intent Selection Component
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

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">What would you like to do? <span className="text-red-500">*</span></h3>
        <p className="text-sm text-gray-500 mt-1">Choose how you want to list your event</p>
      </div>

      {/* Host Option - Primary/Prominent */}
      <button
        type="button"
        onClick={() => handleIntentSelect('host')}
        disabled={disabled || isEditMode}
        className={`relative w-full p-5 sm:p-6 border-2 rounded-xl text-left transition-all duration-200 ${
          currentIntent === 'host'
            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
            : 'border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50/50 hover:shadow-md'
        } ${(disabled || isEditMode) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {currentIntent === 'host' && (
          <div className="absolute top-3 right-3">
            <svg className="w-6 h-6 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Host an Event</h4>
            <p className="text-sm text-gray-600 mb-3">
              Manage registrations or sell tickets on our platform. Get check-in tools, attendee management, and more.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                Registration
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                Check-in
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                Ticketing
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Promote Option - Secondary/Subtle */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-500">or just want visibility?</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleIntentSelect('promote')}
        disabled={disabled || isEditMode}
        className={`relative w-full p-3 sm:p-4 border rounded-lg text-left transition-all duration-200 ${
          currentIntent === 'promote'
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50'
        } ${(disabled || isEditMode) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {currentIntent === 'promote' && (
          <div className="absolute top-2 right-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Promote an Event</h4>
            <p className="text-xs text-gray-500">List for visibility only. Registrations handled elsewhere.</p>
          </div>
        </div>
      </button>

      {errors?.eventIntent && (
        <p className="text-red-500 text-sm mt-2">
          {Array.isArray(errors.eventIntent) ? errors.eventIntent[0] : errors.eventIntent}
        </p>
      )}

      {/* Free/Paid Toggle - Only shown when "Host" is selected */}
      {currentIntent === 'host' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Will attendees pay for tickets? <span className="text-red-500">*</span></h4>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handlePaidToggle(false)}
              disabled={disabled || isEditMode}
              className={`flex-1 p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                !isPaid
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-300'
              } ${(disabled || isEditMode) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-8 h-8 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${!isPaid ? 'text-green-700' : 'text-gray-700'}`}>
                Free Event
              </span>
              <p className="text-xs text-gray-500 mt-0.5">Free registration</p>
            </button>

            <button
              type="button"
              onClick={() => handlePaidToggle(true)}
              disabled={disabled || isEditMode}
              className={`flex-1 p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                isPaid
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              } ${(disabled || isEditMode) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${isPaid ? 'text-blue-700' : 'text-gray-700'}`}>
                Paid Event
              </span>
              <p className="text-xs text-gray-500 mt-0.5">Sell tickets</p>
            </button>
          </div>
        </div>
      )}

      {isEditMode && (
        <p className="text-amber-600 text-xs italic mt-2">
          Event type cannot be changed after creation.
        </p>
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
    const baseClasses = 'w-full px-3 py-2.5 sm:py-2 border rounded-lg transition-colors text-sm';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300';
    const readOnlyClasses = disabled
      ? 'bg-gray-100 cursor-not-allowed text-gray-600'
      : 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500 active:border-teal-500';

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
        setEndDateError('Free recurring events are limited to 6 months. Date has been adjusted to the maximum allowed.');
        dispatch(setRecurrenceEndDate(maxDate.toISOString().split('T')[0]));
        setTimeout(() => setEndDateError(''), 5000);
        return;
      }
    }

    setEndDateError('');
    dispatch(setRecurrenceEndDate(e.target.value || null));
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-0">
      {/* Step Header */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Basic Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us the essential details about your event
        </p>
      </div>

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
          {/* Divider */}
          <div className="border-t border-gray-200 pt-4"></div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block font-semibold text-sm">
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
              <p className="text-red-500 text-xs sm:text-sm">
                {Array.isArray(errors.title) ? errors.title[0] : errors.title}
              </p>
            )}
          </div>

          {/* Time Zone */}
          <div className="space-y-2">
        <label className="block font-semibold text-sm">
          Event Time Zone <span className="text-red-500">*</span>
        </label>
        {disabled || (isEditMode && isRecurringEvent) ? (
          <input
            type="text"
            value={AU_TIMEZONES.find(tz => tz.value === formData.timeZone)?.label || 'No timezone selected'}
            disabled={true}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
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
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.timeZone) ? errors.timeZone[0] : errors.timeZone}
          </p>
        )}
        {isEditMode && isRecurringEvent && (
          <p className="text-amber-600 text-xs sm:text-sm mt-1 italic">
            Not editable for recurring events.
          </p>
        )}
      </div>

      {/* Date & Time */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm">
          Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="dateTime"
          value={formatDateTimeLocal(formData.dateTime)}
          onChange={handleChange}
          min={getMinDate()}
          disabled={disabled || (isEditMode && isRecurringEvent)}
          onWheel={(e) => e.target.blur()}
          className={getFieldClasses('dateTime')}
        />
        {errors?.dateTime && (
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.dateTime) ? errors.dateTime[0] : errors.dateTime}
          </p>
        )}
        {isEditMode && isRecurringEvent && (
          <p className="text-amber-600 text-xs sm:text-sm mt-1 italic">
            Not editable for recurring events.
          </p>
        )}
      </div>

      {/* Recurring Event Section - Only show for hosted free events */}
      {canShowRecurring && (
        <div className="border rounded-xl p-4 bg-gray-50">
          <div className="flex items-start space-x-3 mb-3">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.recurrence?.isRecurring || false}
              onChange={handleRecurringToggle}
              disabled={disabled || isEditMode}
              className="w-5 h-5 mt-0.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <label htmlFor="isRecurring" className={`block text-sm font-medium ${isEditMode ? 'text-gray-500' : 'text-gray-900'}`}>
                Make this a recurring event
              </label>
              {isEditMode && !formData.recurrence?.isRecurring && (
                <p className="text-xs text-gray-500 mt-1">
                  Event type cannot be changed after creation
                </p>
              )}
              {isEditMode && formData.recurrence?.isRecurring && (
                <p className="text-xs text-amber-600 mt-1">
                  Recurring event type cannot be changed
                </p>
              )}
            </div>
          </div>

          {formData.recurrence?.isRecurring && (
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                {isViewMode
                  ? 'This event repeats on the following schedule:'
                  : 'Set up when this event repeats. The main event date above will be the first occurrence.'
                }
              </p>

              {/* Repeat Schedule */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Repeat Schedule
                </label>
                {isEditMode && isRecurringEvent && (
                  <p className="text-xs text-amber-600 italic">
                    Not editable — recreate event to update.
                  </p>
                )}

                {(formData.recurrence?.repeatSchedule || []).map((schedule, index) => (
                  <div key={index} className="bg-white rounded-lg border p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                        <div className="relative">
                          <select
                            value={schedule?.day || 'Mon'}
                            onChange={(e) => handleUpdateRepeatSchedule(index, 'day', e.target.value)}
                            disabled={disabled || (isEditMode && isRecurringEvent)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm appearance-none bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                          >
                            <option value="Mon">Monday</option>
                            <option value="Tue">Tuesday</option>
                            <option value="Wed">Wednesday</option>
                            <option value="Thu">Thursday</option>
                            <option value="Fri">Friday</option>
                            <option value="Sat">Saturday</option>
                            <option value="Sun">Sunday</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          value={schedule?.time || '18:00'}
                          onChange={(e) => handleUpdateRepeatSchedule(index, 'time', e.target.value)}
                          disabled={disabled || (isEditMode && isRecurringEvent)}
                          onWheel={(e) => e.target.blur()}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                        />
                      </div>
                    </div>

                    {!disabled && !(isEditMode && isRecurringEvent) && (formData.recurrence?.repeatSchedule || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRepeatSchedule(index)}
                        className="flex items-center justify-center w-full sm:w-auto px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Remove Schedule
                      </button>
                    )}
                  </div>
                ))}

                {!disabled && !(isEditMode && isRecurringEvent) && (
                  <button
                    type="button"
                    onClick={handleAddRepeatSchedule}
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-teal-600 font-medium hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Another Day/Time
                  </button>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  End Date <span className="text-red-500">*</span>
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
                  <p className="text-amber-600 text-xs sm:text-sm animate-pulse">
                    {endDateError}
                  </p>
                )}
                {errors?.recurrenceEndDate && (
                  <p className="text-red-500 text-xs sm:text-sm">
                    {Array.isArray(errors.recurrenceEndDate) ? errors.recurrenceEndDate[0] : errors.recurrenceEndDate}
                  </p>
                )}
                {isEditMode && isRecurringEvent && (
                  <p className="text-amber-600 text-xs sm:text-sm italic">
                    Not editable — recreate event to update.
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Maximum 6 months from start date.
                </p>
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

      {/* Venue */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm">
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
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.venue) ? errors.venue[0] : errors.venue}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
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
