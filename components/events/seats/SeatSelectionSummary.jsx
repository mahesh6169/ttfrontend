// components/events/seats/SeatSelectionSummary.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  selectHasActiveReservation,
  selectReservationTimeLeft 
} from '@/store/slices/events/seatSelectionSlice';

const SeatSelectionSummary = ({ 
  event, 
  ticketSelection, 
  onProceedToCheckout, 
  compact = false,
  eventId
}) => {
  const { 
    selectedSeats, 
    currentReservation,
    seatingLayout 
  } = useSelector((state) => state.seatSelection);

  // ✅ NEW: Use enhanced selectors
  const hasActiveReservation = useSelector(selectHasActiveReservation);
  const reservationTimeLeft = useSelector(selectReservationTimeLeft);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0);
  
  // ✅ ENHANCED: Better validation for proceed capability
  const canProceed = selectedSeats.length === requiredSeats && hasActiveReservation;

  // ✅ IMPROVED: More robust seat details extraction
  const getSelectedSeatDetails = () => {
    const seatDetails = [];
    
    for (const seatId of selectedSeats) {
      // Find seat in layout
      let foundSeat = null;
      let foundRow = null;
      
      for (const row of seatingLayout) {
        const seat = row.seats?.find(s => {
          // Handle multiple possible seat ID formats
          const possibleIds = [
            s.seatId,
            s.id,
            `${row.rowLabel || row.label}-${s.seatNumber || s.number}`
          ].filter(Boolean);
          
          return possibleIds.includes(seatId);
        });
        
        if (seat) {
          foundSeat = seat;
          foundRow = row;
          break;
        }
      }
      
      if (foundSeat && foundRow) {
        const seatNumber = foundSeat.seatNumber || foundSeat.number || '?';
        const rowLabel = foundRow.rowLabel || foundRow.label || 'X';
        
        seatDetails.push({
          seatId,
          row: rowLabel,
          seatNumber,
          label: `${rowLabel}${seatNumber}`,
          status: foundSeat.status || 'unknown'
        });
      } else {
        console.warn(`⚠️ Could not find details for seat: ${seatId}`);
        // Add placeholder for missing seat
        seatDetails.push({
          seatId,
          row: '?',
          seatNumber: '?',
          label: seatId,
          status: 'unknown'
        });
      }
    }
    
    return seatDetails.sort((a, b) => a.label.localeCompare(b.label));
  };

  // ✅ ENHANCED: Ticket breakdown with better error handling
  const getTicketBreakdown = () => {
    return Object.entries(ticketSelection.tickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = event.ticketTypes?.find(t => t._id === ticketTypeId);
        return {
          id: ticketTypeId,
          name: ticketType?.name || 'Unknown Ticket',
          price: ticketType?.price || 0,
          quantity,
          subtotal: (ticketType?.price || 0) * quantity
        };
      });
  };

  // ✅ IMPROVED: Date/time formatting with error handling
  const getFormattedDateTime = () => {
    if (!event?.dateTime) return { date: 'Date TBD', time: 'Time TBD' };
    
    try {
      const timeZone = event.timeZone || 'Australia/Sydney';
      const date = formatInTimeZone(event.dateTime, timeZone, 'EEEE, MMMM do');
      const time = formatInTimeZone(event.dateTime, timeZone, 'h:mm a');
      
      return { date, time };
    } catch (error) {
      console.error('❌ Error formatting date/time:', error);
      return { date: 'Date Error', time: 'Time Error' };
    }
  };

  // ✅ NEW: Reservation status helper
  const getReservationStatus = () => {
    if (!currentReservation) return null;
    
    const timeLeftMinutes = Math.ceil(reservationTimeLeft / (60 * 1000));
    
    if (timeLeftMinutes <= 0) {
      return {
        type: 'expired',
        message: 'Reservation expired',
        color: 'red'
      };
    } else if (timeLeftMinutes <= 2) {
      return {
        type: 'urgent',
        message: `${timeLeftMinutes} minute(s) remaining`,
        color: 'red'
      };
    } else if (timeLeftMinutes <= 5) {
      return {
        type: 'warning',
        message: `${timeLeftMinutes} minutes remaining`,
        color: 'amber'
      };
    } else {
      return {
        type: 'normal',
        message: `${timeLeftMinutes} minutes remaining`,
        color: 'green'
      };
    }
  };

  const { date, time } = getFormattedDateTime();
  const selectedSeatDetails = getSelectedSeatDetails();
  const ticketBreakdown = getTicketBreakdown();
  const reservationStatus = getReservationStatus();

  // ✅ ENHANCED: Compact mobile version with better status display
  if (compact) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedSeats.length} of {requiredSeats} seats selected
            </p>
            {selectedSeats.length > 0 && (
              <p className="text-xs text-gray-500 truncate">
                {selectedSeatDetails.map(seat => seat.label).join(', ')}
              </p>
            )}
            {reservationStatus && (
              <p className={`text-xs font-medium mt-1 text-${reservationStatus.color}-600`}>
                {reservationStatus.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onProceedToCheckout}
              disabled={!canProceed}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                canProceed 
                  ? 'bg-teal-600 text-white hover:bg-teal-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canProceed ? 'Proceed' : 'Select Seats'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ ENHANCED: Full desktop version with improved layout
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Booking Summary
        </h3>
      </div>

      {/* Event Details */}
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-gray-900 truncate" title={event.title}>
            {event.title}
          </h4>
          <p className="text-sm text-gray-600">{event.venue}</p>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Ticket Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Tickets</h4>
        <div className="space-y-2">
          {ticketBreakdown.map((ticket) => (
            <div key={ticket.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {ticket.name} × {ticket.quantity}
              </span>
              <span className="font-medium text-gray-900">
                ${ticket.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Seats */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          <span>Selected Seats</span>
          <span className="ml-2 text-sm text-gray-500">
            ({selectedSeats.length}/{requiredSeats})
          </span>
        </h4>
        
        {selectedSeats.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-sm text-gray-500">No seats selected yet</p>
            <p className="text-xs text-gray-400 mt-1">Click on available seats to select them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedSeatDetails.map((seat, index) => (
              <div key={`${seat.seatId}-${index}`} className="flex items-center justify-between p-2 bg-teal-50 rounded border border-teal-200">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-teal-600 text-white rounded text-xs font-medium flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Row {seat.row}, Seat {seat.seatNumber}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-teal-600 font-medium">
                    {seat.label}
                  </span>
                  {seat.status === 'unknown' && (
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20" title="Seat status unknown">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">${ticketSelection.totals.subtotal.toFixed(2)}</span>
        </div>
        
        {ticketSelection.totals.fees > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fees</span>
            <span className="text-gray-900">${ticketSelection.totals.fees.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
          <span>Total</span>
          <span>${ticketSelection.totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* ✅ ENHANCED: Reservation Status with visual improvements */}
      {reservationStatus && (
        <div className={`border rounded-lg p-3 ${
          reservationStatus.color === 'green' ? 'bg-green-50 border-green-200' :
          reservationStatus.color === 'amber' ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <svg className={`w-4 h-4 mr-2 ${
              reservationStatus.color === 'green' ? 'text-green-600' :
              reservationStatus.color === 'amber' ? 'text-amber-600' :
              'text-red-600'
            }`} fill="currentColor" viewBox="0 0 20 20">
              {reservationStatus.type === 'expired' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              ) : reservationStatus.type === 'urgent' ? (
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              )}
            </svg>
            <span className={`text-sm font-medium ${
              reservationStatus.color === 'green' ? 'text-green-800' :
              reservationStatus.color === 'amber' ? 'text-amber-800' :
              'text-red-800'
            }`}>
              {reservationStatus.type === 'expired' ? 'Reservation Expired' : 'Seats Reserved'}
            </span>
          </div>
          <p className={`text-xs mt-1 ${
            reservationStatus.color === 'green' ? 'text-green-700' :
            reservationStatus.color === 'amber' ? 'text-amber-700' :
            'text-red-700'
          }`}>
            {reservationStatus.type === 'expired' 
              ? 'Please select your seats again to continue'
              : `${reservationStatus.message} - Complete your purchase before time expires`
            }
          </p>
        </div>
      )}

      {/* ✅ ENHANCED: Proceed Button with better state handling */}
      <button
        onClick={onProceedToCheckout}
        disabled={!canProceed}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          canProceed 
            ? 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {getButtonText()}
      </button>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Seats are held for 10 minutes once reserved</p>
        <p>• Complete your purchase before the timer expires</p>
        {event.refundPolicy?.allowRefunds === false && (
          <p>• All sales are final - no refunds or exchanges</p>
        )}
      </div>
    </div>
  );

  // ✅ NEW: Helper function for button text
  function getButtonText() {
    if (!selectedSeats.length) {
      return 'Select Your Seats';
    }
    
    if (selectedSeats.length < requiredSeats) {
      const remaining = requiredSeats - selectedSeats.length;
      return `Select ${remaining} More Seat${remaining !== 1 ? 's' : ''}`;
    }
    
    if (!hasActiveReservation) {
      return 'Reserving Seats...';
    }
    
    if (reservationStatus?.type === 'expired') {
      return 'Reservation Expired';
    }
    
    return 'Proceed to Checkout';
  }
};

export default SeatSelectionSummary;