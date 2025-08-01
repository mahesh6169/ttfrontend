// components/events/checkin/checkInPaid_AttendeeList.jsx

'use client';

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import CheckInPaid_AttendeeCard from './checkInPaid_AttendeeCard';

const CheckInPaid_AttendeeList = () => {
  const { 
    attendees, 
    searchTerm, 
    selectedEvent, 
    attendeesLoading 
  } = useSelector((state) => state.checkInPaid);

  // Filter attendees based on search term
  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees;

    const searchLower = searchTerm.toLowerCase();
    
    return attendees.filter(ticket => {
      // Search in ticket number and invoice number
      if (ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
          ticket.invoiceNumber?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in buyer info
      if (ticket.buyer?.firstName?.toLowerCase().includes(searchLower) ||
          ticket.buyer?.lastName?.toLowerCase().includes(searchLower) ||
          ticket.buyer?.email?.toLowerCase().includes(searchLower) ||
          ticket.buyer?.phone?.includes(searchTerm)) {
        return true;
      }

      // Search in user info
      if (ticket.user?.name?.toLowerCase().includes(searchLower) ||
          ticket.user?.email?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search in attendee names
      return ticket.attendees?.some(attendee => 
        attendee.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [attendees, searchTerm]);

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

  if (filteredAttendees.length === 0) {
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
    <div className="space-y-4">
      {filteredAttendees.map((ticket) => (
        <CheckInPaid_AttendeeCard 
          key={ticket._id} 
          ticket={ticket}
          eventId={selectedEvent._id}
        />
      ))}
    </div>
  );
};

export default CheckInPaid_AttendeeList;