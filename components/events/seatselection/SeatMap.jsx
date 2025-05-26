// components/events/seatselection/SeatMap.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// For now, we'll use local state until we create the seat selection slice
const SeatMap = ({ eventId }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get event data from existing Redux store
  const { selectedEvent } = useSelector((state) => state.events);

  useEffect(() => {
    // Use the seating layout from the selected event
    if (selectedEvent?.seatingLayout) {
      setSeatLayout(selectedEvent.seatingLayout);
      setLoading(false);
    }
  }, [selectedEvent]);

  const handleSeatClick = (seatId, seatStatus) => {
    // Don't allow selection of occupied or disabled seats
    if (seatStatus === 'occupied' || seatStatus === 'disabled') {
      return;
    }
    
    if (selectedSeats.includes(seatId)) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
    } else {
      // Select seat
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const getSeatClasses = (seatId, status) => {
    const baseClasses = "w-8 h-8 m-1 flex items-center justify-center text-xs font-bold rounded cursor-pointer transition-all hover:scale-105 border-2";
    
    if (selectedSeats.includes(seatId)) {
      return `${baseClasses} bg-blue-500 text-white border-blue-600 shadow-md transform scale-105`;
    }
    
    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400`;
      case 'occupied':
        return `${baseClasses} bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-60`;
      case 'disabled':
        return `${baseClasses} bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-40`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600 border-gray-300`;
    }
  };

  const clearSelection = () => {
    setSelectedSeats([]);
  };

  const calculateTotal = () => {
    // For now, use a fixed price - later this will be dynamic based on ticket types
    const pricePerSeat = selectedEvent?.ticketTypes?.[0]?.price || 10;
    return selectedSeats.length * pricePerSeat;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Loading seats...</span>
      </div>
    );
  }

  if (!seatLayout || seatLayout.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No seating layout available for this event.</p>
      </div>
    );
  }

  return (
    <div className="seat-map-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Select Your Seats</h3>
        {selectedSeats.length > 0 && (
          <button
            onClick={clearSelection}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Stage/Front Indicator */}
      <div className="text-center mb-6">
        <div className="inline-block bg-gray-200 px-8 py-2 rounded-lg border-2 border-gray-300">
          <span className="text-sm font-medium text-gray-700">🎭 STAGE</span>
        </div>
      </div>

      {/* Seating Layout */}
      <div className="seat-layout mb-6">
        {seatLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-center mb-3">
            {/* Row Label */}
            <div className="w-10 text-center font-bold text-gray-700 mr-4">
              {row.rowLabel}
            </div>
            
            {/* Seats */}
            <div className="flex gap-1">
              {row.seats?.map((seat, seatIndex) => {
                const seatId = `${row.rowLabel}-${seat.seatNumber}`;
                return (
                  <button
                    key={seatIndex}
                    className={getSeatClasses(seatId, seat.status)}
                    onClick={() => handleSeatClick(seatId, seat.status)}
                    disabled={seat.status === 'occupied' || seat.status === 'disabled'}
                    title={`Row ${row.rowLabel}, Seat ${seat.seatNumber} - ${
                      selectedSeats.includes(seatId) ? 'Selected' : 
                      seat.status === 'available' ? 'Available' :
                      seat.status === 'occupied' ? 'Occupied' : 'Disabled'
                    }`}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
            
            {/* Row Label (Right side) */}
            <div className="w-10 text-center font-bold text-gray-700 ml-4">
              {row.rowLabel}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
          <span className="text-sm font-medium">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-blue-500 border-2 border-blue-600 rounded mr-2"></div>
          <span className="text-sm font-medium">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-red-100 border-2 border-red-300 rounded mr-2"></div>
          <span className="text-sm font-medium">Occupied</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
          <span className="text-sm font-medium">Disabled</span>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h4 className="font-semibold text-teal-800 mb-2">Your Selection</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedSeats.map((seatId) => (
              <span
                key={seatId}
                className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {seatId}
                <button
                  onClick={() => handleSeatClick(seatId, 'available')}
                  className="ml-2 text-teal-600 hover:text-teal-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-teal-700">
                Total: ${calculateTotal().toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {selectedEvent?.applyGST !== false && '(includes GST)'}
              </div>
            </div>
          </div>
          
          {/* Proceed Button */}
          <div className="mt-4">
            <button
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              onClick={() => {
                // TODO: Implement proceed to checkout
                alert(`Proceeding with ${selectedSeats.length} seats: ${selectedSeats.join(', ')}`);
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Click on available seats to select them. You can select multiple seats.
      </div>
    </div>
  );
};

export default SeatMap;