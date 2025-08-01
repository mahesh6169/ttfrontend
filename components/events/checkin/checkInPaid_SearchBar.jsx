// components/events/checkin/checkInPaid_SearchBar.jsx

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaid_SearchBar = () => {
  const dispatch = useDispatch();
  const { searchTerm, selectedEvent } = useSelector((state) => state.checkInPaid);

  const handleSearch = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  if (!selectedEvent) {
    return null;
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by name, email, ticket number, or invoice number..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
};

export default CheckInPaid_SearchBar;