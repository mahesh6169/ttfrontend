// components/events/addevents/EventDetailsStep.jsx - Mobile Optimized

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  updateField, 
  setAddress,
  toggleRecurring,
  addRepeatSchedule,
  updateRepeatSchedule,
  removeRepeatSchedule,
  setRecurrenceEndDate,
  setImages 
} from '@/store/slices/events/eventSlice';
import AddressInput from '@/components/events/addevents/AddressInput';
import ImageUploader from '@/components/events/addevents/ImageUploader';
import { CATEGORY_OPTIONS } from '@/components/events/addevents/EventCategories';
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import CategorySelector from '@/components/shared/CategorySelector';
import TimezoneSelector from '@/components/shared/TimezoneSelector';
import CommunitySelector from '@/components/shared/CommunitySelector';

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

const EventDetailsStep = ({ 
  formData, 
  errors = {}, 
  onImagesChange, 
  mode = 'add', // 'add' | 'edit' | 'view'
  readOnly = false 
}) => {
  const dispatch = useDispatch();
  const [endDateError, setEndDateError] = useState('');
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isAddMode = mode === 'add';
  const disabled = readOnly || isViewMode;

  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: 'Event Details',
      subtitle: 'Tell us about your event',
      submitText: 'Create Event'
    },
    edit: {
      title: 'Edit Event Details',
      subtitle: 'Update your event information',
      submitText: 'Update Event'
    },
    view: {
      title: 'Event Details',
      subtitle: 'Event information',
      submitText: 'View Only'
    }
  };

  const config = modeConfig[mode] || modeConfig.add;

  const handleChange = (e) => {
    if (disabled) return;
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  const handleAddressChange = (address) => {
    if (disabled) return;
    console.log("Address being set in Redux:", address);
    dispatch(setAddress(address));
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
    
    // Validate 6-month limit (we're already in free events section)
    if (formData.dateTime && e.target.value) {
      const startDate = new Date(formData.dateTime);
      const selectedDate = new Date(e.target.value);
      const maxDate = new Date(startDate);
      maxDate.setMonth(maxDate.getMonth() + 6);
      
      if (selectedDate > maxDate) {
        // Set error message and use max date
        setEndDateError('Free recurring events are limited to 6 months. Date has been adjusted to the maximum allowed.');
        dispatch(setRecurrenceEndDate(maxDate.toISOString().split('T')[0]));
        
        // Clear error after 5 seconds
        setTimeout(() => setEndDateError(''), 5000);
        return;
      }
    }
    
    // Clear any existing error
    setEndDateError('');
    dispatch(setRecurrenceEndDate(e.target.value || null));
  };

  // Enhanced format with proper timezone handling for edit mode
  const formatDateTimeLocal = (dateTime) => {
    if (!dateTime) return '';
    
    try {
      if (typeof dateTime === 'string' && dateTime.includes('Z')) {
        const eventTimeZone = formData.timeZone || 'Australia/Sydney';
        const zonedDate = utcToZonedTime(dateTime, eventTimeZone);
        return format(zonedDate, 'yyyy-MM-dd\'T\'HH:mm');
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

  const getUTCPreview = () => {
    if (!formData.dateTime || !formData.timeZone) return '';
    
    try {
      let dateToConvert = formData.dateTime;
      
      if (typeof dateToConvert === 'string' && dateToConvert.includes('Z')) {
        const eventTimeZone = formData.timeZone || 'Australia/Sydney';
        const zonedDate = utcToZonedTime(dateToConvert, eventTimeZone);
        dateToConvert = format(zonedDate, 'yyyy-MM-dd\'T\'HH:mm');
      }
      
      const utcDate = zonedTimeToUtc(dateToConvert, formData.timeZone);
      return utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    } catch (error) {
      return '';
    }
  };

  // Enhanced mobile-first field styling with proper touch targets
  const getFieldClasses = (fieldName) => {
    const baseClasses = 'w-full px-3 py-3 sm:py-2 border rounded-lg transition-colors text-base sm:text-sm';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300';
    const readOnlyClasses = disabled 
      ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
      : 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500 active:border-teal-500';
    
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  // Mobile-optimized select styling
  const getSelectClasses = (fieldName) => {
    const baseClasses = 'w-full px-3 py-3 sm:py-2 border rounded-lg transition-colors text-base sm:text-sm appearance-none bg-white';
    const errorClasses = errors?.[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300';
    const readOnlyClasses = disabled 
      ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
      : 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500';
    
    return `${baseClasses} ${errorClasses} ${readOnlyClasses}`;
  };

  // Mode-specific help text
  const getHelpText = (field) => {
    const helpTexts = {
      title: {
        add: 'Choose a clear, descriptive title that tells people what your event is about',
        edit: 'Update the event title if needed',
        view: 'Event title as it appears to attendees'
      },
      dateTime: {
        add: 'When will your event take place?',
        edit: 'You can update the event date and time',
        view: 'Scheduled date and time for this event'
      },
      venue: {
        add: 'Where will your event be held? Include the venue name',
        edit: 'Update the venue information if it has changed',
        view: 'Event venue location'
      },
      description: {
        add: 'Provide detailed information about what attendees can expect',
        edit: 'Update the event description with any new information',
        view: 'Event description and details'
      }
    };
    
    return helpTexts[field]?.[mode] || helpTexts[field]?.add || '';
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-0">
      {/* Mobile-optimized header with better spacing */}
      <div className="border-b border-gray-200 pb-3 sm:pb-4">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 flex flex-col sm:flex-row sm:items-center">
          <span>{config.title}</span>
          <div className="flex gap-2 mt-1 sm:mt-0 sm:ml-2">
            {isEditMode && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Editing
              </span>
            )}
            {isViewMode && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Only
              </span>
            )}
          </div>
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">{config.subtitle}</p>
      </div>
      
      {/* Title - Enhanced for mobile */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Event Title <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            This will update how your event appears to attendees
          </p>
        )}
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
        <p className="text-xs text-gray-500">
          {getHelpText('title')}
        </p>
      </div>

      {/* Category - Enhanced dropdown for mobile */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Category <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            Helps people find your event
          </p>
        )}
        {disabled ? (
          <input
            type="text"
            value={formData.category || 'No category selected'}
            disabled={true}
            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        ) : (
          <CategorySelector
            value={formData.category || ''}
            onChange={(value) => handleChange({ target: { name: 'category', value } })}
            categories={CATEGORY_OPTIONS}
            placeholder="Select a category"
            required={true}
          />
        )}
        {errors?.category && (
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.category) ? errors.category[0] : errors.category}
          </p>
        )}
        {!disabled && (
          <p className="text-xs text-gray-500">
            Choose the category that best describes your event
          </p>
        )}
      </div>

      {/* Community/Language Selection */}
      {!disabled && (
        <div className="space-y-2">
          <CommunitySelector
            value={formData.communities || []}
            onChange={(value) => handleChange({ target: { name: 'communities', value } })}
            label="Community/Language (Optional)"
            showHint={true}
          />
        </div>
      )}

      {/* Time Zone - Mobile optimized */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Event Time Zone <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            Changing this will affect how times are displayed
          </p>
        )}
        {disabled ? (
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
        <p className="text-xs text-gray-500">
          {isViewMode 
            ? 'Time zone for this event'
            : 'Select the timezone where your event will take place'
          }
        </p>
      </div>

      {/* Date & Time - Enhanced mobile experience */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Date & Time <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            Attendees will be notified of any changes
          </p>
        )}
        <input
          type="datetime-local"
          name="dateTime"
          value={formatDateTimeLocal(formData.dateTime)}
          onChange={handleChange}
          min={getMinDate()}
          disabled={disabled}
          className={getFieldClasses('dateTime')}
        />
        {errors?.dateTime && (
          <p className="text-red-500 text-xs sm:text-sm">
            {Array.isArray(errors.dateTime) ? errors.dateTime[0] : errors.dateTime}
          </p>
        )}
        <div className="text-xs text-gray-500 space-y-1">
          <p>{getHelpText('dateTime')}</p>
        </div>
      </div>

      {/* Recurring Event Section - Mobile optimized collapsible - Only show for free events */}
      {!formData.isPaid && (
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
                ⚠️ Changes to recurring settings will affect all future instances
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
            
            {/* Repeat Schedule - Mobile-friendly layout */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Repeat Schedule
              </label>
              {isEditMode && (
                <p className="text-xs text-gray-500">
                  Existing attendees will see updated schedule
                </p>
              )}
              
              {(formData.recurrence?.repeatSchedule || []).map((schedule, index) => (
                <div key={index} className="bg-white rounded-lg border p-3 space-y-3">
                  {/* Mobile-first: Stack day and time vertically on small screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                      <div className="relative">
                        <select
                          value={schedule?.day || 'Mon'}
                          onChange={(e) => handleUpdateRepeatSchedule(index, 'day', e.target.value)}
                          disabled={disabled}
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
                        disabled={disabled}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
                      />
                    </div>
                  </div>
                  
                  {!disabled && (formData.recurrence?.repeatSchedule || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRepeatSchedule(index)}
                      className="flex items-center justify-center w-full sm:w-auto px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                      title="Remove this schedule"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Remove Schedule
                    </button>
                  )}
                </div>
              ))}
              
              {!disabled && (
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
              {isEditMode && (
                <p className="text-xs text-gray-500">
                  When to stop creating new instances
                </p>
              )}
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
                disabled={disabled}
                className={getFieldClasses('recurrenceEndDate')}
                required={formData.recurrence?.isRecurring}
              />
              {endDateError && (
                <p className="text-amber-600 text-xs sm:text-sm animate-pulse">
                  ⚠️ {endDateError}
                </p>
              )}
              {errors?.recurrenceEndDate && (
                <p className="text-red-500 text-xs sm:text-sm">
                  {Array.isArray(errors.recurrenceEndDate) ? errors.recurrenceEndDate[0] : errors.recurrenceEndDate}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {isViewMode 
                  ? (formData.recurrence?.endDate 
                      ? 'This recurring series ends on the specified date'
                      : 'This recurring series has no end date'
                    )
                  : 'Required. Maximum 6 months from start date.'
                }
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

      {/* Venue - Enhanced for mobile */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Venue <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            Venue changes will be communicated to attendees
          </p>
        )}
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
        <p className="text-xs text-gray-500">
          {getHelpText('venue')}
        </p>
      </div>

      {/* Address - Mobile optimized */}
      <div className="space-y-2">
        <AddressInput 
          formData={formData} 
          setFormData={(newDataOrUpdater) => {
            if (disabled) return;
            
            console.log("setFormData called with:", newDataOrUpdater);
            if (typeof newDataOrUpdater === 'function') {
              const dummyPrev = { address: formData.address || {} };
              const result = newDataOrUpdater(dummyPrev);
              handleAddressChange(result.address);
            } 
            else if (newDataOrUpdater && newDataOrUpdater.address) {
              handleAddressChange(newDataOrUpdater.address);
            }
          }}
          errors={errors?.address}
          placeholder={disabled ? 'Event address' : 'Enter event address'}
          disabled={disabled}
          mode={mode}
        />        
      </div>

      {/* Description - Enhanced textarea for mobile */}
      <div className="space-y-2">
        <label className="block font-semibold text-sm sm:text-base">
          Description <span className="text-red-500">*</span>
        </label>
        {isEditMode && (
          <p className="text-xs sm:text-sm text-gray-500">
            Updates will be visible to all attendees
          </p>
        )}
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          disabled={disabled}
          className={`${getFieldClasses('description')} resize-none`}
          rows="4"
          placeholder={disabled ? '' : 'Describe your event - what attendees can expect, agenda, special requirements, etc.'}
          maxLength="2000"
        />
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {errors?.description ? (
              <p className="text-red-500 text-xs sm:text-sm">
                {Array.isArray(errors.description) ? errors.description[0] : errors.description}
              </p>
            ) : (
              <p className="text-gray-500 text-xs">
                {getHelpText('description')}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {(formData.description || '').length}/2000
          </span>
        </div>
      </div>
      
      {/* Image Upload - Mobile optimized */}
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
        {isEditMode && !disabled && (
          <p className="text-xs text-amber-600">
            💡 Image changes will update how your event appears in listings and to attendees
          </p>
        )}
      </div>


    </div>
  );
};

export default EventDetailsStep;