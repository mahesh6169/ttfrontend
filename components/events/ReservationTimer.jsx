import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const ReservationTimer = ({ 
  expiresAt, 
  eventId, 
  reservationId,
  onExpire,
  onClear,
  mode = 'tickets', // 'tickets' | 'seats' | 'checkout'
  hasSeatingLayout = false // only needed for checkout mode
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      return Math.floor(remaining / 1000); // Convert to seconds
    };

    // Set initial time
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        
        // Delete the expired reservation
        if (eventId && reservationId) {
          // First try to delete the specific reservation
          axios.delete(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservationId}`,
            { withCredentials: true }
          ).catch(err => {
            console.log('Delete reservation error:', err);
          });
          
          // Also trigger general cleanup
          axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/cleanup`,
            {},
            { withCredentials: true }
          ).catch(err => {
            console.log('Cleanup error:', err);
          });
        }
        
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, eventId, reservationId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClearReservation = async () => {
    if (!reservationId || isClearing) return;

    try {
      setIsClearing(true);
      
      if (mode === 'seats') {
        // For seats page: only clear seats, keep tickets
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservationId}/seats`,
          { seatIds: [] }, // Empty array to clear seats
          { withCredentials: true }
        );

        if (response.data.success) {
          if (onClear) {
            onClear();
          } else {
            // Default: go back to tickets page
            router.push(`/events/tickets/${eventId}`);
          }
        }
      } else {
        // For tickets and checkout pages: delete entire reservation
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/reservation/${reservationId}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          if (onClear) {
            onClear();
          } else {
            // Default behavior: redirect to event page
            router.push(`/events/view/${eventId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing reservation:', error);
      alert('Failed to clear reservation. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  if (!expiresAt || timeRemaining === null) return null;

  const isExpired = timeRemaining <= 0;
  const isWarning = timeRemaining <= 120; // Last 2 minutes

  return (
    <div className={`reservation-timer ${isWarning ? 'warning' : ''} ${isExpired ? 'expired' : ''}`}>
      <div className="timer-content">
        <div className="timer-icon">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="timer-text">
          {isExpired ? (
            <span className="expired-text">Reservation expired</span>
          ) : (
            <>
              <span className="timer-label">Time remaining: </span>
              <span className="timer-countdown">{formatTime(timeRemaining)}</span>
            </>
          )}
        </div>
        {!isExpired && (
          <button
            onClick={handleClearReservation}
            disabled={isClearing}
            className="clear-button"
            title={mode === 'seats' ? "Clear seats and go back to tickets" : "Clear reservation and release tickets/seats"}
          >
            {isClearing ? 'Clearing...' : 'Clear'}
          </button>
        )}
      </div>
      
      <style jsx>{`
        /* Mobile-first styles */
        .reservation-timer {
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .reservation-timer.warning {
          background-color: #fef3c7;
          border-color: #f59e0b;
        }

        .reservation-timer.expired {
          background-color: #fee2e2;
          border-color: #ef4444;
        }

        .timer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.375rem;
        }

        .timer-icon {
          flex-shrink: 0;
          color: #6b7280;
        }

        .warning .timer-icon {
          color: #f59e0b;
        }

        .expired .timer-icon {
          color: #ef4444;
        }

        .timer-text {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
        }

        .timer-label {
          color: #6b7280;
        }

        .timer-countdown {
          font-weight: 600;
          color: #111827;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.75rem;
        }

        .warning .timer-countdown {
          color: #d97706;
        }

        .expired-text {
          color: #ef4444;
          font-weight: 500;
          font-size: 0.75rem;
        }

        .clear-button {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .clear-button:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
        }

        .clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Tablet styles (sm breakpoint) */
        @media (min-width: 640px) {
          .reservation-timer {
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .timer-content {
            gap: 0.5rem;
          }

          .timer-text {
            font-size: 0.875rem;
          }

          .timer-countdown {
            font-size: 0.875rem;
          }

          .expired-text {
            font-size: 0.875rem;
          }

          .clear-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
            border-radius: 0.375rem;
          }
        }

        /* Desktop styles (lg breakpoint) */
        @media (min-width: 1024px) {
          .reservation-timer {
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .timer-text {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ReservationTimer;