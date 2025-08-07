// components/events/checkin/checkInFree_SearchBar.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm, fetchEventAttendees, setCurrentPage } from '@/store/slices/events/checkInFreeSlice';
import { debounce } from 'lodash';

const CheckInFree_SearchBar = () => {
  const dispatch = useDispatch();
  const { selectedEvent, pagination } = useSelector((state) => state.checkInFree);
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Debounced search to reduce API calls
  const debouncedSearch = useCallback(
    debounce((term) => {
      dispatch(setSearchTerm(term));
      // Trigger server-side search with pagination reset
      if (selectedEvent) {
        dispatch(setCurrentPage(1)); // Reset to first page on new search
        dispatch(fetchEventAttendees({ 
          eventId: selectedEvent._id, 
          page: 1, 
          limit: pagination.limit || 20,
          search: term 
        }));
      }
    }, 500),
    [dispatch, selectedEvent, pagination.limit]
  );

  // Update search when local search term changes
  useEffect(() => {
    debouncedSearch(localSearchTerm);
  }, [localSearchTerm, debouncedSearch]);

  // Clear search
  const handleClear = () => {
    setLocalSearchTerm('');
    dispatch(setSearchTerm(''));
    // Refetch without search term
    if (selectedEvent) {
      dispatch(setCurrentPage(1));
      dispatch(fetchEventAttendees({ 
        eventId: selectedEvent._id, 
        page: 1, 
        limit: pagination.limit || 20,
        search: '' 
      }));
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" 
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
          placeholder="Reg No., Attendee Name, Email"
          className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
        />
        
        {/* Clear Button */}
        {localSearchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
            type="button"
          >
            <svg 
              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" 
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
      
    </div>
  );
};

export default CheckInFree_SearchBar;