// components/events/checkin/checkInFree_VirtualizedAttendeeList.jsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VariableSizeList as List } from 'react-window';
import CheckInFree_SimpleAttendeeRow from './checkInFree_SimpleAttendeeRow';
import Pagination from '@/components/Pagination';
import { 
  bulkCheckInRegistration,
  updateLocalBulkCheckIn,
  fetchEventAttendees,
  cancelRegistration,
  setCurrentPage
} from '@/store/slices/events/checkInFreeSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [activeTab, setActiveTab] = useState({}); // { registrationId: 'attendees' | 'attendeeInfo' }
  const [windowHeight, setWindowHeight] = useState(600);
  // Registration pending organiser cancellation (drives the confirm modal).
  const [pendingCancel, setPendingCancel] = useState(null);

  // Organiser cancels a whole registration, then refresh the list, stats and capacity.
  const confirmCancelRegistration = async () => {
    if (!pendingCancel) return;
    try {
      await dispatch(cancelRegistration({
        eventId: selectedEvent._id,
        ticketId: pendingCancel._id,
      })).unwrap();
      toast.success('Registration cancelled');
      setPendingCancel(null);
      dispatch(fetchEventAttendees({
        eventId: selectedEvent._id,
        page: pagination.currentPage,
        limit: pagination.limit,
        search: searchTerm,
      }));
    } catch (err) {
      toast.error(err || 'Failed to cancel registration');
      setPendingCancel(null);
    }
  };
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
  }, [attendees, expandedRegistrations, activeTab]);

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

  // Handle tab click
  const handleTabClick = useCallback((registrationId, tab) => {
    const isCurrentlyExpanded = expandedRegistrations.has(registrationId);
    const currentTab = activeTab[registrationId] || 'attendees';
    
    if (!isCurrentlyExpanded) {
      // If not expanded, expand and set the tab
      setExpandedRegistrations(prev => {
        const newExpanded = new Set(prev);
        newExpanded.add(registrationId);
        return newExpanded;
      });
      setActiveTab(prev => ({ ...prev, [registrationId]: tab }));
    } else if (currentTab === tab) {
      // If clicking the same tab, collapse
      setExpandedRegistrations(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(registrationId);
        return newExpanded;
      });
    } else {
      // If clicking different tab, just switch tabs
      setActiveTab(prev => ({ ...prev, [registrationId]: tab }));
    }
    
    // Find the index and reset item size
    const index = attendees.findIndex(r => r._id === registrationId);
    if (index !== -1 && listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, [attendees, expandedRegistrations, activeTab]);

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

  // Collapse an expanded registration when its header is clicked
  const handleHeaderCollapse = useCallback((registrationId) => {
    setExpandedRegistrations(prev => {
      const next = new Set(prev);
      next.delete(registrationId);
      return next;
    });
    const index = attendees.findIndex(r => r._id === registrationId);
    if (index !== -1 && listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, [attendees]);

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
    const currentTab = activeTab[registration._id] || 'attendees';
    const hasFormResponses = registration.formResponses?.length > 0;
    
    // Calculate height based on state
    let totalHeight = baseHeight;
    
    // Add height for tab buttons
    totalHeight += 60; // Tab buttons section height
    
    // Add expanded content height
    if (isExpanded) {
      if (currentTab === 'attendees') {
        // Add padding for the gray background container
        totalHeight += 16; // top/bottom padding of attendees container
        totalHeight += registration.attendees.length * 45; // Height per simple attendee row (reduced from 90)
      } else if (currentTab === 'attendeeInfo' && hasFormResponses) {
        // Add height for form responses
        totalHeight += 16; // Padding
        totalHeight += registration.formResponses.length * 60 + 20; // Form responses
      }
    }
    
    // Add margin bottom space for gap between cards
    totalHeight += 20; // Gap between cards
    
    return totalHeight;
  }, [attendees, expandedRegistrations, activeTab]);

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const registration = attendees[index];
    if (!registration) return null;

    const isExpanded = expandedRegistrations.has(registration._id);
    const allCheckedIn = areAllCheckedIn(registration);
    const someCheckedIn = areSomeCheckedIn(registration);
    const hasMultipleAttendees = registration.attendees.length > 1;
    const showPartialCheckIn = someCheckedIn && !allCheckedIn && hasMultipleAttendees;
    const currentTab = activeTab[registration._id] || 'attendees';

    return (
      <div style={style}>
        <div className="px-2 sm:px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Registration Header — click to collapse when expanded */}
          <div
            className={isExpanded ? 'cursor-pointer hover:bg-slate-50' : ''}
            onClick={() => isExpanded && handleHeaderCollapse(registration._id)}
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
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100' 
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                    }
                    ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {allCheckedIn ? 'Check Out All' : 'Check In All'}
                </button>
              </div>
              {!someCheckedIn && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingCancel(registration); }}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 rounded-md text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel registration
                </button>
              )}

              {/* Row 2: Registration Number */}
              <div className="font-bold text-slate-800 text-base">
                {registration.registrationNumber}
              </div>

              {/* Row 3: Name and Email */}
              <div>
                <div className="font-medium text-slate-800 text-sm">
                  {registration.user?.name || registration.userId?.name || 'Former User'}
                </div>
                {registration.email && (
                  <div className="text-slate-600 text-xs break-all mt-1">
                    {registration.email}
                  </div>
                )}
              </div>

              {/* Row 4: Attendee Count and Status */}
              <div className="flex items-center gap-2 text-xs">
                <span>{registration.attendees.length} Attendee{registration.attendees.length !== 1 ? 's' : ''}</span>
                <span className="text-slate-400">•</span>
                <span className={`font-medium ${allCheckedIn ? 'text-teal-600' : showPartialCheckIn ? 'text-slate-500' : 'text-slate-700'}`}>
                  Checked In: {registration.attendees.filter(a => a.checkedIn).length}/{registration.attendees.length}
                </span>
              </div>

            </div>
            
            {/* Desktop Layout - Keep existing */}
            <div className="hidden sm:flex items-start justify-between gap-4 p-4">
              <div className="flex-1">
                {/* Registration Number */}
                <div className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
                  {registration.registrationNumber}
                </div>
                
                {/* User Details */}
                <div className="text-xs sm:text-sm text-slate-600 mb-2">
                  <span className="font-medium text-slate-700">{registration.user?.name || registration.userId?.name || 'Former User'}</span>
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
                  <span className="text-slate-500">•</span>
                  <span className={`font-medium ${allCheckedIn ? 'text-teal-600' : showPartialCheckIn ? 'text-slate-500' : 'text-slate-600'}`}>
                    Checked In: {registration.attendees.filter(a => a.checkedIn).length}/{registration.attendees.length}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                      : 'bg-teal-700 text-white hover:bg-teal-800'
                    }
                    ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {allCheckedIn ? 'Check Out All' : 'Check In All'}
                </button>
                {!someCheckedIn && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendingCancel(registration); }}
                    disabled={actionLoading}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Tab Buttons */}
          <div className="px-2 sm:px-4 py-2">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => handleTabClick(registration._id, 'attendees')}
                className={`
                  px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                  ${isExpanded && currentTab === 'attendees'
                    ? 'bg-teal-700 text-white border border-teal-700'
                    : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                  }
                `}
              >
                Attendees
              </button>
              {registration.formResponses && registration.formResponses.length > 0 && (
                <button
                  onClick={() => handleTabClick(registration._id, 'attendeeInfo')}
                  className={`
                    px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                    ${isExpanded && currentTab === 'attendeeInfo'
                      ? 'bg-teal-700 text-white border border-teal-700'
                      : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                    }
                  `}
                >
                  Attendee Info
                </button>
              )}
            </div>
          </div>
          
          {/* Tab Content */}
          {isExpanded && (
            <div className="border-t border-slate-200 mb-4">
              {/* Attendees Tab */}
              {currentTab === 'attendees' && (
                <div className="py-2 px-1 sm:px-2">
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
              {currentTab === 'attendeeInfo' && registration.formResponses && (
                <div className="p-3 sm:p-4 bg-white">
                  <div className="space-y-3">
                    {registration.formResponses.map((response, index) => (
                      <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="font-medium text-slate-700 text-sm mb-1">{response.fieldName}:</div>
                        <div className="text-slate-600 text-sm whitespace-pre-line break-words pl-4">
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
        </div>
      </div>
    );
  };

  if (attendeesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse mx-4">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="text-center py-8 text-slate-500">
        Please select an event to view attendees
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">
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
      <div className="px-4 pb-2 text-sm text-slate-600">
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

      {/* Organiser cancel confirmation */}
      <ConfirmModal
        isOpen={!!pendingCancel}
        onConfirm={confirmCancelRegistration}
        onCancel={() => setPendingCancel(null)}
        isLoading={actionLoading}
        title="Cancel this registration?"
        message={pendingCancel ? `This cancels registration ${pendingCancel.registrationNumber || ''} and frees ${pendingCancel.attendees?.length || 0} spot${(pendingCancel.attendees?.length || 0) === 1 ? '' : 's'}. This cannot be undone.` : ''}
        confirmText="Cancel registration"
        cancelText="Keep it"
      />
    </div>
  );
};

export default CheckInFree_VirtualizedAttendeeList;