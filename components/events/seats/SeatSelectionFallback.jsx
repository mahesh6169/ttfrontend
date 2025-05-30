// components/events/seats/SeatSelectionFallback.jsx

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const SeatSelectionFallback = ({ event, ticketSelection, error }) => {
  const router = useRouter();

  const handleBackToEvent = () => {
    router.push(`/events/views/${event._id}`);
  };

  const handleProceedWithoutSeats = () => {
    // For events that might not need specific seat selection
    // Navigate directly to checkout
    router.push(`/checkout/events/${event._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Seat Selection Unavailable
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "We're having trouble loading the seat selection for this event. This might be because the seating layout hasn't been configured yet."}
          </p>

          {/* Event info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 {event.venue}</p>
              <p>🎫 {Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0)} ticket(s) selected</p>
              <p>💰 Total: ${ticketSelection.totals.total.toFixed(2)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleProceedWithoutSeats}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Proceed to Checkout
            </button>
            
            <button
              onClick={handleBackToEvent}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Event Details
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 mt-4">
            If this event has assigned seating, please contact the event organizer for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionFallback;