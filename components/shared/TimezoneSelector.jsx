import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';

const TimezoneSelector = ({ value, onChange, timezones, placeholder = "Select timezone", required = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter timezones based on search
  const filteredTimezones = timezones.filter(tz =>
    tz.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens (desktop only)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Only auto-focus on desktop (screens wider than 768px)
      if (window.innerWidth >= 768) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleSelect = (timezone) => {
    onChange(timezone.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Get the display label for the selected value
  const getDisplayLabel = () => {
    if (!value) return placeholder;
    const selected = timezones.find(tz => tz.value === value);
    return selected ? selected.label : value;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 border rounded-lg bg-white text-left flex items-center justify-between
          ${value ? 'text-gray-900' : 'text-gray-500'}
          ${isOpen ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-300'}
          hover:border-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200
          transition-all duration-200`}
      >
        <span className="truncate pr-2">
          {getDisplayLabel()}
        </span>
        <div className="flex items-center gap-2">
          {value && !isOpen && (
            <FaTimes 
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <FaChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 
              ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search timezones..."
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md 
                  focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
              />
            </div>
          </div>

          {/* Timezone List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((timezone) => (
                <button
                  key={timezone.key}
                  type="button"
                  onClick={() => handleSelect(timezone)}
                  className={`w-full px-4 py-3 text-left hover:bg-teal-50 focus:bg-teal-50 
                    focus:outline-none transition-colors
                    ${value === timezone.value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}`}
                >
                  {timezone.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No timezones found
              </div>
            )}
          </div>

          {/* Mobile-friendly footer */}
          <div className="p-2 border-t border-gray-100 md:hidden">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full py-2 text-center text-gray-600 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelector;