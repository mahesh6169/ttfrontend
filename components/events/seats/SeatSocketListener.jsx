'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';

import {
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  selectCurrentEventId,
  selectSessionId
} from '@/store/slices/events/seatSelectionSlice';

const SeatSocketListener = () => {
  const dispatch = useDispatch();
  const eventId = useSelector(selectCurrentEventId);
  const sessionId = useSelector(selectSessionId);

  useEffect(() => {
    if (!eventId || !sessionId) return;

    if (!socket.connected) {
      console.log('[SeatSocket] Connecting...');
      socket.connect();
    }

    // Join event room
    socket.emit('seat:join_event', eventId);
    console.log(`[SeatSocket] Joined seat room for event: ${eventId}`);

    // Socket listeners
    const onSeatStatusChanged = (data) => {
      console.log('[SeatSocket] seat:status_changed:', data);
      dispatch(handleRemoteSeatUpdate(data));
    };

    const onUserDisconnected = (data) => {
      console.log('[SeatSocket] seat:user_disconnected:', data);
      dispatch(handleUserDisconnected(data));
    };

    const onCleanupCompleted = (data) => {
      console.log('[SeatSocket] seat:cleanup_completed:', data);
      // Optional: implement UI refresh logic if needed
    };

    socket.on('seat:status_changed', onSeatStatusChanged);
    socket.on('seat:user_disconnected', onUserDisconnected);
    socket.on('seat:cleanup_completed', onCleanupCompleted);

    return () => {
      socket.emit('seat:leave_event', eventId);
      console.log(`[SeatSocket] Left seat room for event: ${eventId}`);

      socket.off('seat:status_changed', onSeatStatusChanged);
      socket.off('seat:user_disconnected', onUserDisconnected);
      socket.off('seat:cleanup_completed', onCleanupCompleted);
    };
  }, [dispatch, eventId, sessionId]);

  return null;
};

export default SeatSocketListener;
