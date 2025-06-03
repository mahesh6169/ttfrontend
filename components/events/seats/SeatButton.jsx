// components/events/seats/SeatButton.jsx

'use client';

import React from 'react';

const SeatButton = ({ 
  seat, 
  row, 
  isSelected = false, 
  isReservedByUser = false,
  onClick, 
  disabled = false 
}) => {
  // Safety checks for required props
  if (!seat || !row) {
    return null;
  }

  // Ensure seat has required properties
  const safeSeat = {
    seatId: seat.seatId || seat.id || `${row.rowLabel || 'X'}-${seat.seatNumber || seat.number || '?'}`,
    seatNumber: seat.seatNumber || seat.number || '?',
    status: seat.status || 'available',
    reservedBy: seat.reservedBy,
    reservedUntil: seat.reservedUntil
  };

  const safeRow = {
    rowLabel: row.rowLabel || row.label || 'X'
  };

  // Determine seat status
  const getSeatStatus = () => {
    // Priority: explicit selection state first
    if (isSelected) return 'selected';
    if (isReservedByUser) return 'selected';
    
    // Then check actual seat status
    if (safeSeat.status === 'occupied') return 'occupied';
    if (safeSeat.status === 'disabled') return 'disabled';
    if (safeSeat.reservedBy && safeSeat.reservedUntil > new Date()) return 'reserved';
    
    // Default to available
    return 'available';
  };

  const status = getSeatStatus();

  // Seat styling based on status
  const getSeatStyles = () => {
    const baseStyles = "w-8 h-8 rounded text-xs font-medium border-2 transition-all duration-200 flex items-center justify-center cursor-pointer select-none relative";
    
    switch (status) {
      case 'selected':
        return `${baseStyles} bg-teal-600 text-white border-teal-700 shadow-lg scale-110 z-10`;
      case 'available':
        return `${baseStyles} bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400 hover:scale-105`;
      case 'occupied':
        return `${baseStyles} bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-75`;
      case 'reserved':
        return `${baseStyles} bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed opacity-75`;
      case 'disabled':
        return `${baseStyles} bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-50`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-600 border-gray-300`;
    }
  };

  // Tooltip text
  const getTooltipText = () => {
    const seatLabel = `${safeRow.rowLabel}${safeSeat.seatNumber}`;
    switch (status) {
      case 'selected':
        return `${seatLabel} - Selected`;
      case 'available':
        return `${seatLabel} - Available (click to select)`;
      case 'occupied':
        return `${seatLabel} - Occupied`;
      case 'reserved':
        return `${seatLabel} - Reserved by another user`;
      case 'disabled':
        return `${seatLabel} - Not available`;
      default:
        return seatLabel;
    }
  };

  // Handle click
  const handleClick = () => {
    if (disabled || status === 'occupied' || status === 'reserved' || status === 'disabled') {
      return;
    }
    onClick && onClick();
  };

  // Show seat icon for some statuses
  const getSeatIcon = () => {
    switch (status) {
      case 'selected':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'occupied':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'reserved':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return safeSeat.seatNumber;
    }
  };

  return (
    <div className="relative group">
      <button
        className={getSeatStyles()}
        onClick={handleClick}
        disabled={disabled || status === 'occupied' || status === 'reserved' || status === 'disabled'}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {getSeatIcon()}
        
        {/* Selection highlight */}
        {isSelected && (
          <div className="absolute -inset-1 bg-teal-400 rounded opacity-30 animate-pulse"></div>
        )}
      </button>

      {/* Tooltip - positioned to avoid stage overlap */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
        {getTooltipText()}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
      </div>
    </div>
  );
};

export default SeatButton;