// components/events/checkin/checkInPaid_AttendeeList.jsx

'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CheckInPaid_AttendeeCard from './checkInPaid_AttendeeCard';
import Pagination from '@/components/Pagination';
import { fetchPaidEventAttendees, setCurrentPage } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaid_AttendeeList = () => {
  const dispatch = useDispatch();
  const { 
    attendees, 
    searchTerm, 
    selectedEvent, 
    attendeesLoading,
    pagination 
  } = useSelector((state) => state.checkInPaid);

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
      <div className="pb-2 text-sm text-gray-600">
        Showing {attendees.length} of {pagination.totalCount} tickets
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
      
      <div className="space-y-4">
        {attendees.map((ticket) => (
          <CheckInPaid_AttendeeCard 
            key={ticket._id} 
            ticket={ticket}
            eventId={selectedEvent._id}
          />
        ))}
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

export default CheckInPaid_AttendeeList;