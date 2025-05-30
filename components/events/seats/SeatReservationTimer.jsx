// components/events/seats/SeatReservationTimer.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  releaseReservation, 
  extendReservation,
  updateReservationTimer 
} from '@/store/slices/events/seatSelectionSlice';

const SeatReservationTimer = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const { 
    currentReservation, 
    currentEventId 
  } = useSelector((state) => state.seatSelection);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showExtendOption, setShowExtendOption] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    if (!currentReservation?.reservedUntil) {
      setTimeLeft(0);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(currentReservation.reservedUntil).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        setShowExtendOption(false);
        // Auto-redirect after expiry
        setTimeout(() => {
          alert('Your seat reservation has expired. Please select seats again.');
          router.back();
        }, 2000);
      } else {
        setTimeLeft(remaining);
        setIsExpired(false);
        // Show extend option when less than 2 minutes left
        setShowExtendOption(remaining < 2 * 60 * 1000);
      }

      // Update Redux store
      dispatch(updateReservationTimer(remaining));
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentReservation, dispatch, router]);

  // Format time as MM:SS
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle extend reservation
  const handleExtendReservation = async () => {
    if (!currentReservation || isExtending) return;

    setIsExtending(true);
    try {
      await dispatch(extendReservation({
        eventId: currentEventId,
        reservationId: currentReservation.reservationId
      })).unwrap();
      
      setShowExtendOption(false);
    } catch (error) {
      console.error('❌ Failed to extend reservation:', error);
      alert('Failed to extend reservation. Please complete your purchase quickly.');
    } finally {
      setIsExtending(false);
    }
  };

  // Don't show timer if no active reservation
  if (!currentReservation) {
    return null;
  }

  // Get timer styling based on time remaining
  const getTimerStyle = () => {
    if (isExpired) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (timeLeft < 2 * 60 * 1000) { // Less than 2 minutes
      return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    } else if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else {
      return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  // Get timer icon
  const getTimerIcon = () => {
    if (isExpired) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Timer display */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTimerStyle()}`}>
        {getTimerIcon()}
        <div className="text-sm font-medium">
          {isExpired ? (
            <span>Expired</span>
          ) : (
            <span>
              <span className="hidden sm:inline">Time left: </span>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Extend button */}
      {showExtendOption && !isExpired && (
        <button
          onClick={handleExtendReservation}
          disabled={isExtending}
          className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtending ? (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span>Extending...</span>
            </div>
          ) : (
            '+10 min'
          )}
        </button>
      )}

      {/* Mobile warning for low time */}
      {timeLeft < 2 * 60 * 1000 && timeLeft > 0 && (
        <div className="block sm:hidden">
          <svg className="w-5 h-5 text-red-500 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default SeatReservationTimer;