// components/events/checkin/checkInPaid_VirtualizedAttendeeList.jsx

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VariableSizeList as List } from 'react-window';
import CheckInPaid_SimpleTicketRow from './checkInPaid_SimpleTicketRow';
import Pagination from '@/components/Pagination';
import { 
  fetchPaidEventAttendees, 
  setCurrentPage,
  bulkCheckInPaidTicket,
  updateLocalBulkCheckIn 
} from '@/store/slices/events/checkInPaidSlice';
import { toast } from 'react-toastify';

const CheckInPaid_VirtualizedAttendeeList = () => {
  const dispatch = useDispatch();
  const { 
    attendees, 
    searchTerm, 
    selectedEvent, 
    attendeesLoading,
    actionLoading,
    pagination 
  } = useSelector((state) => state.checkInPaid);
  
  const [windowHeight, setWindowHeight] = useState(600);
  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { invoiceNumber: 'tickets' | 'attendeeInfo' }
  const listRef = useRef();

  // Group tickets by invoice number
  const groupedByInvoice = useMemo(() => {
    const groups = {};
    attendees.forEach(ticket => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!groups[invoiceNumber]) {
        groups[invoiceNumber] = [];
      }
      groups[invoiceNumber].push(ticket);
    });
    return groups;
  }, [attendees]);

  // Convert grouped object to array for virtualization
  const invoiceGroups = useMemo(() => {
    return Object.entries(groupedByInvoice).map(([invoiceNumber, tickets]) => ({
      invoiceNumber,
      tickets,
      representative: tickets[0], // Use first ticket for buyer info
      totalAmount: tickets.reduce((sum, t) => sum + (t.priceDetails?.totalPrice || 0), 0),
      totalAttendees: tickets.reduce((sum, t) => sum + t.attendees.length, 0),
      checkedInAttendees: tickets.reduce((sum, t) => 
        sum + t.attendees.filter(a => a.checkedIn).length, 0
      )
    }));
  }, [groupedByInvoice]);

  // Calculate window height for virtualization
  useEffect(() => {
    const calculateHeight = () => {
      const height = window.innerHeight - 400; // Account for header and other elements
      setWindowHeight(Math.max(400, Math.min(height, 800)));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, []);

  // Reset item sizes when attendees or expanded state changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [attendees, expandedInvoices]);

  // Handle page change
  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
    dispatch(fetchPaidEventAttendees({ 
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

  // Toggle invoice expansion
  const toggleInvoice = useCallback((invoiceNumber) => {
    setExpandedInvoices(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(invoiceNumber)) {
        newExpanded.delete(invoiceNumber);
      } else {
        newExpanded.add(invoiceNumber);
      }
      return newExpanded;
    });
    
    // Find the index and reset item size
    const index = invoiceGroups.findIndex(group => group.invoiceNumber === invoiceNumber);
    if (index !== -1 && listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, [invoiceGroups]);

  // Handle tab click
  const handleTabClick = useCallback((invoiceNumber, tab) => {
    const isCurrentlyExpanded = expandedInvoices.has(invoiceNumber);
    const currentTab = activeTab[invoiceNumber] || 'tickets';
    
    if (!isCurrentlyExpanded) {
      // If not expanded, expand and set the tab
      setExpandedInvoices(prev => {
        const newExpanded = new Set(prev);
        newExpanded.add(invoiceNumber);
        return newExpanded;
      });
      setActiveTab(prev => ({ ...prev, [invoiceNumber]: tab }));
    } else if (currentTab === tab) {
      // If clicking the same tab, collapse
      setExpandedInvoices(prev => {
        const newExpanded = new Set(prev);
        newExpanded.delete(invoiceNumber);
        return newExpanded;
      });
    } else {
      // If clicking different tab, just switch tabs
      setActiveTab(prev => ({ ...prev, [invoiceNumber]: tab }));
    }
    
    // Find the index and reset item size
    const index = invoiceGroups.findIndex(group => group.invoiceNumber === invoiceNumber);
    if (index !== -1 && listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }, [invoiceGroups, expandedInvoices, activeTab]);

  // Calculate item height for invoice groups
  const getItemSize = useCallback((index) => {
    const invoiceGroup = invoiceGroups[index];
    if (!invoiceGroup) return 120;
    
    const isMobile = window.innerWidth < 640;
    const isExpanded = expandedInvoices.has(invoiceGroup.invoiceNumber);
    
    // Base height for invoice header (mobile needs more for stacked layout)
    let height = isMobile ? 220 : 100; // Increased mobile height to match checkInFree pattern
    
    // Add height for tab buttons section (always visible)
    height += 60; // Tab buttons section height
    
    // Add height for expanded content
    if (isExpanded) {
      const currentTab = activeTab[invoiceGroup.invoiceNumber] || 'tickets';
      
      if (currentTab === 'tickets') {
        // Add padding for expanded container + mb-4
        height += 32; // 16px padding + 16px mb-4
        // Add height for simple ticket rows
        height += invoiceGroup.tickets.length * 60; // Simple ticket row height
        // Add pb-4 for tickets tab
        height += 16;
        
        // Extra height for mobile to prevent overlap
        if (isMobile) {
          height += 20;
        }
      } else if (currentTab === 'attendeeInfo' && invoiceGroup.representative.formResponses?.length > 0) {
        // Add height for form responses + mb-4
        height += 32; // 16px padding + 16px mb-4
        height += invoiceGroup.representative.formResponses.length * 60 + 20;
        // Add extra spacing for attendeeInfo tab
        height += 20; // Additional gap for better spacing
        
        // Extra height for mobile to prevent overlap
        if (isMobile) {
          height += 20;
        }
      }
    }
    
    // Add bottom margin for gap between cards
    height += 20;
    
    return height;
  }, [invoiceGroups, expandedInvoices, activeTab]);

  // Handle bulk check-in for all tickets in an invoice
  const handleBulkCheckInInvoice = useCallback(async (tickets, checkIn) => {
    if (actionLoading || !selectedEvent) return;

    try {
      // Process each ticket in the invoice
      for (const ticket of tickets) {
        await dispatch(bulkCheckInPaidTicket({
          eventId: selectedEvent._id,
          ticketId: ticket._id,
          checkIn
        })).unwrap();
        
        // Update local state
        dispatch(updateLocalBulkCheckIn({
          ticketId: ticket._id,
          checkedIn: checkIn,
          checkInTime: checkIn ? new Date().toISOString() : null
        }));
      }
      
      toast.success(`All tickets in invoice ${checkIn ? 'checked in' : 'checked out'}`);
    } catch (error) {
      toast.error(error || 'Bulk operation failed');
    }
  }, [selectedEvent, actionLoading, dispatch]);

  // Check if all attendees in an invoice group are checked in
  const areAllCheckedIn = (tickets) => {
    return tickets.every(ticket => 
      ticket.attendees.every(att => att.checkedIn)
    );
  };

  // Check if some attendees in an invoice group are checked in
  const areSomeCheckedIn = (tickets) => {
    return tickets.some(ticket => 
      ticket.attendees.some(att => att.checkedIn)
    );
  };

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const invoiceGroup = invoiceGroups[index];
    if (!invoiceGroup) return null;

    const { invoiceNumber, tickets, representative, totalAttendees, checkedInAttendees } = invoiceGroup;
    const isExpanded = expandedInvoices.has(invoiceNumber);
    const allCheckedIn = areAllCheckedIn(tickets);
    const someCheckedIn = areSomeCheckedIn(tickets);
    const showPartialCheckIn = someCheckedIn && !allCheckedIn;

    return (
      <div style={style} className="px-2 sm:px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Invoice Header */}
          <div 
            className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleInvoice(invoiceNumber)}
          >
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {invoiceNumber}
                </h3>
                {showPartialCheckIn && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Partial
                  </span>
                )}
                {allCheckedIn && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    All In
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-900 mb-1">
                {representative.buyer?.firstName} {representative.buyer?.lastName}
              </div>
              
              <div className="text-sm text-gray-600 mb-1">
                {representative.buyer?.email}
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {representative.buyer?.phone}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Tickets: {tickets.length}</span>
                <span className="font-medium">Checked In: {checkedInAttendees}/{totalAttendees}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkCheckInInvoice(tickets, !allCheckedIn);
                  }}
                  disabled={actionLoading}
                  className={`
                    px-4 py-2 rounded font-medium text-sm transition-colors flex-1 mr-2
                    ${allCheckedIn 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                    }
                    ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {actionLoading ? 'Processing...' : (allCheckedIn ? 'Check Out All' : 'Check In All')}
                </button>
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

            {/* Desktop Layout */}
            <div className="hidden sm:flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {invoiceNumber}
                  </h3>
                  {showPartialCheckIn && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Partial Check-in
                    </span>
                  )}
                  {allCheckedIn && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      All Checked In
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Tickets:</span> {tickets.length}
                  </div>
                  <div>
                    <span className="font-medium">Checked In:</span> {checkedInAttendees} / {totalAttendees}
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {representative.buyer?.firstName} {representative.buyer?.lastName} • {representative.buyer?.email} • {representative.buyer?.phone}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBulkCheckInInvoice(tickets, !allCheckedIn);
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
          
          {/* Tab Buttons */}
          <div className="border-t border-gray-200 bg-gray-50 px-2 sm:px-4 py-2">
            <div className="flex gap-1 sm:gap-2">
              <button
                onClick={() => handleTabClick(invoiceNumber, 'tickets')}
                className={`
                  px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                  ${isExpanded && (activeTab[invoiceNumber] || 'tickets') === 'tickets'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="sm:hidden">Tickets</span>
                <span className="hidden sm:inline">View Tickets</span>
              </button>
              {representative.formResponses && representative.formResponses.length > 0 && (
                <button
                  onClick={() => handleTabClick(invoiceNumber, 'attendeeInfo')}
                  className={`
                    px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                    ${isExpanded && activeTab[invoiceNumber] === 'attendeeInfo'
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
              {/* Tickets Tab */}
              {(activeTab[invoiceNumber] || 'tickets') === 'tickets' && (
                <div className="bg-gray-50 pb-4">
                  <div className="p-2 sm:p-3 space-y-1">
                    {tickets.map((ticket) => (
                      <CheckInPaid_SimpleTicketRow 
                        key={ticket._id} 
                        ticket={ticket}
                        eventId={selectedEvent._id}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Attendee Information Tab */}
              {activeTab[invoiceNumber] === 'attendeeInfo' && representative.formResponses && (
                <div className="p-3 sm:p-4 bg-white">
                  <div className="space-y-3">
                    {representative.formResponses.map((response, index) => (
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
      </div>
    );
  };

  if (!selectedEvent) {
    return (
      <div className="text-gray-500 text-center py-8">
        Select an event to view ticket holders
      </div>
    );
  }

  if (attendeesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        {searchTerm 
          ? `No tickets found matching "${searchTerm}"`
          : 'No tickets sold for this event yet'
        }
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
          return `Showing ${start}-${end} of ${pagination.totalCount} tickets in ${invoiceGroups.length} invoices`;
        })()}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Virtualized List */}
      <List
        ref={listRef}
        height={windowHeight}
        itemCount={invoiceGroups.length}
        itemSize={getItemSize}
        width="100%"
        overscanCount={1}
      >
        {Row}
      </List>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4">
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

export default CheckInPaid_VirtualizedAttendeeList;