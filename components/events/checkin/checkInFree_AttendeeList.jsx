// components/events/checkin/checkInFree_AttendeeList.jsx

'use client';

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import CheckInFree_SimpleAttendeeRow from './checkInFree_SimpleAttendeeRow';
import VerticalScrollSlider from '@/components/shared/VerticalScrollSlider';
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
  // Registration pending organiser cancellation (drives the confirm modal).
  const [pendingCancel, setPendingCancel] = useState(null);

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

  // Collapse an expanded registration when its header is clicked
  const handleHeaderCollapse = (registrationId) => {
    setExpandedRegistrations(prev => {
      const next = new Set(prev);
      next.delete(registrationId);
      return next;
    });
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
          <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse">
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

  if (displayedAttendees.length === 0) {
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
        const bookerName = registration.user?.name || registration.userId?.name;
        const hasBookerInfo = !!(bookerName || registration.mobile || registration.email);
        const hasFormResponses = registration.formResponses && registration.formResponses.length > 0;
        
        return (
          <div 
            key={registration._id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Registration Header — click to collapse when expanded */}
            <div
              className={isExpanded ? 'cursor-pointer hover:bg-slate-50' : ''}
              onClick={() => isExpanded && handleHeaderCollapse(registration._id)}
            >
              {/* Mobile Layout */}
              <div className="block sm:hidden p-4 space-y-3">
                {/* Row 1: Reg Number + Bulk Action Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-800 text-base">
                    {registration.registrationNumber}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkCheckIn(registration._id, !allCheckedIn);
                      }}
                      disabled={actionLoading}
                      className={`
                        px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                        ${allCheckedIn
                          ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                        }
                        ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {allCheckedIn
                        ? `Check Out${hasMultipleAttendees ? ` All (${checkedInCount}/${registration.attendees.length})` : ''}`
                        : `Check In${hasMultipleAttendees ? ` All (${checkedInCount}/${registration.attendees.length})` : ''}`}
                    </button>
                    {!someCheckedIn && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingCancel(registration); }}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
              
              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center justify-between gap-4 p-4">
                <div className="font-semibold text-slate-800 text-sm sm:text-base">
                  {registration.registrationNumber}
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
                    {allCheckedIn
                      ? `Check Out${hasMultipleAttendees ? ` All (${checkedInCount}/${registration.attendees.length})` : ''}`
                      : `Check In${hasMultipleAttendees ? ` All (${checkedInCount}/${registration.attendees.length})` : ''}`}
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
            <div className="px-4 pb-3">
              <div className="flex gap-1 sm:gap-2">
                {hasBookerInfo && (
                  <button
                    onClick={() => handleTabClick(registration._id, 'booker')}
                    className={`
                      px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                      ${isExpanded && activeTab[registration._id] === 'booker'
                        ? 'bg-teal-700 text-white border border-teal-700'
                        : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                      }
                    `}
                  >
                    Booked by
                  </button>
                )}
                <button
                  onClick={() => handleTabClick(registration._id, 'attendees')}
                  className={`
                    px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                    ${isExpanded && (activeTab[registration._id] || 'attendees') === 'attendees'
                      ? 'bg-teal-700 text-white border border-teal-700'
                      : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                    }
                  `}
                >
                  Attendees
                </button>
                {hasFormResponses && (
                  <button
                    onClick={() => handleTabClick(registration._id, 'attendeeInfo')}
                    className={`
                      px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                      ${isExpanded && activeTab[registration._id] === 'attendeeInfo'
                        ? 'bg-teal-700 text-white border border-teal-700'
                        : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                      }
                    `}
                  >
                    Information
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            {isExpanded && (
              <div className="mb-4">
                {/* Booked by Tab */}
                {activeTab[registration._id] === 'booker' && hasBookerInfo && (
                  <div className="px-4 pb-3 space-y-2 text-sm">
                    {/* Row 1: Name + Phone */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaUser className="text-teal-600 shrink-0" size={13} title="Name" aria-label="Name" />
                        {bookerName ? (
                          <span className="truncate">{bookerName}</span>
                        ) : (
                          <span className="text-red-600">Deleted User</span>
                        )}
                      </div>
                      {registration.mobile && (
                        <div className="flex items-center gap-2 min-w-0">
                          <FaPhone className="text-teal-600 shrink-0" size={13} title="Phone" aria-label="Phone" />
                          <a href={`tel:${registration.mobile}`} className="hover:text-slate-900 underline">
                            {registration.mobile}
                          </a>
                        </div>
                      )}
                    </div>
                    {/* Row 2: Email */}
                    {registration.email && (
                      <div className="flex items-center gap-2 text-slate-700 min-w-0">
                        <FaEnvelope className="text-teal-600 shrink-0" size={13} title="Email" aria-label="Email" />
                        <a href={`mailto:${registration.email}`} className="hover:text-slate-900 underline break-all">
                          {registration.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Attendees Tab */}
                {(activeTab[registration._id] || 'attendees') === 'attendees' && (
                  <div className="px-4 pb-3">
                    <VerticalScrollSlider maxHeightClass="max-h-44 md:max-h-60">
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
                    </VerticalScrollSlider>
                  </div>
                )}

                {/* Information Tab */}
                {activeTab[registration._id] === 'attendeeInfo' && hasFormResponses && (
                  <div className="px-4 pb-3">
                    <VerticalScrollSlider maxHeightClass="max-h-48 md:max-h-64">
                      <div className="space-y-3 text-sm">
                        {registration.formResponses.map((response, index) => (
                          <div key={index} className="border-b last:border-0 pb-3 last:pb-0">
                            <div className="font-semibold text-slate-800 mb-1">{response.fieldName}:</div>
                            <div className="text-slate-600 whitespace-pre-line break-words pl-4">
                              {response.response}
                            </div>
                          </div>
                        ))}
                      </div>
                    </VerticalScrollSlider>
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-3">
          <div className="text-sm text-slate-600 text-center mb-2">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} registrations
          </div>
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
        title="Are you sure?"
        confirmText="Cancel registration"
        cancelText="Keep it"
      />
    </>
  );
};

export default CheckInFree_AttendeeList;