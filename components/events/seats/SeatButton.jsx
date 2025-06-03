// components/events/seats/SeatButton.jsx

'use client';

import React from 'react';

const SeatButton = ({
  seat,
  row,
  isSelected = false,
  isReservedByUser = false,
  onClick,
  disabled = false,
  userId = null,
}) => {
  // Safety checks for required props
  if (!seat || !row) return null;

  // Normalize props
  const safeSeat = {
    seatId: seat.seatId || seat.id || `${row.rowLabel || 'X'}-${seat.seatNumber || seat.number || '?'}`,
    seatNumber: seat.seatNumber || seat.number || '?',
    status: seat.status || 'available',
    reservedBy: seat.reservedBy,
    reservedUntil: seat.reservedUntil,
  };

  const safeRow = {
    rowLabel: row.rowLabel || row.label || 'X',
  };

  const isOtherUserHolding =
    safeSeat.status === 'selected' &&
    safeSeat.reservedBy &&
    userId &&
    safeSeat.reservedBy !== userId;

  // Determine seat status
  const getSeatStatus = () => {
    if (isSelected || isReservedByUser) return 'selected';
    if (safeSeat.status === 'booked') return 'booked';
    if (safeSeat.status === 'reserved') return 'reserved';
    if (safeSeat.status === 'disabled') return 'disabled';
    if (isOtherUserHolding) return 'selected-by-other';
    return 'available';
  };

  const status = getSeatStatus();

  const getSeatStyles = () => {
    const baseStyles =
      'w-8 h-8 rounded text-xs font-medium border-2 transition-all duration-200 flex items-center justify-center cursor-pointer select-none relative';

    switch (status) {
      case 'selected':
        return `${baseStyles} bg-teal-600 text-white border-teal-700 shadow-lg scale-110 z-10`;
      case 'available':
        return `${baseStyles} bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400 hover:scale-105`;
      case 'selected-by-other':
        return `${baseStyles} bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed animate-pulse`;
      case 'booked':
        return `${baseStyles} bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-75`;
      case 'reserved':
        return `${baseStyles} bg-purple-100 text-purple-800 border-purple-300 cursor-not-allowed opacity-75`;
      case 'disabled':
        return `${baseStyles} bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed opacity-50`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-600 border-gray-300`;
    }
  };

  const getTooltipText = () => {
    const seatLabel = `${safeRow.rowLabel}${safeSeat.seatNumber}`;
    switch (status) {
      case 'selected':
        return `${seatLabel} - Selected`;
      case 'available':
        return `${seatLabel} - Available (click to select)`;
      case 'selected-by-other':
        return `${seatLabel} - Being selected by another user`;
      case 'booked':
        return `${seatLabel} - Booked`;
      case 'reserved':
        return `${seatLabel} - Reserved by organizer`;
      case 'disabled':
        return `${seatLabel} - Not available`;
      default:
        return seatLabel;
    }
  };

  const handleClick = (e) => {
    if (
      disabled ||
      status === 'booked' ||
      status === 'reserved' ||
      status === 'disabled' ||
      status === 'selected-by-other'
    ) {
      e?.preventDefault();
      return;
    }
    onClick && onClick();
  };

  const getSeatIcon = () => {
    switch (status) {
      case 'selected':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'booked':
      case 'reserved':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
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
        disabled={
          disabled ||
          status === 'booked' ||
          status === 'reserved' ||
          status === 'disabled' ||
          status === 'selected-by-other'
        }
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {getSeatIcon()}
        {isSelected && (
          <div className="absolute -inset-1 bg-teal-400 rounded opacity-30 animate-pulse"></div>
        )}
      </button>

      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
        {getTooltipText()}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
      </div>
    </div>
  );
};

export default SeatButton;
