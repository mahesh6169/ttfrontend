'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

// Custom dropdown for the events filter drawer (Category, Month). It follows the shared dropdown
// pattern in designguide/00-shared/filters.md + design-system.md: an input-box trigger with a
// chevron and teal focus, a panel-look menu (slate-200 border, rounded-lg, shadow), and
// teal-50 / teal-700 hover/selected options. Native <select> is deliberately avoided.
//
// options: [{ value, label }] (the first entry is usually the "All ..." value=''). value/onChange
// are controlled by the caller; choices apply on the drawer's "Show results", like every other
// drawer filter.
const FilterDropdown = ({ value, onChange, options, placeholder = 'Select', ariaLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);
  const display = selected && selected.value ? selected.label : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-left flex items-center justify-between transition-all
          ${value ? 'text-slate-700' : 'text-slate-400'}
          ${isOpen ? 'border-teal-400 ring-2 ring-teal-300' : 'border-slate-300 hover:border-slate-400'}`}
      >
        <span className="truncate pr-2">{display}</span>
        <FaChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.value || 'all'}
              type="button"
              onClick={() => {
                onChange(o.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-teal-50 hover:text-teal-700
                ${value === o.value ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-700'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
