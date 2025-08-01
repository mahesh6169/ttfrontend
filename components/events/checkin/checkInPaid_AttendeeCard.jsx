// components/events/checkin/checkInPaid_AttendeeCard.jsx

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  checkInPaidAttendee, 
  undoCheckInPaidAttendee,
  bulkCheckInPaidTicket,
  updateLocalCheckIn,
  updateLocalBulkCheckIn
} from '@/store/slices/events/checkInPaidSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CheckInPaid_AttendeeCard = ({ ticket, eventId }) => {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkInPaid);

  // Check if all attendees are checked in
  const allCheckedIn = ticket.attendees.every(att => att.checkedIn);
  const someCheckedIn = ticket.attendees.some(att => att.checkedIn);

  // Handle individual attendee check-in
  const handleIndividualCheckIn = async (attendeeId, attendee) => {
    if (attendee.checkedIn) {
      // Undo check-in
      try {
        const result = await dispatch(undoCheckInPaidAttendee({ 
          eventId, 
          ticketId: ticket._id, 
          attendeeId 
        })).unwrap();

        // Update local state immediately
        dispatch(updateLocalCheckIn({
          ticketId: ticket._id,
          attendeeId,
          checkedIn: false,
          checkInTime: null
        }));

        toast.success(`Check-in removed for ${attendee.name}`);
      } catch (error) {
        toast.error(error || 'Failed to undo check-in');
      }
    } else {
      // Check in
      try {
        const result = await dispatch(checkInPaidAttendee({ 
          eventId, 
          ticketId: ticket._id, 
          attendeeId 
        })).unwrap();

        // Update local state immediately
        dispatch(updateLocalCheckIn({
          ticketId: ticket._id,
          attendeeId,
          checkedIn: true,
          checkInTime: new Date().toISOString()
        }));

        toast.success(`${attendee.name} checked in successfully`);
      } catch (error) {
        toast.error(error || 'Failed to check in attendee');
      }
    }
  };

  // Handle bulk check-in/out
  const handleBulkAction = async () => {
    const checkIn = !allCheckedIn;
    
    try {
      const result = await dispatch(bulkCheckInPaidTicket({ 
        eventId, 
        ticketId: ticket._id, 
        checkIn 
      })).unwrap();

      // Update local state immediately
      dispatch(updateLocalBulkCheckIn({
        ticketId: ticket._id,
        checkedIn: checkIn,
        checkInTime: checkIn ? new Date().toISOString() : null
      }));

      toast.success(checkIn 
        ? `All attendees checked in for ticket ${ticket.ticketNumber}`
        : `All check-ins removed for ticket ${ticket.ticketNumber}`
      );
    } catch (error) {
      toast.error(error || 'Failed to perform bulk action');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount / 100);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Ticket Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Ticket #{ticket.ticketNumber}</h3>
              {ticket.ticketType && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {ticket.ticketType.name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Invoice: {ticket.invoiceNumber} • 
              {ticket.priceDetails && ` ${formatCurrency(ticket.priceDetails.totalPrice)}`}
            </p>
            {ticket.seats && ticket.seats.length > 0 && (
              <p className="text-sm text-gray-600">
                Seats: {ticket.seats.map(s => s.seatNumber || s.seatId).join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={handleBulkAction}
            disabled={actionLoading}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              allCheckedIn
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : someCheckedIn
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
            } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {allCheckedIn ? 'Remove All' : someCheckedIn ? 'Check In All' : 'Check In All'}
          </button>
        </div>
      </div>

      {/* Buyer Info */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Purchaser:</span>{' '}
            <span className="font-medium">
              {ticket.buyer.firstName} {ticket.buyer.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{' '}
            <span className="font-medium">{ticket.buyer.email}</span>
          </div>
          {ticket.buyer.phone && (
            <div>
              <span className="text-gray-500">Phone:</span>{' '}
              <span className="font-medium">{ticket.buyer.phone}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Purchased:</span>{' '}
            <span className="font-medium">
              {format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm')}
            </span>
          </div>
        </div>
      </div>

      {/* Attendees */}
      <div className="p-4">
        <h4 className="font-medium text-sm text-gray-700 mb-3">
          Attendees ({ticket.attendees.length})
        </h4>
        <div className="space-y-2">
          {ticket.attendees.map((attendee, index) => (
            <div key={attendee._id} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{index + 1}.</span>
                <div>
                  <p className="font-medium text-sm">{attendee.name}</p>
                  {attendee.age && (
                    <p className="text-xs text-gray-500">Age: {attendee.age}</p>
                  )}
                  {attendee.checkedIn && attendee.checkInTime && (
                    <p className="text-xs text-green-600">
                      Checked in at {format(new Date(attendee.checkInTime), 'HH:mm')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleIndividualCheckIn(attendee._id, attendee)}
                disabled={actionLoading}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  attendee.checkedIn
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {attendee.checkedIn ? '✓ Checked In' : 'Check In'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form Responses */}
      {ticket.formResponses && ticket.formResponses.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Additional Information</h4>
          <div className="space-y-1">
            {ticket.formResponses.map((response, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-500">{response.fieldName}:</span>{' '}
                <span>{response.response}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPaid_AttendeeCard;