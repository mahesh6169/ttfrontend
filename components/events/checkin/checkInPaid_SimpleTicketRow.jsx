// components/events/checkin/checkInPaid_SimpleTicketRow.jsx

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  bulkCheckInPaidTicket,
  updateLocalBulkCheckIn
} from '@/store/slices/events/checkInPaidSlice';
import { toast } from 'react-toastify';

const CheckInPaid_SimpleTicketRow = ({ ticket, eventId }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkInPaid);

  // Check if all attendees in this ticket are checked in
  const isCheckedIn = ticket.attendees.every(att => att.checkedIn);

  // Handle check-in toggle for the entire ticket
  const handleCheckIn = async () => {
    if (actionLoading) return;

    try {
      await dispatch(bulkCheckInPaidTicket({
        eventId,
        ticketId: ticket._id,
        checkIn: !isCheckedIn
      })).unwrap();

      // Update local state
      dispatch(updateLocalBulkCheckIn({
        ticketId: ticket._id,
        checkedIn: !isCheckedIn,
        checkInTime: !isCheckedIn ? new Date().toISOString() : null
      }));

      toast.success(`Ticket ${ticket.ticketNumber} ${!isCheckedIn ? 'checked in' : 'checked out'}`);
    } catch (error) {
      toast.error(error || 'Check-in operation failed');
    }
  };

  // Get seat information if available
  const seatInfo = ticket.seats && ticket.seats.length > 0 
    ? `Seat: ${ticket.seats[0].row}-${ticket.seats[0].seatNumber}`
    : null;

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg">
      {/* Desktop: horizontal layout, Mobile: stacked layout */}
      <div className="flex-1 mr-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="font-mono text-sm text-slate-700">
            {ticket.ticketNumber}
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs text-slate-500">
            <span>{ticket.ticketType?.name || 'Standard'}</span>
            {seatInfo && (
              <span className="sm:before:content-['•'] sm:before:mx-1">{seatInfo}</span>
            )}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleCheckIn}
        disabled={actionLoading}
        className={`
          px-4 py-1 rounded-lg text-sm font-medium transition-colors shrink-0
          ${isCheckedIn
            ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
            : 'bg-teal-700 text-white hover:bg-teal-800'
          }
          ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isCheckedIn ? 'Check Out' : 'Check In'}
      </button>
    </div>
  );
};

export default CheckInPaid_SimpleTicketRow;