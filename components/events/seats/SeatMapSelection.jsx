// components/events/seats/SeatMapSelection.jsx

'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleSeat, 
  reserveSeats, 
  releaseReservation,
  clearSelection 
} from '@/store/slices/events/seatSelectionSlice';
import SeatButton from './SeatButton';

const SeatMapSelection = ({ event, ticketSelection }) => {
  const dispatch = useDispatch();
  const { 
    seatingLayout, 
    selectedSeats, 
    currentReservation, 
    maxSeatsPerSelection,
    sessionId,
    isLoading 
  } = useSelector((state) => state.seatSelection);

  const [pendingReservation, setPendingReservation] = useState(false);
  const [showSeatingImage, setShowSeatingImage] = useState(false);

  const requiredSeats = Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0);

  // Utility function to generate consistent seat IDs

const generateSeatId = (seat, row, seatIndex) => {
  // First priority: use backend's seatId field (A-1, B-2, etc.)
  if (seat.seatId) {
    return seat.seatId;
  }
  
  // Second priority: use backend's id field
  if (seat.id) {
    return seat.id;
  }
  
  // Fallback: generate from row and seat number to match backend format
  const rowLabel = row.rowLabel || row.label || `R${seatIndex + 1}`;
  const seatNumber = seat.seatNumber || seat.number || (seatIndex + 1);
  return `${rowLabel}-${seatNumber}`;
  
  // Note: We removed seat._id as it's MongoDB's internal ID, not our application seatId
};

  // Auto-reserve seats when selection changes
  useEffect(() => {
    console.log('🎯 Selection changed:', { 
      selectedSeats, 
      requiredSeats, 
      hasReservation: !!currentReservation,
      shouldReserve: selectedSeats.length > 0 && selectedSeats.length === requiredSeats && !currentReservation
    });
    
    if (selectedSeats.length > 0 && selectedSeats.length === requiredSeats && !currentReservation) {
      console.log('🎯 Auto-reserving seats...');
      handleReserveSeats();
    }
  }, [selectedSeats, requiredSeats, currentReservation]);

  const handleSeatClick = (seatId, seatStatus) => {
  console.log('🎯 Seat clicked:', { 
    seatId, 
    seatStatus, 
    selectedSeats, 
    requiredSeats,
    currentReservation: !!currentReservation 
  });

  // Prevent selection if loading or seat is occupied/disabled
  if (isLoading || seatStatus === 'occupied' || seatStatus === 'disabled') {
    console.log('❌ Seat selection blocked:', { seatStatus, isLoading });
    return;
  }

  // ✅ IMPROVED: Better seat limit validation
  const isCurrentlySelected = selectedSeats.includes(seatId);
  
  if (!isCurrentlySelected && selectedSeats.length >= requiredSeats) {
    alert(`You can only select ${requiredSeats} seat${requiredSeats !== 1 ? 's' : ''} for your ${requiredSeats} ticket${requiredSeats !== 1 ? 's' : ''}. Please deselect a seat first if you want to choose a different one.`);
    return;
  }

  // Validate seat exists in layout before dispatching
  let seatExists = false;
  let seatDetails = null;
  
  for (const row of seatingLayout) {
    const seat = row.seats?.find(s => {
      const currentSeatId = generateSeatId(s, row, 0);
      return currentSeatId === seatId;
    });
    if (seat) {
      seatExists = true;
      seatDetails = {
        row: row.rowLabel,
        seatNumber: seat.seatNumber || seat.number,
        status: seat.status
      };
      break;
    }
  }

  if (!seatExists) {
    console.error('❌ Attempted to select non-existent seat:', seatId);
    alert('This seat is no longer available. Please refresh the page.');
    return;
  }

  console.log('✅ Seat validation passed:', { seatId, seatDetails });
  dispatch(toggleSeat(seatId));
};

  const handleReserveSeats = async () => {
  if (selectedSeats.length === 0 || pendingReservation) return;

  // ✅ NEW: Validate seat count matches ticket count
  if (selectedSeats.length !== requiredSeats) {
    alert(`Please select exactly ${requiredSeats} seat${requiredSeats !== 1 ? 's' : ''} for your ${requiredSeats} ticket${requiredSeats !== 1 ? 's' : ''}. Currently selected: ${selectedSeats.length}`);
    return;
  }

  console.log('🎯 Attempting to reserve seats:', {
    eventId: event._id,
    selectedSeats,
    sessionId,
    requiredSeats,
    seatCount: selectedSeats.length
  });

    // Validate that all selected seats exist in the seating layout
    const invalidSeats = [];
    const validatedSeats = [];
    
    for (const seatId of selectedSeats) {
      let seatExists = false;
      for (const row of seatingLayout) {
        const seat = row.seats?.find(s => {
          const currentSeatId = generateSeatId(s, row, 0);
          return currentSeatId === seatId;
        });
        if (seat) {
          seatExists = true;
          validatedSeats.push({
            seatId,
            row: row.rowLabel,
            seatNumber: seat.seatNumber || seat.number,
            status: seat.status
          });
          break;
        }
      }
      if (!seatExists) {
        invalidSeats.push(seatId);
      }
    }

    if (invalidSeats.length > 0) {
      console.error('❌ Invalid seats found:', invalidSeats);
      alert('Some selected seats are no longer available. Please refresh and try again.');
      dispatch(clearSelection());
      return;
    }

    console.log('✅ Validated seats:', validatedSeats);

    setPendingReservation(true);
    try {
      const reservationData = {
        eventId: event._id,
        seatIds: selectedSeats,
        sessionId: sessionId || `web_${Date.now()}`
      };

      console.log('🎯 Sending reservation request:', reservationData);

      const result = await dispatch(reserveSeats(reservationData)).unwrap();
      
      console.log('✅ Seats reserved successfully:', result);
    } catch (error) {
      console.error('❌ Failed to reserve seats:', error);
      
      // More specific error handling
      if (error.message && error.message.includes('not found')) {
        alert('One or more selected seats are no longer available. The page will refresh.');
        window.location.reload();
      } else if (error.message && error.message.includes('reserved')) {
        alert('Some seats have been reserved by another user. Please select different seats.');
        dispatch(clearSelection());
      } else {
        alert('Failed to reserve seats. Please try again.');
        dispatch(clearSelection());
      }
    } finally {
      setPendingReservation(false);
    }
  };

  const handleClearSelection = async () => {
    if (currentReservation) {
      try {
        await dispatch(releaseReservation({
          eventId: event._id,
          reservationId: currentReservation.reservationId
        })).unwrap();
      } catch (error) {
        console.error('❌ Failed to release reservation:', error);
      }
    }
    dispatch(clearSelection());
  };

  const getSeatColor = (seat) => {
    // Generate consistent seat ID if missing
    const seatId = seat.seatId || seat.id || `${seat.rowLabel || 'X'}-${seat.seatNumber || seat.number || '?'}`;
    const isSelected = selectedSeats.includes(seatId);
    const isReservedByUser = currentReservation?.seatIds.includes(seatId);
    
    if (isSelected || isReservedByUser) return 'selected';
    return seat.status || 'available';
  };

  const totalSeats = seatingLayout.reduce((total, row) => total + (row.seats?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Select Your Seats</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose {requiredSeats} seat{requiredSeats !== 1 ? 's' : ''} • {selectedSeats.length} of {requiredSeats} selected
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Toggle seating layout image */}
          {event.seatingLayoutImage?.url && (
            <button
              onClick={() => setShowSeatingImage(!showSeatingImage)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showSeatingImage ? 'Hide' : 'Show'} Layout Image
            </button>
          )}

          {/* Clear selection */}
          {selectedSeats.length > 0 && (
            <button
              onClick={handleClearSelection}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Seating layout image (if toggled) */}
      {showSeatingImage && event.seatingLayoutImage?.url && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Venue Layout Reference</h3>
          <img
            src={event.seatingLayoutImage.url}
            alt="Seating Layout"
            className="max-w-full h-auto rounded border border-gray-300"
          />
        </div>
      )}

      {/* Stage indicator */}
      <div className="text-center">
        <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded-lg text-sm font-medium">
          🎭 STAGE
        </div>
      </div>

      {/* Seat map */}
      <div className="relative">
        {seatingLayout.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-gray-500">No seating layout available for this event</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-fit mx-auto space-y-3 p-4">
              {seatingLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center space-x-2">
                  {/* Row label */}
                  <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                    {row.rowLabel}
                  </div>

                  {/* Seats */}
                  <div className="flex space-x-1">
                    {(row.seats || []).map((seat, seatIndex) => {
                      // Generate consistent seat ID
                      const seatId = generateSeatId(seat, row, seatIndex);
                      const seatWithId = { ...seat, seatId };
                      
                      return (
                        <SeatButton
                          key={seatId}
                          seat={seatWithId}
                          row={row}
                          isSelected={selectedSeats.includes(seatId)}
                          isReservedByUser={currentReservation?.seatIds.includes(seatId)}
                          onClick={() => handleSeatClick(seatId, getSeatColor(seatWithId))}
                          disabled={isLoading || pendingReservation}
                        />
                      );
                    })}
                  </div>

                  {/* Row label (right side) */}
                  <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                    {row.rowLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {(isLoading || pendingReservation) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                {pendingReservation ? 'Reserving seats...' : 'Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>

{/* Enhanced Selection progress */}
{requiredSeats > 0 && (
  <div className={`border rounded-lg p-4 ${
    selectedSeats.length === requiredSeats ? 'bg-green-50 border-green-200' : 
    selectedSeats.length > requiredSeats ? 'bg-red-50 border-red-200' : 
    'bg-blue-50 border-blue-200'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <svg className={`w-5 h-5 mr-2 ${
          selectedSeats.length === requiredSeats ? 'text-green-600' : 
          selectedSeats.length > requiredSeats ? 'text-red-600' : 
          'text-blue-600'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
            d={selectedSeats.length === requiredSeats ? 
              "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : 
              "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
        <span className={`text-sm font-medium ${
          selectedSeats.length === requiredSeats ? 'text-green-800' : 
          selectedSeats.length > requiredSeats ? 'text-red-800' : 
          'text-blue-800'
        }`}>
          {selectedSeats.length === 0 ? 
            `Click on available seats to select them (need ${requiredSeats})` :
           selectedSeats.length < requiredSeats ? 
            `Select ${requiredSeats - selectedSeats.length} more seat${requiredSeats - selectedSeats.length !== 1 ? 's' : ''} (${selectedSeats.length}/${requiredSeats})` :
           selectedSeats.length === requiredSeats ? 
            `Perfect! All ${requiredSeats} seats selected: ${selectedSeats.join(', ')}` :
            `Too many seats selected! Please deselect ${selectedSeats.length - requiredSeats} seat${selectedSeats.length - requiredSeats !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center space-x-2">
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              selectedSeats.length === requiredSeats ? 'bg-green-600' : 
              selectedSeats.length > requiredSeats ? 'bg-red-600' : 
              'bg-blue-600'
            }`}
            style={{ width: `${Math.min(100, (selectedSeats.length / requiredSeats) * 100)}%` }}
          ></div>
        </div>
        <span className={`text-sm font-medium ${
          selectedSeats.length === requiredSeats ? 'text-green-800' : 
          selectedSeats.length > requiredSeats ? 'text-red-800' : 
          'text-blue-800'
        }`}>
          {selectedSeats.length}/{requiredSeats}
        </span>
      </div>
    </div>
  </div>
)}

      {/* Current reservation info */}
      {currentReservation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Seats reserved! Complete your purchase within the time limit.
            </span>
          </div>
        </div>
      )}

      {/* Venue stats */}
      <div className="text-center text-sm text-gray-500 border-t pt-4">
        <p>Venue capacity: {totalSeats} seats • {event.venue}</p>
      </div>
    </div>
  );
};

export default SeatMapSelection;