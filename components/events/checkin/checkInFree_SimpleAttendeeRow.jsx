// components/events/checkin/checkInFree_SimpleAttendeeRow.jsx

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkInAttendee, 
  undoCheckInAttendee,
  updateLocalCheckIn 
} from '@/store/slices/events/checkInFreeSlice';
import { toast } from 'react-toastify';

const CheckInFree_SimpleAttendeeRow = ({ 
  attendee, 
  ticketId, 
  registrationNumber,
}) => {
  const dispatch = useDispatch();
  const { selectedEvent, actionLoading } = useSelector((state) => state.checkInFree);

  // Handle check-in toggle
  const handleCheckInToggle = async () => {
    if (actionLoading || !selectedEvent) return;

    try {
      if (attendee.checkedIn) {
        // Undo check-in
        await dispatch(undoCheckInAttendee({
          eventId: selectedEvent._id,
          ticketId,
          attendeeId: attendee._id
        })).unwrap();
        
        // Update local state
        dispatch(updateLocalCheckIn({
          ticketId,
          attendeeId: attendee._id,
          checkedIn: false,
          checkInTime: null
        }));
        
        toast.success(`${attendee.name} checked out`);
      } else {
        // Check in
        await dispatch(checkInAttendee({
          eventId: selectedEvent._id,
          ticketId,
          attendeeId: attendee._id
        })).unwrap();
        
        // Update local state
        dispatch(updateLocalCheckIn({
          ticketId,
          attendeeId: attendee._id,
          checkedIn: true,
          checkInTime: new Date().toISOString()
        }));
        
        toast.success(`${attendee.name} checked in`);
      }
    } catch (error) {
      toast.error(error || 'Check-in operation failed');
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 sm:px-3 hover:bg-gray-100">
      {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
        <span className="text-sm font-medium text-gray-900 sm:min-w-[150px]">
          {attendee.name}
        </span>
        <span className="text-xs sm:text-sm text-gray-500 font-mono">
          {registrationNumber}
        </span>
      </div>
      
      <button
        onClick={handleCheckInToggle}
        disabled={actionLoading}
        className={`
          ml-2 px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
          ${attendee.checkedIn 
            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
            : 'bg-teal-600 text-white hover:bg-teal-700'
          }
          ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {attendee.checkedIn ? 'Check Out' : 'Check In'}
      </button>
    </div>
  );
};

export default CheckInFree_SimpleAttendeeRow;