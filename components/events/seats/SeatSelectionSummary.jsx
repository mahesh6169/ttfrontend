// components/events/seats/SeatSelectionSummary.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';

const SeatSelectionSummary = ({ 
  event, 
  ticketSelection, 
  onProceedToCheckout, 
  compact = false 
}) => {
  const { 
    selectedSeats, 
    currentReservation,
    seatingLayout 
  } = useSelector((state) => state.seatSelection);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0);
  const canProceed = selectedSeats.length === requiredSeats && currentReservation;

  // Get seat details for selected seats
  const getSelectedSeatDetails = () => {
    const seatDetails = [];
    selectedSeats.forEach(seatId => {
      for (const row of seatingLayout) {
        const seat = row.seats?.find(s => {
          const currentSeatId = s.seatId || s.id || `${row.rowLabel}-${s.seatNumber || s.number}`;
          return currentSeatId === seatId;
        });
        if (seat) {
          const seatNumber = seat.seatNumber || seat.number || '?';
          seatDetails.push({
            seatId,
            row: row.rowLabel || row.label || 'X',
            seatNumber,
            label: `${row.rowLabel || row.label || 'X'}${seatNumber}`
          });
          break;
        }
      }
    });
    return seatDetails.sort((a, b) => a.label.localeCompare(b.label));
  };

  // Get ticket type details
  const getTicketBreakdown = () => {
    return Object.entries(ticketSelection.tickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => {
        const ticketType = event.ticketTypes?.find(t => t._id === ticketTypeId);
        return {
          id: ticketTypeId,
          name: ticketType?.name || 'Unknown Ticket',
          price: ticketType?.price || 0,
          quantity
        };
      });
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!event?.dateTime) return '';
    
    const timeZone = event.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(event.dateTime, timeZone, 'EEEE, MMMM do');
    const time = formatInTimeZone(event.dateTime, timeZone, 'h:mm a');
    
    return { date, time };
  };

  const { date, time } = getFormattedDateTime();
  const selectedSeatDetails = getSelectedSeatDetails();
  const ticketBreakdown = getTicketBreakdown();

  if (compact) {
    // Mobile compact version
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {selectedSeats.length} of {requiredSeats} seats selected
            </p>
            {selectedSeats.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedSeatDetails.map(seat => seat.label).join(', ')}
              </p>
            )}
          </div>
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
    );
  }

  // Full desktop version
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
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                ${(ticket.price * ticket.quantity).toFixed(2)}
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
                <span className="text-xs text-teal-600 font-medium">
                  {seat.label}
                </span>
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
        
        
        
        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
          <span>Total</span>
          <span>${ticketSelection.totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Reservation Status */}
      {currentReservation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Seats Reserved
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Complete your purchase before the timer expires
          </p>
        </div>
      )}

      {/* Proceed Button */}
      <button
        onClick={onProceedToCheckout}
        disabled={!canProceed}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
          canProceed 
            ? 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg transform hover:-translate-y-0.5' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {!selectedSeats.length ? 'Select Your Seats' :
         selectedSeats.length < requiredSeats ? `Select ${requiredSeats - selectedSeats.length} More Seat${requiredSeats - selectedSeats.length !== 1 ? 's' : ''}` :
         !currentReservation ? 'Reserving Seats...' :
         'Proceed to Checkout'
        }
      </button>

      {/* Additional Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Seats are held for 10 minutes once reserved</p>
        <p>• Complete your purchase before the timer expires</p>
        <p>• All sales are final - no refunds or exchanges</p>
      </div>
    </div>
  );
};

export default SeatSelectionSummary;