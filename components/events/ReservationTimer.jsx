import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { useRouter } from 'next/navigation';

const ReservationTimer = ({
  expiresAt,
  eventId,
  reservationId,
  onExpire,
  onClear,
  mode = 'tickets', // 'tickets' | 'seats' | 'checkout'
  hasSeatingLayout = false, // only needed for checkout mode
  showClear = true // tickets page hides it — Back already releases + returns
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

  // Borderless, minimal — a plain line (no box). Urgency reads through red text,
  // not a coloured panel. "Clear" is a quiet teal text action.
  return (
    <div className="flex items-center gap-2 text-sm sm:text-base">
      <svg
        className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isExpired || isWarning ? 'text-red-600' : 'text-slate-500'}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <div className="flex-1 min-w-0 whitespace-nowrap">
        {isExpired ? (
          <span className="font-medium text-red-600">Reservation expired</span>
        ) : (
          <span className={`font-semibold tabular-nums ${isWarning ? 'text-red-600' : 'text-slate-900'}`}>
            {formatTime(timeRemaining)}
          </span>
        )}
      </div>

      {!isExpired && showClear && (
        <button
          onClick={handleClearReservation}
          disabled={isClearing}
          className="shrink-0 text-sm font-semibold text-teal-700 hover:text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={mode === 'seats' ? 'Clear seats and go back to tickets' : 'Clear reservation and release tickets/seats'}
        >
          {isClearing ? 'Clearing...' : 'Clear'}
        </button>
      )}
    </div>
  );
};

export default ReservationTimer;
