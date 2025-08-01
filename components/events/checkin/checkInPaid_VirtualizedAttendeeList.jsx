// components/events/checkin/checkInPaid_VirtualizedAttendeeList.jsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { VariableSizeList as List } from 'react-window';
import CheckInPaid_AttendeeCard from './checkInPaid_AttendeeCard';
import Pagination from '@/components/Pagination';
import { fetchPaidEventAttendees, setCurrentPage } from '@/store/slices/events/checkInPaidSlice';

const CheckInPaid_VirtualizedAttendeeList = () => {
  const dispatch = useDispatch();
  const { 
    attendees, 
    searchTerm, 
    selectedEvent, 
    attendeesLoading,
    pagination 
  } = useSelector((state) => state.checkInPaid);
  
  const [windowHeight, setWindowHeight] = useState(600);
  const listRef = useRef();

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

  // Reset item sizes when attendees change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
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
    // Scroll to top of list
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  };

  // Calculate item height - paid tickets are typically larger due to more info
  const getItemSize = useCallback((index) => {
    const ticket = attendees[index];
    if (!ticket) return 300; // Base height for paid tickets
    
    // Base calculation: header + buyer info + attendees
    const baseHeight = 200;
    const attendeeHeight = ticket.attendees.length * 60;
    const formResponseHeight = ticket.formResponses?.length > 0 ? 100 : 0;
    
    return baseHeight + attendeeHeight + formResponseHeight;
  }, [attendees]);

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const ticket = attendees[index];
    if (!ticket) return null;

    return (
      <div style={style} className="px-4">
        <CheckInPaid_AttendeeCard 
          ticket={ticket}
          eventId={selectedEvent._id}
        />
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
      <div className="pb-2 text-sm text-gray-600">
        Showing {attendees.length} of {pagination.totalCount} tickets
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

export default CheckInPaid_VirtualizedAttendeeList;