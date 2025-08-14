import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';

const EventSelector = ({ 
  value, 
  onChange, 
  events = [], 
  placeholder = "Choose an event", 
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find selected event
  const selectedEvent = events.find(event => event.id === value);

  // Format event date
  const formatEventDateTime = (dateTime, timeZone) => {
    try {
      const date = formatInTimeZone(dateTime, timeZone || 'Australia/Sydney', 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone || 'Australia/Sydney', 'h:mm a');
      return `${date} at ${time}`;
    } catch (error) {
      return new Date(dateTime).toLocaleString();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (eventId) => {
    onChange(eventId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 border rounded-lg bg-white text-left flex items-center justify-between
          ${value ? 'text-gray-900' : 'text-gray-500'}
          ${isOpen ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          transition-all duration-200`}
      >
        <span className="truncate pr-2">
          {selectedEvent 
            ? `${selectedEvent.title} - ${formatEventDateTime(selectedEvent.dateTime, selectedEvent.timeZone)}`
            : placeholder
          }
        </span>
        <FaChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 
            ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {events.length > 0 ? (
            events.map((event) => {
              const isSelected = value === event.id;
              const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
              
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => handleSelect(event.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors
                    ${isSelected ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}
                    border-b border-gray-100 last:border-b-0`}
                >
                  <div className="text-sm">
                    {event.eventCode} - {event.title} - {eventDateTime}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              No events available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSelector;