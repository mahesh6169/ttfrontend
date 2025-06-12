'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  searchTickets,
  setSearchTerm,
  setSearchType,
  clearSearchResults,
  selectSearch,
  selectSelectedEvent
} from '@/store/slices/events/refundSlice';
import { 
  IoSearchOutline,
  IoCloseOutline,
  IoFilterOutline
} from 'react-icons/io5';
import { debounce } from 'lodash';

export default function TicketSearchBar({ 
  searchTerm, 
  onSearch, 
  activeTab, 
  eventId 
}) {
  const dispatch = useDispatch();
  const search = useSelector(selectSearch);
  const selectedEvent = useSelector(selectSelectedEvent);
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [localSearchType, setLocalSearchType] = useState(search.type || 'all');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
const debouncedSearch = useCallback(
  debounce(async (term, type) => {
    if (!selectedEvent?._id) return;
    
    setIsSearching(true);
    
    if (term.trim()) {
      try {
        await dispatch(searchTickets({
          eventId: selectedEvent._id,
          searchTerm: term.trim(),
          searchType: type
        }));
      } catch (error) {
        console.error('Search failed:', error);
      }
    } else {
      dispatch(clearSearchResults());
    }
    
    setIsSearching(false);
  }, 500),
  [selectedEvent?._id] // FIXED: Removed dispatch from dependencies
);

  // Effect to trigger search when term or type changes
  useEffect(() => {
    dispatch(setSearchTerm(localSearchTerm));
    dispatch(setSearchType(localSearchType));
    debouncedSearch(localSearchTerm, localSearchType);
    
    // Call parent onSearch callback if provided
    if (onSearch) {
      onSearch(localSearchTerm);
    }
  }, [localSearchTerm, localSearchType]);

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    dispatch(clearSearchResults());
    dispatch(setSearchTerm(''));
  };



  const getSearchPlaceholder = () => {
    switch (localSearchType) {
      case 'ticketNumber':
        return 'Search by ticket number...';
      case 'invoiceNumber':
        return 'Search by invoice number...';
      case 'buyerName':
        return 'Search by buyer name...';
      case 'buyerEmail':
        return 'Search by buyer email...';
      default:
        return 'Search tickets, invoices, or buyer info...';
    }
  };

  const getSearchTypeDisplay = () => {
    switch (localSearchType) {
      case 'ticketNumber':
        return 'Ticket #';
      case 'invoiceNumber':
        return 'Invoice #';
      case 'buyerName':
        return 'Buyer Name';
      case 'buyerEmail':
        return 'Buyer Email';
      default:
        return 'All Fields';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        {/* Search Type Filter */}
        <div className="flex-shrink-0">
          <div className="relative">
            <select
              value={localSearchType}
              onChange={(e) => setLocalSearchType(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="ticketNumber">Ticket Number</option>
              <option value="invoiceNumber">Invoice Number</option>
              <option value="buyerName">Buyer Name</option>
              <option value="buyerEmail">Buyer Email</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <IoFilterOutline className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IoSearchOutline className={`h-5 w-5 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            placeholder={getSearchPlaceholder()}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {localSearchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <IoCloseOutline className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>


      </div>

      {/* Search Info */}
      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>
            Searching: <span className="font-medium">{getSearchTypeDisplay()}</span>
          </span>
          {localSearchTerm && (
            <span>
              Term: <span className="font-medium">"{localSearchTerm}"</span>
            </span>
          )}
        </div>
        
        {search.results.length > 0 && (
          <span className="text-blue-600">
            {search.results.length} result{search.results.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Search Results Status */}
      {search.error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{search.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {localSearchTerm && !isSearching && search.results.length === 0 && !search.error && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Results Found</h3>
              <p className="text-sm text-yellow-700 mt-1">
                No tickets found matching "{localSearchTerm}" in {getSearchTypeDisplay().toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Tips */}
      {activeTab === 'individual' && localSearchTerm && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Search Tips for Individual Refunds:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use exact ticket numbers (e.g., "TK-2024-001234")</li>
            <li>• Search by buyer's full name or email address</li>
            <li>• Invoice numbers are also searchable</li>
          </ul>
        </div>
      )}

      {activeTab === 'group' && localSearchTerm && (
        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-purple-800 mb-2">Search Tips for Group Refunds:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Search by invoice number to find all tickets in a group</li>
            <li>• Use buyer name or email to find all their purchases</li>
            <li>• All tickets with the same invoice will be grouped together</li>
          </ul>
        </div>
      )}
    </div>
  );
}