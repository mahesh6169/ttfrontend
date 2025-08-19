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
  // ✅ ENHANCED: Better safety checks with detailed logging
  if (!seat || !row) {
    console.warn('⚠️ SeatButton: Missing required props', { seat: !!seat, row: !!row });
    return null;
  }

  // ✅ IMPROVED: More robust prop normalization
  const safeSeat = {
    seatId: seat.seatId || seat.id || `${row.rowLabel || 'X'}-${seat.seatNumber || seat.number || '?'}`,
    seatNumber: seat.seatNumber || seat.number || '?',
    status: seat.status || 'available',
    reservedBy: seat.reservedBy,
    reservedUntil: seat.reservedUntil,
    sessionId: seat.sessionId,
    ticketTypeId: seat.ticketTypeId,
  };

  const safeRow = {
    rowLabel: row.rowLabel || row.label || 'X',
  };

  // ✅ ENHANCED: Better detection of other user holding seat
  const isOtherUserHolding = () => {
    if (safeSeat.status !== 'selected') return false;
    if (!safeSeat.reservedBy) return false;
    if (!userId) return false;
    
    // Check if reservation is still valid
    if (safeSeat.reservedUntil) {
      const isExpired = new Date(safeSeat.reservedUntil) <= new Date();
      if (isExpired) return false;
    }
    
    return safeSeat.reservedBy !== userId;
  };

  const otherUserHolding = isOtherUserHolding();

  // ✅ IMPROVED: Enhanced seat status determination
  const getSeatStatus = () => {
    // Priority 1: Selected by current user (visual state)
    if (isSelected || isReservedByUser) return 'selected';
    
    // Priority 2: Backend statuses
    if (safeSeat.status === 'booked') return 'booked';
    if (safeSeat.status === 'reserved') return 'reserved';
    if (safeSeat.status === 'disabled') return 'disabled';
    
    // Priority 3: Selected by another user
    if (otherUserHolding) return 'selected-by-other';
    
    // Default: available
    return 'available';
  };

  const status = getSeatStatus();

  // ✅ MOBILE ENHANCED: Improved styling with better mobile UX and compact design
  const getSeatStyles = () => {
    const baseStyles =
      'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded text-[8px] sm:text-[10px] md:text-xs font-medium border transition-all duration-200 flex items-center justify-center cursor-pointer select-none relative overflow-hidden touch-manipulation';

    switch (status) {
      case 'selected':
        return `${baseStyles} bg-blue-600 text-white border-blue-700 shadow-md`;
      case 'available':
        return `${baseStyles} bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 hover:shadow-sm`;
      case 'selected-by-other':
        return `${baseStyles} bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed`;
      case 'booked':
        return `${baseStyles} bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed`;
      case 'reserved':
        return `${baseStyles} bg-purple-100 text-purple-700 border-purple-300 cursor-not-allowed`;
      case 'disabled':
        return `${baseStyles} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-600 border-gray-300`;
    }
  };

  // ✅ ENHANCED: More descriptive tooltip text
  const getTooltipText = () => {
    const seatLabel = `${safeRow.rowLabel}${safeSeat.seatNumber}`;
    
    switch (status) {
      case 'selected':
        return `${seatLabel} - Selected by you`;
      case 'available':
        return `${seatLabel} - Available (tap to select)`;
      case 'selected-by-other':
        const timeLeft = safeSeat.reservedUntil ? 
          Math.ceil((new Date(safeSeat.reservedUntil) - new Date()) / (60 * 1000)) : null;
        return `${seatLabel} - Being selected by another user${timeLeft ? ` (${timeLeft} min left)` : ''}`;
      case 'booked':
        return `${seatLabel} - Already purchased`;
      case 'reserved':
        return `${seatLabel} - Reserved by organizer`;
      case 'disabled':
        return `${seatLabel} - Not available for selection`;
      default:
        return seatLabel;
    }
  };

  // ✅ IMPROVED: Enhanced click handling with logging
  const handleClick = (e) => {
    e?.preventDefault();
    
    const canClick = !disabled && 
                    status !== 'booked' && 
                    status !== 'reserved' && 
                    status !== 'disabled' && 
                    status !== 'selected-by-other';

    if (!canClick) {
      console.log(`🚫 Seat ${safeSeat.seatId} click blocked - status: ${status}, disabled: ${disabled}`);
      return;
    }

    console.log(`🪑 Seat ${safeSeat.seatId} clicked - status: ${status}`);
    
    if (onClick) {
      onClick();
    } else {
      console.warn('⚠️ No onClick handler provided for seat button');
    }
  };

  // ✅ MOBILE ENHANCED: Better seat icon with responsive sizing
  const getSeatIcon = () => {
    const iconClass = "w-4 h-4 sm:w-3 sm:h-3 md:w-4 md:h-4";
    
    switch (status) {
      case 'selected':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-label="Selected">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'booked':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-label="Booked">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'reserved':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-label="Reserved">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'disabled':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-label="Disabled">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      case 'selected-by-other':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-label="Being selected">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <span className="text-[8px] sm:text-[10px] md:text-xs font-bold">
            {safeSeat.seatNumber}
          </span>
        );
    }
  };

  // ✅ NEW: Animation effects for different states
  const getAnimationClasses = () => {
    switch (status) {
      case 'selected':
        return 'animate-pulse';
      case 'selected-by-other':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  // ✅ NEW: Accessibility attributes
  const getAriaAttributes = () => {
    return {
      role: 'button',
      'aria-label': getTooltipText(),
      'aria-pressed': isSelected,
      'aria-disabled': disabled || status === 'booked' || status === 'reserved' || status === 'disabled' || status === 'selected-by-other',
      tabIndex: disabled ? -1 : 0,
    };
  };

  // ✅ NEW: Keyboard handling
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div className="relative group">
      <button
        className={`${getSeatStyles()} ${getAnimationClasses()}`}
        onClick={handleClick}
        onKeyPress={handleKeyPress}
        disabled={
          disabled ||
          status === 'booked' ||
          status === 'reserved' ||
          status === 'disabled' ||
          status === 'selected-by-other'
        }
        title={getTooltipText()}
        {...getAriaAttributes()}
      >
        {getSeatIcon()}
        
        {/* ✅ ENHANCED: Selection indicator with better animation */}
        {isSelected && (
          <div className="absolute -inset-1 bg-teal-400 rounded-lg opacity-30 animate-ping"></div>
        )}

        {/* ✅ MOBILE ENHANCED: Better positioned indicators */}
        {status === 'selected-by-other' && safeSeat.reservedUntil && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        )}

        {status === 'booked' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        )}
        
        {status === 'reserved' && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
        )}
      </button>

      {/* ✅ MOBILE ENHANCED: Improved tooltip with better mobile positioning */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 max-w-xs shadow-lg">
        <div className="font-medium text-center">{getTooltipText()}</div>
        
        {/* Additional info for certain statuses */}
        {status === 'selected-by-other' && safeSeat.reservedUntil && (
          <div className="text-gray-300 text-xs mt-1 text-center">
            Reserved until {new Date(safeSeat.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        
        {status === 'booked' && (
          <div className="text-gray-300 text-xs mt-1 text-center">
            Already sold
          </div>
        )}

        {/* Tooltip arrow */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
      </div>

      {/* ✅ NEW: Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {safeSeat.seatId}
        </div>
      )}
    </div>
  );
};

export default SeatButton;