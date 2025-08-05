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

  // Group tickets by invoice number
  const groupedByInvoice = React.useMemo(() => {
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

  // Toggle invoice expansion
  const toggleInvoice = (invoiceNumber) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceNumber)) {
      newExpanded.delete(invoiceNumber);
    } else {
      newExpanded.add(invoiceNumber);
    }
    setExpandedInvoices(newExpanded);
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
      <div className="text-gray-500 text-center py-8">
        Select an event to view attendees
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
      <div className="pb-2 text-sm text-gray-600">
        Showing {attendees.length} of {pagination.totalCount} tickets
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
      
      <div className="space-y-4">
        {Object.entries(groupedByInvoice).map(([invoiceNumber, tickets]) => {
          const isExpanded = expandedInvoices.has(invoiceNumber);
          const allCheckedIn = areAllCheckedIn(tickets);
          const someCheckedIn = areSomeCheckedIn(tickets);
          const hasMultipleTickets = tickets.length > 1;
          const showPartialCheckIn = someCheckedIn && !allCheckedIn;
          
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
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Invoice Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleInvoice(invoiceNumber)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Invoice: {invoiceNumber}
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
                        <span className="font-medium">Tickets:</span> {tickets.length} ({totalAttendees} attendees)
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
                    {/* Bulk Check-in/out Button */}
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
              
              {/* Tickets List */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-3 space-y-1">
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
            </div>
          );
        })}
      </div>
      
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

export default CheckInPaid_GroupedAttendeeList;