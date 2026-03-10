import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const SimpleDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option", 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Find the label for the current value
  const selectedOption = options.find(opt => 
    typeof opt === 'object' ? opt.value === value : opt === value
  );
  
  const displayValue = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : '';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg bg-white text-left flex items-center justify-between
          ${value ? 'text-slate-900' : 'text-slate-500'}
          ${isOpen ? 'border-teal-500 ring-2 ring-teal-300' : 'border-slate-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:border-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-300 cursor-pointer'}
          transition-all duration-200`}
      >
        <span className="truncate pr-2">
          {displayValue || placeholder}
        </span>
        <FaChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200
            ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Option for empty value */}
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50
              focus:outline-none transition-colors text-sm sm:text-base
              ${!value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-500'}`}
          >
            {placeholder}
          </button>

          {/* Options */}
          {options.map((option) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;

            return (
              <button
                key={optionValue}
                type="button"
                onClick={() => handleSelect(optionValue)}
                className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50
                  focus:outline-none transition-colors text-sm sm:text-base
                  ${value === optionValue ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
              >
                {optionLabel}
              </button>
            );
          })}

          {/* Mobile-friendly close button */}
          <div className="p-2 border-t border-slate-100 sm:hidden">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-center text-slate-600 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDropdown;