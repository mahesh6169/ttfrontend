'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';

/**
 * DateTimePicker - Split date and time inputs with clean UI
 * Outputs combined value in "YYYY-MM-DDTHH:MM" format (same as datetime-local)
 */
const DateTimePicker = ({
  value = '',
  onChange,
  min = '',
  disabled = false,
  error = false,
  className = '',
}) => {
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const timeRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse the combined datetime value into separate date and time
  const { dateValue, timeValue } = useMemo(() => {
    if (!value) return { dateValue: '', timeValue: '' };

    // Handle "YYYY-MM-DDTHH:MM" format
    if (value.includes('T')) {
      const [date, time] = value.split('T');
      return {
        dateValue: date,
        timeValue: time?.slice(0, 5) || '' // Get HH:MM
      };
    }

    return { dateValue: '', timeValue: '' };
  }, [value]);

  // Generate time options (15-min intervals)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        const value24 = `${h}:${m}`;

        // Format display as 12-hour with AM/PM
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const display = `${hour12}:${m.padStart(2, '0')} ${ampm}`;

        options.push({ value: value24, display });
      }
    }
    return options;
  }, []);

  // Get display text for selected time
  const selectedTimeDisplay = useMemo(() => {
    if (!timeValue) return 'Time';
    const option = timeOptions.find(opt => opt.value === timeValue);
    return option ? option.display : timeValue;
  }, [timeValue, timeOptions]);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && timeValue) {
      onChange({ target: { name: 'dateTime', value: `${newDate}T${timeValue}` } });
    } else if (newDate) {
      // If no time selected yet, default to 18:00 (6 PM)
      onChange({ target: { name: 'dateTime', value: `${newDate}T18:00` } });
    } else {
      onChange({ target: { name: 'dateTime', value: '' } });
    }
  };

  // Handle time selection
  const handleTimeSelect = (newTime) => {
    if (dateValue && newTime) {
      onChange({ target: { name: 'dateTime', value: `${dateValue}T${newTime}` } });
    }
    setIsTimeOpen(false);
  };

  // Get min date for the date input
  const minDate = useMemo(() => {
    if (!min) return '';
    if (min.includes('T')) {
      return min.split('T')[0];
    }
    return min;
  }, [min]);

  // Styling
  const stateClasses = error
    ? 'border-red-500 focus:ring-red-300'
    : 'border-slate-300 focus:ring-teal-300';
  const disabledClasses = disabled
    ? 'bg-slate-100 cursor-not-allowed text-slate-600'
    : 'bg-white';

  const isTimeDisabled = disabled || !dateValue;

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Date Input */}
      <input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        min={minDate}
        disabled={disabled}
        className={`flex-1 py-2 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 ${stateClasses} ${disabledClasses}`}
      />

      {/* Custom Time Dropdown */}
      <div className="relative" ref={timeRef}>
        <button
          type="button"
          onClick={() => !isTimeDisabled && setIsTimeOpen(!isTimeOpen)}
          disabled={isTimeDisabled}
          className={`w-28 py-2 px-3 text-sm text-left border rounded-lg focus:outline-none focus:ring-2 flex items-center justify-between ${stateClasses} ${disabledClasses} ${isTimeDisabled ? '' : 'cursor-pointer'} ${!timeValue && !disabled ? 'text-slate-400' : ''}`}
        >
          <span>{selectedTimeDisplay}</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown List */}
        {isTimeOpen && (
          <div className="absolute z-50 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTimeSelect(opt.value)}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-slate-100 ${
                  opt.value === timeValue ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'
                }`}
              >
                {opt.display}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
