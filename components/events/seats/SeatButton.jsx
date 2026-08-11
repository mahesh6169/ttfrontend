// components/events/seats/SeatButton.jsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MdEventSeat, MdClose } from 'react-icons/md';

const SeatButton = ({
  seat,
  row,
  isSelected = false,
  isReservedByUser = false,
  onClick,
  disabled = false,
  userId = null,
  showNumber = false, // reveal the seat number on the face when zoomed in (parity with the builder)
}) => {
  // Tap-driven card reveal for mobile: a tap shows the Row/Seat card for ~2s then fades (desktop still
  // uses CSS hover). Hooks stay above the early return below so their order never changes between renders.
  const [tapCard, setTapCard] = useState(false);
  const tapTimerRef = useRef(null);
  useEffect(() => () => { if (tapTimerRef.current) clearTimeout(tapTimerRef.current); }, []);
  const revealCard = () => {
    setTapCard(true);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setTapCard(false), 2000);
  };

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
    // Organiser not-for-sale (events-blocked-seats.md): grey/X, never selectable.
    if (safeSeat.status === 'blocked') return 'blocked';
    
    // Priority 3: Selected by another user
    if (otherUserHolding) return 'selected-by-other';
    
    // Default: available
    return 'available';
  };

  const status = getSeatStatus();

  // ✅ MOBILE ENHANCED: Improved styling with better mobile UX and compact design
  const getSeatStyles = () => {
    const baseStyles =
      'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded text-[8px] sm:text-[10px] md:text-xs font-medium border transition-all duration-200 flex items-center justify-center cursor-pointer select-none relative overflow-hidden touch-manipulation';

    switch (status) {
      case 'selected':
        return `${baseStyles} bg-teal-700 text-white border-teal-800 shadow-md`;
      case 'available':
        // Hover styling is gated to true hover devices ([@media(hover:hover)]). On touch screens a
        // "sticky hover" would (a) pin the card open past its 2s timer and (b) make the FIRST tap only
        // trigger hover (revealing the card) instead of firing the click - so the seat never selects.
        return `${baseStyles} bg-teal-50 text-teal-700 border-teal-400 [@media(hover:hover)]:hover:bg-teal-100 [@media(hover:hover)]:hover:border-teal-500 [@media(hover:hover)]:hover:shadow-sm`;
      case 'selected-by-other':
        return `${baseStyles} bg-amber-400 text-amber-900 border-amber-500 cursor-not-allowed`;
      case 'booked':
        return `${baseStyles} bg-red-500 text-white border-red-600 cursor-not-allowed`;
      case 'reserved':
        // Organiser-reserved (held for organiser use). Purple across builder + attendee map, never grey.
        return `${baseStyles} bg-purple-600 text-white border-purple-700 cursor-not-allowed`;
      case 'blocked':
        // Not for sale: grey with an X (getSeatIcon), unclickable. Distinct from booked (red).
        return `${baseStyles} bg-slate-200 text-slate-500 border-slate-400 cursor-not-allowed`;
      default:
        return `${baseStyles} bg-slate-100 text-slate-600 border-slate-300`;
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
      case 'blocked':
        return `${seatLabel} - Not for sale`;
      default:
        return seatLabel;
    }
  };

  // ✅ IMPROVED: Enhanced click handling with logging
  const handleClick = (e) => {
    e?.preventDefault();

    // Tapping a seat always shows its Row/Seat card (mobile), AND still selects it when allowed - do both.
    revealCard();

    const canClick = !disabled &&
                    status !== 'booked' &&
                    status !== 'reserved' &&
                    status !== 'blocked' &&
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
    // Not-for-sale seats show an X instead of the seat icon (the grey/X look).
    if (status === 'blocked') {
      return <MdClose className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />;
    }
    // Zoomed in enough: show the seat number on the face (parity with the builder). Otherwise the icon.
    if (showNumber) {
      return <span className="leading-none">{safeSeat.seatNumber}</span>;
    }
    return <MdEventSeat className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />;
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
      'aria-disabled': disabled || status === 'booked' || status === 'reserved' || status === 'blocked' || status === 'selected-by-other',
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
    <div className="relative group seat-button">
      <button
        className={`${getSeatStyles()} ${getAnimationClasses()}`}
        onClick={handleClick}
        onKeyPress={handleKeyPress}
        disabled={
          disabled ||
          status === 'booked' ||
          status === 'reserved' ||
          status === 'blocked' ||
          status === 'selected-by-other'
        }
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
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-400 rounded-full"></div>
        )}
      </button>

      {/* Row + Seat card, no status word (the seat colour + legend already say the state) and no price.
          Desktop: shows on hover. Mobile: a tap reveals it for ~2s then it fades (tapCard). Compact on
          mobile so it covers fewer neighbours. pointer-events-none so it never blocks a tap. */}
      <div
        data-testid="seat-hover-card"
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-1.5 rounded-md sm:rounded-lg border border-slate-200 bg-white px-2 py-1 sm:px-3 sm:py-2 ${tapCard ? 'opacity-100' : 'opacity-0'} [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30 shadow-lg`}
      >
        <div className="flex items-baseline justify-center gap-0.5 sm:gap-1 text-slate-800">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400">Row</span>
          <span className="text-xs sm:text-sm font-bold">{safeRow.rowLabel}</span>
          <span className="ml-1.5 sm:ml-2 text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400">Seat</span>
          <span className="text-xs sm:text-sm font-bold">{safeSeat.seatNumber}</span>
        </div>
        {/* Card arrow */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
      </div>
    </div>
  );
};

export default SeatButton;