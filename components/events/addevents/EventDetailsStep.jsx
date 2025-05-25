// components/events/addevents/EventDetailsStep.jsx

import React from 'react';
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
    dispatch(setRecurrenceEndDate(e.target.value || null));
  };


// Enhanced format with proper timezone handling for edit mode
  const formatDateTimeLocal = (dateTime) => {
    if (!dateTime) return '';
    
    try {
      // For editing existing events with UTC time from database
      if (typeof dateTime === 'string' && dateTime.includes('Z')) {
        // Convert UTC to event timezone for proper display in edit mode
        const eventTimeZone = formData.timeZone || 'Australia/Sydney';
        const zonedDate = utcToZonedTime(dateTime, eventTimeZone);
        return format(zonedDate, 'yyyy-MM-dd\'T\'HH:mm');
      }
      
      // If it's already in YYYY-MM-DDTHH:MM format (local input), return as-is
      if (typeof dateTime === 'string' && dateTime.includes('T') && !dateTime.includes('Z')) {
        return dateTime.slice(0, 16); // Keep only YYYY-MM-DDTHH:MM
      }
      
      // For any other format, try to format it without timezone conversion
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

  // Simple minimum date - just today in local browser time (only for add mode)
  const getMinDate = () => {
    if (isViewMode || isEditMode) return ''; // No restriction for view/edit modes
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Optional: Show what the selected time means in UTC (for preview only)
 // Enhanced UTC preview with better handling for edit mode
  const getUTCPreview = () => {
    if (!formData.dateTime || !formData.timeZone) return '';
    
    try {
      let dateToConvert = formData.dateTime;
      
      // If we have a UTC date from database (edit mode), first convert to local timezone
      if (typeof dateToConvert === 'string' && dateToConvert.includes('Z')) {
        const eventTimeZone = formData.timeZone || 'Australia/Sydney';
        const zonedDate = utcToZonedTime(dateToConvert, eventTimeZone);
        dateToConvert = format(zonedDate, 'yyyy-MM-dd\'T\'HH:mm');
      }
      
      // Now convert the local time to UTC for preview
      const utcDate = zonedTimeToUtc(dateToConvert, formData.timeZone);
      return utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    } catch (error) {
      return '';
    }
  };

  // Get field-specific styling based on mode and errors
  const getFieldClasses = (fieldName) => {
    const baseClasses = 'w-full p-2 border rounded-lg transition-colors';
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
    <div className="space-y-6">
      {/* Mode-aware header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          {config.title}
          {isEditMode && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Editing
            </span>
          )}
          {isViewMode && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Only
            </span>
          )}
        </h2>
        <p className="text-gray-600">{config.subtitle}</p>
      </div>
      
      {/* Title */}
      <div>
        <label className="block font-semibold mb-1">
          Event Title <span className="text-red-500">*</span>
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (This will update how your event appears to attendees)
            </span>
          )}
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
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.title) ? errors.title[0] : errors.title}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {getHelpText('title')}
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block font-semibold mb-1">
          Category
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Helps people find your event)
            </span>
          )}
        </label>
        <select
          name="category"
          value={formData.category || ''}
          onChange={handleChange}
          disabled={disabled}
          className={getFieldClasses('category')}
        >
          <option value="">
            {disabled ? 'No category selected' : 'Select a category'}
          </option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {!disabled && (
          <p className="text-xs text-gray-500 mt-1">
            Choose the category that best describes your event
          </p>
        )}
      </div>

      {/* Time Zone - Moved up before Date & Time */}
      <div>
        <label className="block font-semibold mb-1">
          Event Time Zone <span className="text-red-500">*</span>
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Changing this will affect how times are displayed)
            </span>
          )}
        </label>
        <select
          name="timeZone"
          value={formData.timeZone || 'Australia/Sydney'}
          onChange={handleChange}
          disabled={disabled}
          className={getFieldClasses('timeZone')}
        >
          {AU_TIMEZONES.map((tz) => (
            <option key={tz.key} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {errors?.timeZone && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.timeZone) ? errors.timeZone[0] : errors.timeZone}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {isViewMode 
            ? 'Time zone for this event'
            : 'Select the timezone where your event will take place'
          }
        </p>
      </div>

      {/* Date & Time */}
      <div>
        <label className="block font-semibold mb-1">
          Date & Time <span className="text-red-500">*</span>
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Attendees will be notified of any changes)
            </span>
          )}
        </label>
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
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.dateTime) ? errors.dateTime[0] : errors.dateTime}
          </p>
        )}
        <div className="text-sm text-gray-500 mt-1">
          <p>{getHelpText('dateTime')}</p>
          <p>Enter the date and time as it should appear in {formData.timeZone || 'Australia/Sydney'}</p>
          {formData.dateTime && formData.timeZone && (
            <p className="mt-1 text-blue-600">
              This will be saved as: {getUTCPreview()}
            </p>
          )}
          {isEditMode && formData.dateTime && (
            <p className="mt-1 text-amber-600 text-xs">
              ⚠️ Changing the date/time will send update notifications to all registered attendees
            </p>
          )}
        </div>
      </div>

      {/* Recurring Event Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.recurrence?.isRecurring || false}
            onChange={handleRecurringToggle}
            disabled={disabled}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50"
          />
          <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-900">
            Make this a recurring event
            {isEditMode && formData.recurrence?.isRecurring && (
              <span className="text-xs text-amber-600 block mt-1">
                ⚠️ Changes to recurring settings will affect all future instances
              </span>
            )}
          </label>
        </div>
        
        {formData.recurrence?.isRecurring && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {isViewMode 
                ? 'This event repeats on the following schedule:'
                : 'Set up when this event repeats. The main event date above will be the first occurrence.'
              }
            </p>
            
            {/* Repeat Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Repeat Schedule
                {isEditMode && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Existing attendees will see updated schedule)
                  </span>
                )}
              </label>
              {(formData.recurrence?.repeatSchedule || []).map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 mb-2 p-3 bg-white rounded border">
                  <select
                    value={schedule?.day || 'Mon'}
                    onChange={(e) => handleUpdateRepeatSchedule(index, 'day', e.target.value)}
                    disabled={disabled}
                    className={`p-2 border rounded ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                  >
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thu">Thursday</option>
                    <option value="Fri">Friday</option>
                    <option value="Sat">Saturday</option>
                    <option value="Sun">Sunday</option>
                  </select>
                  
                  <input
                    type="time"
                    value={schedule?.time || '18:00'}
                    onChange={(e) => handleUpdateRepeatSchedule(index, 'time', e.target.value)}
                    disabled={disabled}
                    className={`p-2 border rounded ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'}`}
                  />
                  
                  {!disabled && (formData.recurrence?.repeatSchedule || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRepeatSchedule(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove this schedule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              {!disabled && (
                <button
                  type="button"
                  onClick={handleAddRepeatSchedule}
                  className="text-teal-600 text-sm font-medium hover:underline flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Another Day/Time
                </button>
              )}
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date (Optional)
                {isEditMode && (
                  <span className="text-xs text-gray-500 ml-2">
                    (When to stop creating new instances)
                  </span>
                )}
              </label>
              <input
                type="date"
                value={formData.recurrence?.endDate ? new Date(formData.recurrence.endDate).toISOString().split('T')[0] : ''}
                onChange={handleRecurrenceEndDateChange}
                min={formData.dateTime ? new Date(formData.dateTime).toISOString().split('T')[0] : ''}
                disabled={disabled}
                className={getFieldClasses('recurrenceEndDate')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {isViewMode 
                  ? (formData.recurrence?.endDate 
                      ? 'This recurring series ends on the specified date'
                      : 'This recurring series has no end date'
                    )
                  : 'Leave empty for recurring events that don\'t have an end date'
                }
              </p>
            </div>
            
            {errors?.recurrence && (
              <div className="text-red-500 text-sm">
                {Array.isArray(errors.recurrence) 
                  ? errors.recurrence.map((err, i) => <p key={i}>• {err}</p>) 
                  : <p>• {errors.recurrence}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Venue */}
      <div>
        <label className="block font-semibold mb-1">
          Venue <span className="text-red-500">*</span>
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Venue changes will be communicated to attendees)
            </span>
          )}
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
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.venue) ? errors.venue[0] : errors.venue}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {getHelpText('venue')}
        </p>
      </div>

      {/* Address */}
      <div>
        <AddressInput 
          formData={formData} 
          setFormData={(newDataOrUpdater) => {
            if (disabled) return;
            
            console.log("setFormData called with:", newDataOrUpdater);
            // Handle the updater function pattern
            if (typeof newDataOrUpdater === 'function') {
              const dummyPrev = { address: formData.address || {} };
              const result = newDataOrUpdater(dummyPrev);
              handleAddressChange(result.address);
            } 
            // Handle direct object pattern
            else if (newDataOrUpdater && newDataOrUpdater.address) {
              handleAddressChange(newDataOrUpdater.address);
            }
          }}
          errors={errors?.address}
          placeholder={disabled ? 'Event address' : 'Enter event address'}
          disabled={disabled}
          mode={mode}
        />
        {isEditMode && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Address changes will update location information for all attendees
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-1">
          Description <span className="text-red-500">*</span>
          {isEditMode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Updates will be visible to all attendees)
            </span>
          )}
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          disabled={disabled}
          className={getFieldClasses('description')}
          rows="5"
          placeholder={disabled ? '' : 'Describe your event - what attendees can expect, agenda, special requirements, etc.'}
          maxLength="2000"
        />
        <div className="flex justify-between items-center mt-1">
          {errors?.description ? (
            <p className="text-red-500 text-sm">
              {Array.isArray(errors.description) ? errors.description[0] : errors.description}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              {getHelpText('description')}
            </p>
          )}
          <span className="text-xs text-gray-400">
            {(formData.description || '').length}/2000
          </span>
        </div>
      </div>
      
      {/* Image Upload */}
      <div>
        <ImageUploader
          images={formData.images || []}
          onImagesChange={disabled ? () => {} : onImagesChange}
          maxImages={5}
          className="space-y-2"
          disabled={disabled}
          mode={mode}
        />
        {errors?.images && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.images) ? errors.images[0] : errors.images}
          </p>
        )}
        {isEditMode && !disabled && (
          <p className="text-xs text-amber-600 mt-1">
            💡 Image changes will update how your event appears in listings and to attendees
          </p>
        )}
      </div>

      {/* Mode-specific information box */}
      {(isEditMode || isViewMode) && formData.title && (
        <div className={`p-4 rounded-lg border ${
          isEditMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${isEditMode ? 'text-blue-600' : 'text-gray-600'}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${isEditMode ? 'text-blue-800' : 'text-gray-800'}`}>
                {isEditMode ? 'Editing Event' : 'Event Information'}
              </h4>
              <div className={`mt-1 text-sm ${isEditMode ? 'text-blue-700' : 'text-gray-600'}`}>
                {isEditMode ? (
                  <p>
                    Changes made to this event will be automatically saved and may trigger 
                    notifications to registered attendees depending on the type of change.
                  </p>
                ) : (
                  <p>
                    This event information is displayed as configured by the event organizer.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsStep;