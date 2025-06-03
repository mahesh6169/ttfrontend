'use client';

import React, { useState, useEffect, useCallback } from 'react';

const SeatReservationTimer = ({ expiryTime, onExpire, eventId  }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Memoized expire handler
  const handleExpire = useCallback(() => {
    if (!isExpired) {
      setIsExpired(true);
      if (onExpire) onExpire(); // 👈 Trigger external logic
    }
  }, [isExpired, onExpire]);

  // Main countdown effect
  useEffect(() => {
    if (!expiryTime) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        handleExpire();
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer(); // Run immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
}, [expiryTime, handleExpire, eventId]); 

  // Format time as MM:SS
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Style based on urgency
  const getTimerStyle = () => {
    if (isExpired) return 'bg-red-100 text-red-800 border-red-300';
    if (timeLeft < 2 * 60 * 1000) return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
    if (timeLeft < 5 * 60 * 1000) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  // Icon
  const getTimerIcon = () => {
    if (isExpired) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  // If no expiry, render nothing
  if (!expiryTime) return null;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getTimerStyle()}`}>
      {getTimerIcon()}
      <div className="text-sm font-medium">
        {isExpired ? (
          <span>Expired</span>
        ) : (
          <>
            <span className="hidden sm:inline">Time left: </span>
            {formatTime(timeLeft)}
          </>
        )}
      </div>
    </div>
  );
};

export default SeatReservationTimer;
