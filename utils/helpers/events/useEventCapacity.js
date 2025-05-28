// hooks/useEventCapacity.js

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useEventCapacity = (eventId) => {
  const [capacityData, setCapacityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchCapacity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_BASE_URL}/events/${eventId}/capacity`);

        
        if (response.data.success) {
          setCapacityData(response.data.data);
        } else {
          setError('Failed to fetch capacity data');
        }
      } catch (err) {
        console.error('Error fetching event capacity:', err);
        setError(err.response?.data?.message || 'Failed to fetch capacity data');
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [eventId]);

  const refreshCapacity = () => {
    if (eventId) {
      setLoading(true);
      fetchCapacity();
    }
  };

  return {
    capacityData,
    loading,
    error,
    refreshCapacity
  };
};