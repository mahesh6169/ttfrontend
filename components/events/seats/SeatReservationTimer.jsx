'use client';

import React, { useState, useEffect, useCallback } from 'react';

const SeatReservationTimer = ({ expiryTime, onExpire, eventId, pauseWhenNavigating = false, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  // ✅ ENHANCED: Memoized expire handler with better logging
  const handleExpire = useCallback(() => {
    if (!isExpired) {
      console.log(`⏰ Timer expired for event ${eventId} at ${new Date().toISOString()}`);
      setIsExpired(true);
      setTimeLeft(0);
      
      if (onExpire) {
        console.log('🔔 Triggering expiration callback');
        onExpire();
      } else {
        console.warn('⚠️ No expiration callback provided');
      }
    }
  }, [isExpired, onExpire, eventId]);

  // ✅ IMPROVED: Enhanced countdown with warning states
  useEffect(() => {
    if (!expiryTime) {
      console.log('⏸️ No expiry time provided to timer');
      return;
    }

    // Reset states when expiry time changes
    setIsExpired(false);
    setIsWarning(false);

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsWarning(false);
        handleExpire();
      } else {
        setTimeLeft(remaining);
        
        // Set warning state if less than 2 minutes remaining
        const warningThreshold = 2 * 60 * 1000; // 2 minutes in milliseconds
        setIsWarning(remaining <= warningThreshold);
      }
    };

    // Run immediately to avoid delay
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [expiryTime, handleExpire, eventId]);

  // ✅ IMPROVED: Better time formatting with hours support
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // ✅ ENHANCED: Dynamic styling based on time remaining and state
  const getTimerStyle = () => {
    const baseStyles = 'flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200';

    if (isExpired) {
      return `${baseStyles} bg-red-100 text-red-800 border-red-300`;
    }
    
    if (isWarning) {
      // Less than 2 minutes - urgent warning
      if (timeLeft < 60 * 1000) { // Less than 1 minute
        return `${baseStyles} bg-red-100 text-red-800 border-red-300 animate-pulse`;
      } else { // 1-2 minutes
        return `${baseStyles} bg-amber-100 text-amber-800 border-amber-300`;
      }
    }
    
    // More than 2 minutes - normal state
    return `${baseStyles} bg-green-100 text-green-800 border-green-300`;
  };

  // ✅ ENHANCED: Dynamic icons based on state
  const getTimerIcon = () => {
    if (isExpired) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-label="Expired">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    if (isWarning) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-label="Warning">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Timer">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  // ✅ ENHANCED: Better accessibility and user messaging
  const getTimerMessage = () => {
    if (isExpired) {
      return {
        title: 'Reservation Expired',
        subtitle: 'Please select seats again'
      };
    }

    if (isWarning) {
      if (timeLeft < 60 * 1000) {
        return {
          title: `⚡ ${formatTime(timeLeft)}`,
          subtitle: 'Complete purchase now!'
        };
      } else {
        return {
          title: `⚠️ ${formatTime(timeLeft)}`,
          subtitle: 'Time running out'
        };
      }
    }

    return {
      title: formatTime(timeLeft),
      subtitle: 'remaining to complete purchase'
    };
  };

  // ✅ IMPROVED: Enhanced progress bar
  const getProgressPercentage = () => {
    if (!expiryTime || isExpired) return 0;
    
    // Calculate based on original reservation time (assume 10 minutes total)
    const totalReservationTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    const remainingPercentage = (timeLeft / totalReservationTime) * 100;
    return Math.max(0, Math.min(100, remainingPercentage));
  };

  // ✅ ENHANCED: Progress bar color based on time remaining
  const getProgressBarColor = () => {
    const percentage = getProgressPercentage();
    
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // If no expiry time provided, don't render
  if (!expiryTime) {
    console.log('⏸️ Timer not rendered - no expiry time');
    return null;
  }

  const message = getTimerMessage();
  const progressPercentage = getProgressPercentage();

  // Compact mode - just timer with hourglass icon
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-amber-700">Seat reservation expires in </span>
        <span className={`font-medium ${isWarning ? 'text-amber-600' : 'text-gray-700'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
    );
  }

  // Full display mode
  return (
    <div className="space-y-3">
      {/* Main timer display */}
      <div className={getTimerStyle()}>
        {getTimerIcon()}
        <div className="flex-1">
          <div className="font-semibold">
            {message.title}
          </div>
          <div className="text-xs opacity-75">
            {message.subtitle}
          </div>
        </div>
        
        {/* Status indicator */}
        {!isExpired && (
          <div className="text-xs text-right">
            <div className="opacity-75">
              {Math.ceil(timeLeft / (60 * 1000))} min
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isExpired && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor()}`}
            style={{ 
              width: `${progressPercentage}%`,
              transition: 'width 1s ease-out'
            }}
          />
        </div>
      )}

      {/* Additional info for warning states */}
      {isWarning && !isExpired && (
        <div className="text-center">
          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
            💡 Your seats will be automatically released if payment is not completed in time
          </div>
        </div>
      )}

      {/* Expired state help */}
      {isExpired && (
        <div className="text-center">
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            🔄 Your reservation has expired. Please select your seats again to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatReservationTimer;