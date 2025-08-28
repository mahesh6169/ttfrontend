'use client';

import { useEffect, useRef } from 'react';
import socket from '@/config/socket';

const SeatSocketListenerNoRedux = ({ 
  eventId, 
  onSeatUpdate, // Callback to update parent component
  onSocketConnected,
  onSocketJoinedRoom,
  children 
}) => {
  // Tracks socket connection state to prevent duplicate listeners and room joins
  const connectionStateRef = useRef({
    isConnected: false,
    hasJoinedEvent: false,
    eventId: null,
    listenersAttached: false
  });

  // Sets up socket event listeners once on component mount
  useEffect(() => {
    const state = connectionStateRef.current;
    
    // Prevent duplicate event listeners
    if (state.listenersAttached) return;

    // Handles successful socket connection
    const onConnect = () => {
      state.isConnected = true;
      onSocketConnected?.(true);
      
      // Auto-join event room if we have required data
      if (eventId && !state.hasJoinedEvent) {
        joinEventRoom();
      }
    };

    // Handles socket disconnection and resets room state
    const onDisconnect = (reason) => {
      state.isConnected = false;
      state.hasJoinedEvent = false;
      onSocketConnected?.(false);
      onSocketJoinedRoom?.(false);
    };

    // Handles socket reconnection and refreshes seat data
    const onReconnect = (attemptNumber) => {
      state.isConnected = true;
      onSocketConnected?.(true);
      
      if (eventId) {
        joinEventRoom();
        // Trigger parent to refresh seat data
        onSeatUpdate?.({ type: 'reconnect' });
      }
    };
    
    // Processes real-time seat status changes
    const onSeatStatusChanged = (data) => {
      // Only process events for the current event
      if (data.eventId && data.eventId !== eventId) return;
      
      // Notify parent component to update seat status
      onSeatUpdate?.({
        type: 'seat_update',
        seatId: data.seatId,
        status: data.status,
        reservedBy: data.reservedBy,
        reservedUntil: data.reservedUntil,
        operationType: data.operationType
      });
    };

    // Handle user's own reservation events
    const onReservationConfirmed = (data) => {
      if (data.eventId !== eventId) return;
      console.log('✅ Reservation confirmed by backend:', data.reservation);
    };
    
    const onReservationReleased = (data) => {
      if (data.eventId !== eventId) return;
      console.log('🔓 Reservation released by backend:', data.releasedSeats);
    };

    // Joins the event-specific socket room for targeted broadcasts
    const joinEventRoom = () => {
      if (socket.connected && eventId && !state.hasJoinedEvent) {
        socket.emit('seat:join_event', eventId);
        
        state.eventId = eventId;
        state.hasJoinedEvent = true;
        onSocketJoinedRoom?.(true);
      }
    };

    // Register all socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('seat:status_changed', onSeatStatusChanged);
    socket.on('seat:reservation_confirmed', onReservationConfirmed);
    socket.on('seat:reservation_released', onReservationReleased);

    state.listenersAttached = true;

    // Initialize socket connection if not already connected
    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    // Cleanup function runs only on component unmount
    return () => {
      // Remove all event listeners to prevent memory leaks
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('seat:status_changed', onSeatStatusChanged);
      socket.off('seat:reservation_confirmed', onReservationConfirmed);
      socket.off('seat:reservation_released', onReservationReleased);

      state.listenersAttached = false;
      state.hasJoinedEvent = false;
    };
  }, []); // Only run once on mount

  // Handles joining new event rooms when eventId changes
  useEffect(() => {
    const state = connectionStateRef.current;
    
    if (eventId && socket.connected && !state.hasJoinedEvent) {
      // Join the new event room
      socket.emit('seat:join_event', eventId);
      
      state.eventId = eventId;
      state.hasJoinedEvent = true;
      onSocketJoinedRoom?.(true);
    }
  }, [eventId, onSocketJoinedRoom]);

  // Renders children or nothing
  return children || null;
};

export default SeatSocketListenerNoRedux;