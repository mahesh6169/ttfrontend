'use client';

import { useState } from 'react';
import { IoChevronDown, IoCalendarOutline, IoLocationOutline } from 'react-icons/io5';

export default function EventSelector({ events, selectedEvent, onEventSelect, loading, error }) {
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatEventDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Event to Manage Refunds
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
        >
          {selectedEvent ? (
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedEvent.title}
                </p>
                <div className="flex items-center mt-1 space-x-4">
                  <span className="flex items-center text-xs text-gray-500">
                    <IoCalendarOutline className="h-3 w-3 mr-1" />
                    {formatEventDate(selectedEvent.dateTime)}
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <IoLocationOutline className="h-3 w-3 mr-1" />
                    {selectedEvent.venue}
                  </span>
                </div>
              </div>
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Selected
              </span>
            </div>
          ) : (
            <span className="text-gray-500">Choose an event...</span>
          )}
          
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <IoChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {events.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500">No paid events found</p>
                <p className="text-xs text-gray-400 mt-1">Only events with ticket sales support refunds</p>
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event._id}
                  onClick={() => {
                    onEventSelect(event);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                    selectedEvent?._id === event._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selectedEvent?._id === event._id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </p>
                      <div className="flex flex-wrap items-center mt-1 gap-x-4 gap-y-1">
                        <span className="flex items-center text-xs text-gray-500">
                          <IoCalendarOutline className="h-3 w-3 mr-1 flex-shrink-0" />
                          {formatEventDate(event.dateTime)}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <IoLocationOutline className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </span>
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {event.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          event.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                    {selectedEvent?._id === event._id && (
                      <div className="ml-2 flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Event count info */}
      {events.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{events.length} paid event{events.length !== 1 ? 's' : ''} available</span>
          {selectedEvent && (
            <span className="text-blue-600">
              Event Code: {selectedEvent.eventCode}
            </span>
          )}
        </div>
      )}
    </div>
  );
}