// components/events/seats/SeatDebugInfo.jsx

'use client';

import React from 'react';
import { useSelector } from 'react-redux';

const SeatDebugInfo = ({ event, ticketSelection }) => {
  const { 
    seatingLayout, 
    selectedSeats, 
    currentReservation,
    sessionId,
    error 
  } = useSelector((state) => state.seatSelection);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto text-xs">
      <h3 className="font-bold text-sm mb-2">🐛 Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Event ID:</strong> {event?._id}
        </div>
        
        <div>
          <strong>Has Seating Layout:</strong> {seatingLayout?.length > 0 ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Seating Layout Rows:</strong> {seatingLayout?.length || 0}
        </div>
        
        <div>
          <strong>Total Seats:</strong> {
            seatingLayout?.reduce((total, row) => total + (row.seats?.length || 0), 0) || 0
          }
        </div>
        
        <div>
          <strong>Selected Seats:</strong> {selectedSeats?.length || 0}
          {selectedSeats?.length > 0 && (
            <div className="ml-2 text-yellow-300">
              {selectedSeats.join(', ')}
            </div>
          )}
        </div>
        
        <div>
          <strong>Required Seats:</strong> {
            ticketSelection ? Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0) : 0
          }
        </div>
        
        <div>
          <strong>Session ID:</strong> {sessionId || 'None'}
        </div>
        
        <div>
          <strong>Current Reservation:</strong> {currentReservation ? 'Yes' : 'No'}
          {currentReservation && (
            <div className="ml-2 text-green-300">
              ID: {currentReservation.reservationId}
            </div>
          )}
        </div>
        
        {error && (
          <div>
            <strong className="text-red-300">Error:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>Ticket Selection:</strong>
          {ticketSelection ? (
            <pre className="text-xs text-yellow-300 mt-1">
              {JSON.stringify(ticketSelection, null, 2)}
            </pre>
          ) : (
            'None'
          )}
        </div>
        
        <div>
          <strong>Sample Seats (first 3):</strong>
          {seatingLayout?.slice(0, 2).map((row, i) => (
            <div key={i} className="ml-2 text-blue-300">
              Row {row.rowLabel}: {row.seats?.slice(0, 3).map((seat, j) => {
                // Log the actual seat structure for debugging
                console.log(`Seat ${i}-${j} structure:`, seat);
                
                const seatId = seat._id || seat.seatId || seat.id || `${row.rowLabel}-${seat.seatNumber || seat.number || j + 1}`;
                const seatNumber = seat.seatNumber || seat.number || j + 1;
                return `${seatId}(${seat.status || 'available'})`;
              }).join(', ')}
            </div>
          ))}
        </div>
        
        <div>
          <strong>Backend Seat Structure (first seat):</strong>
          {seatingLayout?.[0]?.seats?.[0] && (
            <pre className="text-xs text-yellow-300 mt-1 max-h-32 overflow-y-auto">
              {JSON.stringify(seatingLayout[0].seats[0], null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatDebugInfo;