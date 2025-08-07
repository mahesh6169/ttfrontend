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
  const [activeTab, setActiveTab] = useState({}); // { registrationId: 'attendees' | 'attendeeInfo' }

  // No client-side filtering needed - server handles search
  const displayedAttendees = attendees;

  // Handle tab click
  const handleTabClick = (registrationId, tab) => {
    const isCurrentlyExpanded = expandedRegistrations.has(registrationId);
    const currentTab = activeTab[registrationId] || 'attendees';
    
    if (!isCurrentlyExpanded) {
      // If not expanded, expand and set the tab
      const newExpanded = new Set(expandedRegistrations);
      newExpanded.add(registrationId);
      setExpandedRegistrations(newExpanded);
      setActiveTab({ ...activeTab, [registrationId]: tab });
    } else if (currentTab === tab) {
      // If clicking the same tab, collapse
      const newExpanded = new Set(expandedRegistrations);
      newExpanded.delete(registrationId);
      setExpandedRegistrations(newExpanded);
    } else {
      // If clicking different tab, just switch tabs
      setActiveTab({ ...activeTab, [registrationId]: tab });
    }
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
    <>
      {/* Registration List Container */}
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
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
            <div className="border-b border-gray-200">
              {/* Mobile Layout - Button First */}
              <div className="block sm:hidden p-4 space-y-3">
                {/* Row 1: Check In/Out Button (full width) */}
                <div className="w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBulkCheckIn(registration._id, !allCheckedIn);
                    }}
                    disabled={actionLoading}
                    className={`
                      w-full px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${allCheckedIn 
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                      }
                      ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {allCheckedIn ? 'Check Out All' : 'Check In All'}
                  </button>
                </div>

                {/* Row 2: Registration Number */}
                <div className="font-bold text-gray-900 text-base">
                  {registration.registrationNumber}
                </div>

                {/* Row 3: Name and Email */}
                <div>
                  <div className="font-medium text-gray-800 text-sm">
                    {registration.user?.name || registration.userId?.name || 'Former User'}
                  </div>
                  {registration.email && (
                    <div className="text-gray-600 text-xs break-all mt-1">
                      {registration.email}
                    </div>
                  )}
                </div>

                {/* Row 4: Attendee Count and Status */}
                <div className="flex items-center gap-2 text-xs">
                  <span>{registration.attendees.length} Attendee{registration.attendees.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`font-medium ${allCheckedIn ? 'text-green-600' : showPartialCheckIn ? 'text-yellow-600' : 'text-gray-700'}`}>
                    Checked In: {checkedInCount}/{registration.attendees.length}
                  </span>
                </div>

              </div>
              
              {/* Desktop Layout - Keep existing */}
              <div className="hidden sm:flex items-start justify-between gap-4 p-4">
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
            
            {/* Tab Buttons */}
            <div className="border-t border-gray-200 bg-gray-50 px-2 sm:px-4 py-2">
              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={() => handleTabClick(registration._id, 'attendees')}
                  className={`
                    px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                    ${isExpanded && (activeTab[registration._id] || 'attendees') === 'attendees'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="sm:hidden">Attendees</span>
                  <span className="hidden sm:inline">View Attendees</span>
                </button>
                {registration.formResponses && registration.formResponses.length > 0 && (
                  <button
                    onClick={() => handleTabClick(registration._id, 'attendeeInfo')}
                    className={`
                      px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                      ${isExpanded && activeTab[registration._id] === 'attendeeInfo'
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="sm:hidden">Attendee Info</span>
                    <span className="hidden sm:inline">View Attendee Information</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Tab Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 mb-4">
                {/* Attendees Tab */}
                {(activeTab[registration._id] || 'attendees') === 'attendees' && (
                  <div className="bg-gray-50 py-2 px-1 sm:px-2">
                    <div className="space-y-0.5">
                      {registration.attendees.map((attendee, idx) => (
                        <CheckInFree_SimpleAttendeeRow
                          key={attendee._id}
                          attendee={attendee}
                          ticketId={registration._id}
                          registrationNumber={registration.registrationNumber}
                          isHighlighted={searchTerm && attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Attendee Information Tab */}
                {activeTab[registration._id] === 'attendeeInfo' && registration.formResponses && (
                  <div className="p-3 sm:p-4 bg-white">
                    <div className="space-y-3">
                      {registration.formResponses.map((response, index) => (
                        <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                          <div className="font-medium text-gray-700 text-sm mb-1">{response.fieldName}:</div>
                          <div className="text-gray-600 text-sm whitespace-pre-line break-words pl-4">
                            {response.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
      
      {/* Pagination - Outside of registration list container */}
      {pagination.totalPages > 1 && (
        <div className="mt-2 px-2 sm:px-0">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
};

export default CheckInFree_AttendeeList;