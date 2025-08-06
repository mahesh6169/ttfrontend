// components/events/checkin/checkInFree_AttendeeList.jsx

'use client';

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CheckInFree_SimpleAttendeeRow from './checkInFree_SimpleAttendeeRow';
import Pagination from '@/components/Pagination';
import { 
  bulkCheckInRegistration,
  updateLocalBulkCheckIn,
  fetchEventAttendees,
  setCurrentPage
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
    actionLoading,
    pagination 
  } = useSelector((state) => state.checkInFree);
  
  const [expandedRegistrations, setExpandedRegistrations] = useState(new Set());
  const [showFormResponses, setShowFormResponses] = useState(new Set());

  // No client-side filtering needed - server handles search
  const displayedAttendees = attendees;

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

  if (displayedAttendees.length === 0) {
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

  // Handle page change
  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
    dispatch(fetchEventAttendees({ 
      eventId: selectedEvent._id, 
      page: newPage, 
      limit: pagination.limit,
      search: searchTerm 
    }));
  };

  return (
    <div className="space-y-4">

      {/* Registration List */}
      {displayedAttendees.map((registration) => {
        const isExpanded = expandedRegistrations.has(registration._id);
        const allCheckedIn = areAllCheckedIn(registration);
        const someCheckedIn = areSomeCheckedIn(registration);
        const hasMultipleAttendees = registration.attendees.length > 1;
        const showPartialCheckIn = someCheckedIn && !allCheckedIn && hasMultipleAttendees;
        const checkedInCount = registration.attendees.filter(a => a.checkedIn).length;
        
        return (
          <div 
            key={registration._id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Registration Header - New Layout */}
            <div 
              className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleRegistration(registration._id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Registration Number */}
                  <div className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                    {registration.registrationNumber}
                  </div>
                  
                  {/* User Details */}
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-700">{registration.user?.name || registration.userId?.name || 'Former User'}</span>
                    {registration.user?.phone && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{registration.user.phone}</span>
                      </>
                    )}
                    {registration.email && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="break-all">{registration.email}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Attendee Count and Check-in Status */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">
                      {registration.attendees.length} Attendee{registration.attendees.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className={`font-medium ${allCheckedIn ? 'text-green-600' : showPartialCheckIn ? 'text-yellow-600' : 'text-gray-600'}`}>
                      Checked In: {checkedInCount}/{registration.attendees.length}
                    </span>
                    <span className="text-blue-600 hover:text-blue-800 underline ml-2">
                      {isExpanded ? 'Hide attendees' : 'View attendees'}
                    </span>
                  </div>
                </div>
                
                {/* Check In All Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkCheckIn(registration._id, !allCheckedIn);
                  }}
                  disabled={actionLoading}
                  className={`
                    px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                    ${allCheckedIn 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }
                    ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {allCheckedIn ? 'Check Out All' : 'Check In All'}
                </button>
              </div>
            </div>
            
            {/* Attendees List - Only show when expanded */}
            {isExpanded && (
              <div className="bg-gray-50">
                {registration.attendees.map((attendee, idx) => (
                  <div key={attendee._id} className="border-b border-gray-200 last:border-b-0">
                    <CheckInFree_SimpleAttendeeRow
                      attendee={attendee}
                      ticketId={registration._id}
                      registrationNumber={registration.registrationNumber}
                      isHighlighted={searchTerm && attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Attendee Information (Form Responses) */}
            {registration.formResponses && registration.formResponses.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newShowFormResponses = new Set(showFormResponses);
                    if (newShowFormResponses.has(registration._id)) {
                      newShowFormResponses.delete(registration._id);
                    } else {
                      newShowFormResponses.add(registration._id);
                    }
                    setShowFormResponses(newShowFormResponses);
                  }}
                  className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mb-2"
                >
                  <svg 
                    className={`w-3 h-3 transition-transform ${showFormResponses.has(registration._id) ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showFormResponses.has(registration._id) ? 'Hide' : 'View'} Attendee Information
                </button>
                
                {/* Form Responses Display */}
                {showFormResponses.has(registration._id) && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    {registration.formResponses.map((response, index) => (
                      <div key={index}>
                        <div className="font-medium text-gray-700">{response.fieldName}:</div>
                        <div className="text-gray-600 pl-4 whitespace-pre-line">{response.response}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CheckInFree_AttendeeList;