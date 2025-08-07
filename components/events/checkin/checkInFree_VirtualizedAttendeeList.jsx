// components/events/checkin/checkInFree_VirtualizedAttendeeList.jsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VariableSizeList as List } from 'react-window';
import CheckInFree_AttendeeCard from './checkInFree_AttendeeCard';
import Pagination from '@/components/Pagination';
import { 
  bulkCheckInRegistration,
  updateLocalBulkCheckIn,
  fetchEventAttendees,
  setCurrentPage
} from '@/store/slices/events/checkInFreeSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CheckInFree_VirtualizedAttendeeList = () => {
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
  const [windowHeight, setWindowHeight] = useState(600);
  const listRef = useRef();

  // Calculate window height for virtualization and detect mobile/desktop changes
  useEffect(() => {
    const handleResize = () => {
      // Optimized calculation for maximum available height
      // Reduced heights: Header (50px) + Event selector (70px) + Event details (80px) + Stats (70px) + Search (70px) + padding (40px)
      const otherElementsHeight = window.innerWidth < 640 ? 380 : 400; // Much less space used
      const availableHeight = window.innerHeight - otherElementsHeight;
      
      // Allow list to use more space, with reasonable minimum
      setWindowHeight(Math.max(300, availableHeight));
      
      // Reset item sizes when switching between mobile/desktop
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset item sizes when attendees or expansion states change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [attendees, expandedRegistrations, showFormResponses]);

  // Handle page change
  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
    dispatch(fetchEventAttendees({ 
      eventId: selectedEvent._id, 
      page: newPage, 
      limit: pagination.limit,
      search: searchTerm 
    }));
    // Scroll to top of list
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  };

  // Toggle registration expansion
  const toggleRegistration = useCallback((registrationId) => {
    setExpandedRegistrations(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(registrationId)) {
        newExpanded.delete(registrationId);
      } else {
        newExpanded.add(registrationId);
      }
      return newExpanded;
    });
  }, []);

  // Toggle form responses
  const toggleFormResponses = useCallback((registrationId) => {
    setShowFormResponses(prev => {
      const newShow = new Set(prev);
      if (newShow.has(registrationId)) {
        newShow.delete(registrationId);
      } else {
        newShow.add(registrationId);
      }
      return newShow;
    });
  }, []);

  // Handle bulk check-in/out for a registration
  const handleBulkCheckIn = useCallback(async (ticketId, checkIn) => {
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
  }, [selectedEvent, actionLoading, dispatch]);

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

  // Calculate item height based on expanded state
  const getItemSize = useCallback((index) => {
    const registration = attendees[index];
    if (!registration) return 120;
    
    // Check if mobile view (screen width < 640px)
    const isMobile = window.innerWidth < 640;
    
    // Base height differs for mobile (vertical stacking) vs desktop (horizontal layout)
    const baseHeight = isMobile ? 200 : 100; // Mobile needs more height for stacked layout
    const isExpanded = expandedRegistrations.has(registration._id);
    const showingFormResponses = showFormResponses.has(registration._id);
    const hasFormResponses = registration.formResponses?.length > 0;
    
    // Calculate height based on state
    let totalHeight = baseHeight;
    
    // Add attendee list height if expanded
    if (isExpanded) {
      // Add padding for the gray background container
      totalHeight += 16; // top/bottom padding of attendees container
      totalHeight += registration.attendees.length * 90; // Height per attendee row (increased for better spacing)
    }
    
    // Add form responses section height if present
    if (hasFormResponses) {
      totalHeight += 60; // Height for the "View Attendee Information" button with padding
      if (showingFormResponses) {
        totalHeight += registration.formResponses.length * 40 + 20; // Height per form response + padding
      }
    }
    
    // Add margin bottom space for gap between cards
    totalHeight += 20; // Increased gap between cards for better separation
    
    return totalHeight;
  }, [attendees, expandedRegistrations, showFormResponses]);

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const registration = attendees[index];
    if (!registration) return null;

    const isExpanded = expandedRegistrations.has(registration._id);
    const allCheckedIn = areAllCheckedIn(registration);
    const someCheckedIn = areSomeCheckedIn(registration);
    const hasMultipleAttendees = registration.attendees.length > 1;
    const showPartialCheckIn = someCheckedIn && !allCheckedIn && hasMultipleAttendees;
    const showingFormResponses = showFormResponses.has(registration._id);

    return (
      <div style={style}>
        <div className="px-2 sm:px-4 pb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Registration Header - New Layout */}
          <div 
            className="border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleRegistration(registration._id)}
          >
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
                  Checked In: {registration.attendees.filter(a => a.checkedIn).length}/{registration.attendees.length}
                </span>
              </div>

              {/* Row 5: View Attendees Link */}
              <div>
                <span className="text-teal-600 hover:text-teal-700 underline text-xs font-medium">
                  {isExpanded ? 'Hide attendees' : 'View attendees'}
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
                    Checked In: {registration.attendees.filter(a => a.checkedIn).length}/{registration.attendees.length}
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
                  <CheckInFree_AttendeeCard
                    attendee={attendee}
                    ticketId={registration._id}
                    registrationNumber={registration.registrationNumber}
                    formResponses={[]}
                    isHighlighted={searchTerm && attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Attendee Information (Form Responses) - Show for both mobile and desktop */}
          {registration.formResponses && registration.formResponses.length > 0 && (
            <div className="px-4 pb-2 pt-2 bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFormResponses(registration._id);
                }}
                className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 mb-2"
              >
                <svg 
                  className={`w-3 h-3 transition-transform ${showingFormResponses ? 'rotate-90' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showingFormResponses ? 'Hide' : 'View'} Attendee Information
              </button>
              
              {/* Form Responses Display */}
              {showingFormResponses && (
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
        </div>
      </div>
    );
  };

  if (attendeesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse mx-4">
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

  if (attendees.length === 0) {
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
    <div>
      {/* Stats summary */}
      <div className="px-4 pb-2 text-sm text-gray-600">
        {(() => {
          const start = (pagination.currentPage - 1) * pagination.limit + 1;
          const end = Math.min(start + attendees.length - 1, pagination.totalCount);
          return `Showing ${start}-${end} of ${pagination.totalCount} registrations`;
        })()}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Virtualized List */}
      <List
        ref={listRef}
        height={windowHeight}
        itemCount={attendees.length}
        itemSize={getItemSize}
        width="100%"
        overscanCount={2}
      >
        {Row}
      </List>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-2 px-4">
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

export default CheckInFree_VirtualizedAttendeeList;