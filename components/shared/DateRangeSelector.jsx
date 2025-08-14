import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCalendar } from 'react-icons/fa';

const DateRangeSelector = ({ 
  value, 
  onChange, 
  options = [
    { value: '3months', label: 'Last 3 months' },
    { value: '6months', label: 'Last 6 months' },
    { value: '1year', label: 'Last year' },
    { value: 'all', label: 'Show all' }
  ],
  placeholder = "Select date range", 
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(option => option.value === value);

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

  const handleSelect = (optionValue) => {
    onChange(optionValue);
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
        <span className="flex items-center gap-2">
          <FaCalendar className="w-4 h-4 text-gray-400" />
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <FaChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 
            ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {options.map((option) => {
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left hover:bg-teal-50 transition-colors
                  ${isSelected ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}
                  border-b border-gray-100 last:border-b-0`}
              >
                <div className="flex items-center gap-2">
                  <FaCalendar className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;