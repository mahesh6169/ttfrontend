// components/events/checkin/checkInPaid_GroupedAttendeeList.jsx

'use client';

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CheckInPaid_SimpleTicketRow from './checkInPaid_SimpleTicketRow';
import Pagination from '@/components/Pagination';
import { 
  fetchPaidEventAttendees, 
  setCurrentPage,
  bulkCheckInPaidTicket,
  updateLocalBulkCheckIn 
} from '@/store/slices/events/checkInPaidSlice';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const CheckInPaid_GroupedAttendeeList = () => {
  const dispatch = useDispatch();
  const { 
    attendees, 
    searchTerm, 
    selectedEvent, 
    attendeesLoading,
    pagination,
    actionLoading
  } = useSelector((state) => state.checkInPaid);

  const [expandedInvoices, setExpandedInvoices] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { invoiceNumber: 'tickets' | 'attendeeInfo' | 'buyerInfo' }

  // Group tickets by invoice number, each group in ascending ticket-number order
  // (TKT-CODE-0001, 0002, ... - never the fetch's descending order).
  const groupedByInvoice = React.useMemo(() => {
    const groups = {};
    attendees.forEach(ticket => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!groups[invoiceNumber]) {
        groups[invoiceNumber] = [];
      }
      groups[invoiceNumber].push(ticket);
    });
    Object.values(groups).forEach(list =>
      list.sort((a, b) => String(a.ticketNumber || '').localeCompare(String(b.ticketNumber || '')))
    );
    return groups;
  }, [attendees]);

  // Handle page change
  const handlePageChange = (newPage) => {
    dispatch(setCurrentPage(newPage));
    dispatch(fetchPaidEventAttendees({ 
      eventId: selectedEvent._id, 
      page: newPage, 
      limit: pagination.limit,
      search: searchTerm 
    }));
  };

  // Handle tab click
  const handleTabClick = (invoiceNumber, tab) => {
    const isCurrentlyExpanded = expandedInvoices.has(invoiceNumber);
    const currentTab = activeTab[invoiceNumber] || 'tickets';
    
    if (!isCurrentlyExpanded) {
      // If not expanded, expand and set the tab
      const newExpanded = new Set(expandedInvoices);
      newExpanded.add(invoiceNumber);
      setExpandedInvoices(newExpanded);
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    } else if (currentTab === tab) {
      // If clicking the same tab, collapse
      const newExpanded = new Set(expandedInvoices);
      newExpanded.delete(invoiceNumber);
      setExpandedInvoices(newExpanded);
    } else {
      // If clicking different tab, just switch tabs
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    }
  };

  // Collapse an expanded invoice when its header is clicked
  const handleHeaderCollapse = (invoiceNumber) => {
    setExpandedInvoices(prev => {
      const next = new Set(prev);
      next.delete(invoiceNumber);
      return next;
    });
  };

  // Handle bulk check-in for all tickets in an invoice
  const handleBulkCheckInInvoice = async (tickets, checkIn) => {
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
  };

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

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (!selectedEvent) {
    return (
      <div className="text-slate-500 text-center py-8">
        Select an event to view attendees
      </div>
    );
  }

  if (attendeesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-slate-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (attendees.length === 0) {
    return (
      <div className="text-slate-500 text-center py-8">
        {searchTerm 
          ? `No tickets found matching "${searchTerm}"`
          : 'No tickets sold for this event yet'
        }
      </div>
    );
  }

  return (
    <>
      {/* Invoice List Container */}
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        {Object.entries(groupedByInvoice).map(([invoiceNumber, tickets]) => {
          const isExpanded = expandedInvoices.has(invoiceNumber);
          const allCheckedIn = areAllCheckedIn(tickets);
          const someCheckedIn = areSomeCheckedIn(tickets);
          const hasMultipleTickets = tickets.length > 1;
          const showPartialCheckIn = someCheckedIn && !allCheckedIn;

          // Bulk action: all in -> "Check Out All" (checks out everyone); partly in -> "Check In
          // Remaining" (checks in only the not-yet-checked tickets); none in -> "Check In All".
          const remainingTickets = tickets.filter(t => !t.attendees.every(att => att.checkedIn));
          const bulkCheckIn = !allCheckedIn;                       // true = checking in, false = checking out
          const ticketsForAction = allCheckedIn ? tickets : remainingTickets;
          const bulkActionLabel = allCheckedIn
            ? 'Check Out All'
            : (showPartialCheckIn ? 'Check In Remaining' : 'Check In All');
          
          // Get representative ticket for buyer info
          const representative = tickets[0];
          const totalAmount = tickets.reduce((sum, t) => sum + (t.priceDetails?.totalPrice || 0), 0);
          const totalAttendees = tickets.reduce((sum, t) => sum + t.attendees.length, 0);
          const checkedInAttendees = tickets.reduce((sum, t) => 
            sum + t.attendees.filter(a => a.checkedIn).length, 0
          );
          
          return (
            <div 
              key={invoiceNumber} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* Invoice Header — click to collapse when expanded */}
              <div
                className={`p-3 sm:p-4 ${isExpanded ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                onClick={() => isExpanded && handleHeaderCollapse(invoiceNumber)}
              >
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  {/* Row 1: Buyer Name and Action Button */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">
                      {representative.buyer?.firstName} {representative.buyer?.lastName}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkCheckInInvoice(ticketsForAction, bulkCheckIn);
                      }}
                      disabled={actionLoading}
                      className={`
                        px-3 py-1 rounded text-xs font-medium transition-colors
                        ${allCheckedIn
                          ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                        }
                        ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {actionLoading ? 'Processing...' : bulkActionLabel}
                    </button>
                  </div>
                  
                  {/* Row 2: Tickets and Checked In Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>Tickets: {tickets.length}</span>
                    <span>Checked In: {checkedInAttendees} / {totalAttendees}</span>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  {/* Row 1: Buyer Name and Action Button */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-800">
                      {representative.buyer?.firstName} {representative.buyer?.lastName}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkCheckInInvoice(ticketsForAction, bulkCheckIn);
                      }}
                      disabled={actionLoading}
                      className={`
                        px-4 py-2 rounded text-sm font-medium transition-colors
                        ${allCheckedIn
                          ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                          : 'bg-teal-700 text-white hover:bg-teal-800'
                        }
                        ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {actionLoading ? 'Processing...' : bulkActionLabel}
                    </button>
                  </div>
                  
                  {/* Row 2: Tickets and Checked In Stats */}
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>Tickets: {tickets.length}</span>
                    <span>Checked In: {checkedInAttendees} / {totalAttendees}</span>
                  </div>
                </div>
              </div>
              
              {/* Tab Buttons */}
              <div className="px-2 sm:px-4 py-2">
                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleTabClick(invoiceNumber, 'tickets')}
                    className={`
                      px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                      ${isExpanded && (activeTab[invoiceNumber] || 'tickets') === 'tickets'
                        ? 'bg-teal-700 text-white border border-teal-700'
                        : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                      }
                    `}
                  >
                    Tickets
                  </button>
                  {representative.formResponses && representative.formResponses.length > 0 && (
                    <button
                      onClick={() => handleTabClick(invoiceNumber, 'attendeeInfo')}
                      className={`
                        px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                        ${isExpanded && activeTab[invoiceNumber] === 'attendeeInfo'
                          ? 'bg-teal-700 text-white border border-teal-700'
                          : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                        }
                      `}
                    >
                      Attendee Info
                    </button>
                  )}
                  <button
                    onClick={() => handleTabClick(invoiceNumber, 'buyerInfo')}
                    className={`
                      px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none
                      ${isExpanded && activeTab[invoiceNumber] === 'buyerInfo'
                        ? 'bg-teal-700 text-white border border-teal-700'
                        : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                      }
                    `}
                  >
                    Buyer Info
                  </button>
                </div>
              </div>
              
              {/* Tab Content */}
              {isExpanded && (
                <div className="border-t border-slate-200 mb-4">
                  {/* Tickets Tab */}
                  {(activeTab[invoiceNumber] || 'tickets') === 'tickets' && (
                    <div className="pb-4">
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
                            <div className="font-medium text-slate-700 text-sm mb-1">{response.fieldName}:</div>
                            <div className="text-slate-600 text-sm whitespace-pre-line break-words pl-4">
                              {response.response}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Buyer Information Tab */}
                  {activeTab[invoiceNumber] === 'buyerInfo' && (
                    <div className="p-3 sm:p-4 bg-white">
                      <div className="space-y-3">
                        <div className="border-b pb-3">
                          <div className="font-medium text-slate-700 text-sm mb-1">Name:</div>
                          <div className="text-slate-600 text-sm pl-4">
                            {representative.buyer?.firstName} {representative.buyer?.lastName}
                          </div>
                        </div>
                        <div className="border-b pb-3">
                          <div className="font-medium text-slate-700 text-sm mb-1">Email:</div>
                          <div className="text-slate-600 text-sm pl-4">
                            {representative.buyer?.email}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-700 text-sm mb-1">Phone:</div>
                          <div className="text-slate-600 text-sm pl-4">
                            {representative.buyer?.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-3">
          <div className="text-sm text-slate-600 text-center mb-2">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tickets
          </div>
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

export default CheckInPaid_GroupedAttendeeList;