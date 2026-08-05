'use client';
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const SelectSlider = ({ options, value, onChange, placeholder = 'Select an option' }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full md:w-64" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-2 border rounded shadow-sm bg-white hover:bg-slate-100"
      >
        <span className="truncate">{value || placeholder}</span>
        <FaChevronDown className="ml-2 text-slate-500" size={14} />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`px-4 py-2 hover:bg-slate-200 cursor-pointer ${
                option === value ? 'bg-slate-100 font-semibold' : ''
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SelectSlider;
