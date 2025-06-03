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
          <strong>Layout Rows:</strong> {seatingLayout?.length || 0}
        </div>
        
        <div>
          <strong>Selected:</strong> {selectedSeats?.length || 0}
          {selectedSeats?.length > 0 && (
            <div className="ml-2 text-yellow-300">
              {selectedSeats.join(', ')}
            </div>
          )}
        </div>
        
        <div>
          <strong>Required:</strong> {
            ticketSelection ? Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0) : 0
          }
        </div>
        
        <div>
          <strong>Session:</strong> {sessionId ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Reserved:</strong> {currentReservation ? 'Yes' : 'No'}
        </div>
        
        {error && (
          <div>
            <strong className="text-red-300">Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatDebugInfo;