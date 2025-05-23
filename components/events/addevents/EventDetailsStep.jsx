// components/events/addevents/EventDetailsStep.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { 
  updateField, 
  setAddress, 
  setPreview,
  toggleRecurring,
  addRepeatSchedule,
  updateRepeatSchedule,
  removeRepeatSchedule,
  setRecurrenceEndDate
} from '@/store/slices/events/eventSlice';
import AddressInput from '@/components/shared/AddressInput';
import ImageUploader from '@/components/shared/ImageUploader';
import { CATEGORY_OPTIONS } from '@/components/events/addevents/EventCategories';
import { zonedTimeToUtc } from 'date-fns-tz';

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

const EventDetailsStep = ({ formData, preview, errors = {} }) => {
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
  };

  const handleAddressChange = (address) => {
    console.log("Address being set in Redux:", address);
    dispatch(setAddress(address));
  };

  const handlePreviewChange = (newPreview) => {
    dispatch(setPreview(newPreview));
  };

  const handleImageChange = (newImages) => {
    dispatch(updateField({ field: 'images', value: newImages }));
  };

  // Recurring event handlers
  const handleRecurringToggle = (e) => {
    dispatch(toggleRecurring(e.target.checked));
  };

  const handleAddRepeatSchedule = () => {
    dispatch(addRepeatSchedule());
  };

  const handleUpdateRepeatSchedule = (index, field, value) => {
    dispatch(updateRepeatSchedule({ index, field, value }));
  };

  const handleRemoveRepeatSchedule = (index) => {
    dispatch(removeRepeatSchedule(index));
  };

  const handleRecurrenceEndDateChange = (e) => {
    dispatch(setRecurrenceEndDate(e.target.value || null));
  };

  // Simple format - no timezone conversion, just display what user typed
  const formatDateTimeLocal = (dateTime) => {
    if (!dateTime) return '';
    
    // If it's already in YYYY-MM-DDTHH:MM format, return as-is
    if (typeof dateTime === 'string' && dateTime.includes('T') && !dateTime.includes('Z')) {
      return dateTime.slice(0, 16); // Keep only YYYY-MM-DDTHH:MM
    }
    
    // For any other format, try to format it without timezone conversion
    try {
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

  // Simple minimum date - just today in local browser time
  const getMinDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Optional: Show what the selected time means in UTC (for preview only)
  const getUTCPreview = () => {
    if (!formData.dateTime || !formData.timeZone) return '';
    
    try {
      const utcDate = zonedTimeToUtc(formData.dateTime, formData.timeZone);
      return utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Event Details</h2>
      
      {/* Title */}
      <div>
        <label className="block font-semibold mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg ${
            errors?.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter event title"
          maxLength="200"
        />
        {errors?.title && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.title) ? errors.title[0] : errors.title}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block font-semibold mb-1">Category</label>
        <select
          name="category"
          value={formData.category || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">
            Select a category
          </option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Time Zone - Moved up before Date & Time */}
      <div>
        <label className="block font-semibold mb-1">
          Event Time Zone <span className="text-red-500">*</span>
        </label>
        <select
          name="timeZone"
          value={formData.timeZone || 'Australia/Sydney'}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg ${
            errors?.timeZone ? 'border-red-500' : 'border-gray-300'
          }`}
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
          Select the timezone where your event will take place
        </p>
      </div>

      {/* Date & Time */}
      <div>
        <label className="block font-semibold mb-1">
          Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          name="dateTime"
          value={formatDateTimeLocal(formData.dateTime)}
          onChange={handleChange}
          min={getMinDate()}
          className={`w-full p-2 border rounded-lg ${
            errors?.dateTime ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors?.dateTime && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.dateTime) ? errors.dateTime[0] : errors.dateTime}
          </p>
        )}
        <div className="text-sm text-gray-500 mt-1">
          <p>Enter the date and time as it should appear in {formData.timeZone || 'Australia/Sydney'}</p>
          {formData.dateTime && formData.timeZone && (
            <p className="mt-1 text-blue-600">
              This will be saved as: {getUTCPreview()}
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
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-900">
            Make this a recurring event
          </label>
        </div>
        
        {formData.recurrence?.isRecurring && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Set up when this event repeats. The main event date above will be the first occurrence.
            </p>
            
            {/* Repeat Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2">Repeat Schedule</label>
              {(formData.recurrence?.repeatSchedule || []).map((schedule, index) => (
                <div key={index} className="flex items-center gap-3 mb-2 p-3 bg-white rounded border">
                  <select
                    value={schedule?.day || 'Mon'}
                    onChange={(e) => handleUpdateRepeatSchedule(index, 'day', e.target.value)}
                    className="p-2 border border-gray-300 rounded"
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
                    className="p-2 border border-gray-300 rounded"
                  />
                  
                  {(formData.recurrence?.repeatSchedule || []).length > 1 && (
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
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.recurrence?.endDate ? new Date(formData.recurrence.endDate).toISOString().split('T')[0] : ''}
                onChange={handleRecurrenceEndDateChange}
                min={formData.dateTime ? new Date(formData.dateTime).toISOString().split('T')[0] : ''}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for recurring events that don't have an end date
              </p>
            </div>
            
            {errors?.recurrence && (
              <div className="text-red-500 text-sm">
                {Array.isArray(errors.recurrence) 
                  ? errors.recurrence.map((err, i) => <p key={i}>{err}</p>) 
                  : errors.recurrence}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Venue */}
      <div>
        <label className="block font-semibold mb-1">
          Venue <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="venue"
          value={formData.venue || ''}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg ${
            errors?.venue ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter venue name"
          maxLength="200"
        />
        {errors?.venue && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.venue) ? errors.venue[0] : errors.venue}
          </p>
        )}
      </div>

      {/* Address */}
      <div>
        <AddressInput 
          formData={formData} 
          setFormData={(newDataOrUpdater) => {
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
          placeholder="Enter event address"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          className={`w-full p-2 border rounded-lg ${
            errors?.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows="5"
          placeholder="Describe your event - what attendees can expect, agenda, special requirements, etc."
          maxLength="2000"
        />
        <div className="flex justify-between items-center mt-1">
          {errors?.description ? (
            <p className="text-red-500 text-sm">
              {Array.isArray(errors.description) ? errors.description[0] : errors.description}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              Provide a detailed description of your event
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
          preview={preview}
          setPreview={handlePreviewChange}
          formData={formData}
          setFormData={(newData) => {
            if (newData.images) {
              handleImageChange(newData.images);
            }
          }}
          maxImages={5}
        />
        {errors?.images && (
          <p className="mt-1 text-red-500 text-sm">
            {Array.isArray(errors.images) ? errors.images[0] : errors.images}
          </p>
        )}
      </div>
    </div>
  );
};

export default EventDetailsStep;