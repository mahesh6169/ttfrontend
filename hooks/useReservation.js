import { useState, useEffect, useCallback } from 'react';
import axios from '@/utils/axiosConfig';

const useReservation = (eventId) => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservation = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/seats/my-reservations`
      );
      
      // The API returns an array of reservations, get the active one
      const activeReservation = response.data.reservations?.find(
        res => res.status === 'reserved' && new Date(res.expiresAt) > new Date()
      );
      
      if (activeReservation) {
        // Transform to match the expected format
        const transformedReservation = {
          reservationId: activeReservation._id,
          eventId: activeReservation.eventId,
          userId: activeReservation.userId,
          sessionId: activeReservation.sessionId,
          seatIds: activeReservation.seats.map(seat => seat.seatId),
          seats: activeReservation.seats,
          reservedUntil: activeReservation.expiresAt,
          status: activeReservation.status,
          createdAt: activeReservation.createdAt
        };
        setReservation(transformedReservation);
      } else {
        setReservation(null);
      }
    } catch (err) {
      console.error('Error fetching reservation:', err);
      setError(err.response?.data?.message || 'Failed to fetch reservation');
      setReservation(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const releaseReservation = useCallback(async () => {
    if (!eventId || !reservation) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/seats/reserve`
      );
      setReservation(null);
    } catch (err) {
      console.error('Error releasing reservation:', err);
      throw err;
    }
  }, [eventId, reservation]);

  const extendReservation = useCallback(async () => {
    if (!eventId || !reservation) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/seats/extend`
      );
      
      if (response.data.reservation) {
        const updatedReservation = {
          ...reservation,
          reservedUntil: response.data.reservation.expiresAt
        };
        setReservation(updatedReservation);
      }
    } catch (err) {
      console.error('Error extending reservation:', err);
      throw err;
    }
  }, [eventId, reservation]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  // Poll for reservation updates every 30 seconds
  useEffect(() => {
    if (!eventId) return;
    
    const interval = setInterval(() => {
      fetchReservation();
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId, fetchReservation]);

  return {
    reservation,
    loading,
    error,
    refetch: fetchReservation,
    releaseReservation,
    extendReservation
  };
};

export default useReservation;