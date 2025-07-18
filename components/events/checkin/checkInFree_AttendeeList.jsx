// components/events/checkin/checkInFree_AttendeeList.jsx

'use client';

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CheckInFree_AttendeeCard from './checkInFree_AttendeeCard';
import { 
  bulkCheckInRegistration,
  updateLocalBulkCheckIn
} from '@/store/slices/events/checkInFreeSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CheckInFree_AttendeeList = () => {
  const dispatch = useDispatch();
  const { 
    attendees, 
    searchTerm, 
    selectedEvent,
    attendeesLoading,
    actionLoading 
  } = useSelector((state) => state.checkInFree);
  
  const [expandedRegistrations, setExpandedRegistrations] = useState(new Set());
  const [showFormResponses, setShowFormResponses] = useState(new Set());

  // Filter attendees based on search term
  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees;
    
    const term = searchTerm.toLowerCase();
    
    return attendees.filter(registration => 
      // Search by registration number
      registration.registrationNumber?.toLowerCase().includes(term) ||
      // Search by any attendee name
      registration.attendees.some(attendee => 
        attendee.name?.toLowerCase().includes(term)
      ) ||
      // Search by user email (check both user and userId fields)
      registration.user?.email?.toLowerCase().includes(term) ||
      registration.userId?.email?.toLowerCase().includes(term) ||
      // Search by user name (check both user and userId fields)
      registration.user?.name?.toLowerCase().includes(term) ||
      registration.userId?.name?.toLowerCase().includes(term)
    );
  }, [attendees, searchTerm]);

  // Toggle registration expansion
  const toggleRegistration = (registrationId) => {
    const newExpanded = new Set(expandedRegistrations);
    if (newExpanded.has(registrationId)) {
      newExpanded.delete(registrationId);
    } else {
      newExpanded.add(registrationId);
    }
    setExpandedRegistrations(newExpanded);
  };

  // Handle bulk check-in/out for a registration
  const handleBulkCheckIn = async (ticketId, checkIn) => {
    if (!selectedEvent || actionLoading) return;

    try {
      await dispatch(bulkCheckInRegistration({
        eventId: selectedEvent._id,
        ticketId,
        checkIn
      })).unwrap();
      
      // Update local state
      dispatch(updateLocalBulkCheckIn({
        ticketId,
        checkedIn: checkIn,
        checkInTime: checkIn ? new Date().toISOString() : null
      }));
      
      toast.success(`All attendees ${checkIn ? 'checked in' : 'checked out'}`);
    } catch (error) {
      toast.error(error || 'Bulk operation failed');
    }
  };

  // Format registration date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Check if all attendees in a registration are checked in
  const areAllCheckedIn = (registration) => {
    return registration.attendees.every(att => att.checkedIn);
  };

  // Check if some attendees in a registration are checked in
  const areSomeCheckedIn = (registration) => {
    return registration.attendees.some(att => att.checkedIn);
  };


  if (attendeesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select an event to view attendees
      </div>
    );
  }

  if (filteredAttendees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {searchTerm 
            ? `No attendees found matching "${searchTerm}"`
            : 'No registrations found for this event'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Registration List */}
      {filteredAttendees.map((registration) => {
        const isExpanded = expandedRegistrations.has(registration._id);
        const allCheckedIn = areAllCheckedIn(registration);
        const someCheckedIn = areSomeCheckedIn(registration);
        const hasMultipleAttendees = registration.attendees.length > 1;
        const showPartialCheckIn = someCheckedIn && !allCheckedIn && hasMultipleAttendees;
        
        return (
          <div 
            key={registration._id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Registration Header */}
            <div 
              className={`p-4 cursor-pointer transition-colors ${
                allCheckedIn ? 'bg-green-50' : showPartialCheckIn ? 'bg-yellow-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleRegistration(registration._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {registration.registrationNumber}
                    </h3>
                    {allCheckedIn && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        All Checked In
                      </span>
                    )}
                    {showPartialCheckIn && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Partial Check-in
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-1">
                    <span>{registration.user?.name || registration.userId?.name || 'Former User'}</span>
                    <span className="ml-2">• {registration.email}</span>
                    <span className="ml-2">• {registration.attendees.length} attendee{registration.attendees.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-1">
                    Registered: {formatDate(registration.createdAt)}
                  </div>
                  
                  {/* View Registration Details Link */}
                  {registration.formResponses && registration.formResponses.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle showing form responses for this registration
                        const newShowFormResponses = new Set(showFormResponses);
                        if (newShowFormResponses.has(registration._id)) {
                          newShowFormResponses.delete(registration._id);
                        } else {
                          newShowFormResponses.add(registration._id);
                        }
                        setShowFormResponses(newShowFormResponses);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 mt-1 flex items-center gap-1"
                    >
                      <svg 
                        className={`w-3 h-3 transition-transform ${showFormResponses.has(registration._id) ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {showFormResponses.has(registration._id) ? 'Hide' : 'View'} Registration Details
                    </button>
                  )}
                  
                  {/* Form Responses Display */}
                  {showFormResponses.has(registration._id) && registration.formResponses && registration.formResponses.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs space-y-1">
                      {registration.formResponses.map((response, index) => (
                        <div key={index}>
                          <span className="font-medium text-gray-700">{response.fieldName}:</span>
                          <span className="ml-1 text-gray-600">{response.response}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Bulk Check-in/out Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkCheckIn(registration._id, !allCheckedIn);
                    }}
                    disabled={actionLoading}
                    className={`
                      px-3 py-1 rounded text-sm font-medium transition-colors
                      ${allCheckedIn 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      }
                      ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {allCheckedIn ? 'Check Out All' : 'Check In All'}
                  </button>
                  
                  {/* Expand/Collapse Icon */}
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Attendees List */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                {registration.attendees.map((attendee) => (
                  <CheckInFree_AttendeeCard
                    key={attendee._id}
                    attendee={attendee}
                    ticketId={registration._id}
                    registrationNumber={registration.registrationNumber}
                    formResponses={[]} // Don't show form responses in individual cards
                    isHighlighted={searchTerm && attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CheckInFree_AttendeeList;