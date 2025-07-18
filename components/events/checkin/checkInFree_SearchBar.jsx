// components/events/checkin/checkInFree_SearchBar.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchTerm } from '@/store/slices/events/checkInFreeSlice';
import { debounce } from 'lodash';

const CheckInFree_SearchBar = () => {
  const dispatch = useDispatch();
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Debounced search to reduce Redux updates
  const debouncedSearch = useCallback(
    debounce((term) => {
      dispatch(setSearchTerm(term));
    }, 300),
    [dispatch]
  );

  // Update Redux when local search term changes
  useEffect(() => {
    debouncedSearch(localSearchTerm);
  }, [localSearchTerm, debouncedSearch]);

  // Clear search
  const handleClear = () => {
    setLocalSearchTerm('');
    dispatch(setSearchTerm(''));
  };

  return (
    <div className="relative">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        {/* Search Input */}
        <input
          type="text"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          placeholder="Search by registration # or name..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
        />
        
        {/* Clear Button */}
        {localSearchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            type="button"
          >
            <svg 
              className="h-5 w-5 text-gray-400 hover:text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Search Help Text */}
      <p className="mt-1 text-xs text-gray-500">
        Search by registration number (e.g., FT-12345) or attendee name
      </p>
    </div>
  );
};

export default CheckInFree_SearchBar;