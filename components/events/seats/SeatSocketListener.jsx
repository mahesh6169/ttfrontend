'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';

import {
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  handleSeatCleanup,
  selectCurrentEventId,
  selectSessionId,
  fetchSeatAvailability
} from '@/store/slices/events/seatSelectionSlice';

const SeatSocketListener = ({ eventId, children }) => {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const currentEventId = useSelector(selectCurrentEventId);
  
  // ✅ NEW: Track connection state and event join status
  const connectionStateRef = useRef({
    isConnected: false,
    hasJoinedEvent: false,
    eventId: null,
    sessionId: null
  });

  // ✅ ENHANCED: Robust socket connection and event room management
  useEffect(() => {
    if (!eventId || !sessionId) {
      console.log('🔌 SeatSocketListener: Missing eventId or sessionId', { eventId, sessionId });
      return;
    }

    const state = connectionStateRef.current;
    
    // ✅ IMPROVED: Connection management
    const ensureConnection = () => {
      if (!socket.connected) {
        console.log('🔌 SeatSocketListener: Connecting to socket...');
        socket.connect();
      }
    };

    // ✅ IMPROVED: Event room management
    const joinEventRoom = () => {
      if (socket.connected && eventId) {
        if (state.eventId !== eventId || !state.hasJoinedEvent) {
          // Leave previous room if different event
          if (state.eventId && state.eventId !== eventId && state.hasJoinedEvent) {
            console.log(`🚪 SeatSocketListener: Leaving previous event room: ${state.eventId}`);
            socket.emit('seat:leave_event', state.eventId);
          }

          // Join new event room
          console.log(`🚪 SeatSocketListener: Joining event room: ${eventId}`);
          socket.emit('seat:join_event', eventId);
          
          // Update state
          state.eventId = eventId;
          state.hasJoinedEvent = true;
          state.sessionId = sessionId;
        }
      }
    };

    // ✅ ENHANCED: Socket event handlers with better error handling
    const onConnect = () => {
      console.log('✅ SeatSocketListener: Socket connected');
      state.isConnected = true;
      joinEventRoom();
    };

    const onDisconnect = (reason) => {
      console.log('❌ SeatSocketListener: Socket disconnected:', reason);
      state.isConnected = false;
      state.hasJoinedEvent = false;
    };

    const onConnectError = (error) => {
      console.error('🔥 SeatSocketListener: Connection error:', error);
    };

    const onReconnect = (attemptNumber) => {
      console.log(`🔄 SeatSocketListener: Reconnected after ${attemptNumber} attempts`);
      state.isConnected = true;
      joinEventRoom();
      
      // ✅ NEW: Refresh seat availability after reconnection
      if (eventId) {
        dispatch(fetchSeatAvailability(eventId));
      }
    };

    // ✅ ENHANCED: Seat-specific event handlers
    const onSeatStatusChanged = (data) => {
      console.log('📡 SeatSocketListener: seat:status_changed:', data);
      
      // Validate event matches current event
      if (data.eventId && data.eventId !== eventId) {
        console.log(`⚠️ Ignoring seat update for different event: ${data.eventId} vs ${eventId}`);
        return;
      }

      dispatch(handleRemoteSeatUpdate(data));
    };

    const onUserDisconnected = (data) => {
      console.log('👤 SeatSocketListener: seat:user_disconnected:', data);
      
      // Validate event matches
      if (data.eventId && data.eventId !== eventId) {
        console.log(`⚠️ Ignoring user disconnect for different event: ${data.eventId} vs ${eventId}`);
        return;
      }

      dispatch(handleUserDisconnected(data));
    };

    const onCleanupCompleted = (data) => {
      console.log('🧹 SeatSocketListener: seat:cleanup_completed:', data);
      
      // Validate event matches
      if (data.eventId && data.eventId !== eventId) {
        console.log(`⚠️ Ignoring cleanup for different event: ${data.eventId} vs ${eventId}`);
        return;
      }

      dispatch(handleSeatCleanup(data));
      
      // Refresh seat availability if seats were released
      if (data.seatsReleased > 0) {
        console.log(`🔄 Refreshing seat availability after cleanup (${data.seatsReleased} seats released)`);
        dispatch(fetchSeatAvailability(eventId));
      }
    };

    // ✅ NEW: Handle seat reservation errors
    const onSeatReservationError = (data) => {
      console.error('❌ SeatSocketListener: seat:reservation_error:', data);
      
      if (data.eventId && data.eventId !== eventId) {
        return;
      }

      // Could dispatch an action to show error message
      // For now, just log
    };

    // ✅ NEW: Handle seat updates batch (for performance)
    const onSeatBatchUpdate = (data) => {
      console.log('📦 SeatSocketListener: seat:batch_update:', data);
      
      if (data.eventId && data.eventId !== eventId) {
        return;
      }

      // Process multiple seat updates at once
      if (data.updates && Array.isArray(data.updates)) {
        data.updates.forEach(update => {
          dispatch(handleRemoteSeatUpdate(update));
        });
      }
    };

    // Register socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect', onReconnect);
    socket.on('seat:status_changed', onSeatStatusChanged);
    socket.on('seat:user_disconnected', onUserDisconnected);
    socket.on('seat:cleanup_completed', onCleanupCompleted);
    socket.on('seat:reservation_error', onSeatReservationError);
    socket.on('seat:batch_update', onSeatBatchUpdate);

    // Initial connection setup
    ensureConnection();
    
    // Join room if already connected
    if (socket.connected) {
      joinEventRoom();
    }

    // ✅ ENHANCED: Cleanup function
    return () => {
      console.log('🧹 SeatSocketListener: Cleaning up...');
      
      // Leave event room
      if (state.hasJoinedEvent && state.eventId) {
        console.log(`🚪 SeatSocketListener: Leaving event room: ${state.eventId}`);
        socket.emit('seat:leave_event', state.eventId);
      }

      // Remove event listeners
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect', onReconnect);
      socket.off('seat:status_changed', onSeatStatusChanged);
      socket.off('seat:user_disconnected', onUserDisconnected);
      socket.off('seat:cleanup_completed', onCleanupCompleted);
      socket.off('seat:reservation_error', onSeatReservationError);
      socket.off('seat:batch_update', onSeatBatchUpdate);

      // Reset state
      state.isConnected = false;
      state.hasJoinedEvent = false;
      state.eventId = null;
      state.sessionId = null;
    };
  }, [dispatch, eventId, sessionId]);

  // ✅ NEW: Periodic heartbeat to maintain connection
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const heartbeatInterval = setInterval(() => {
      if (socket.connected && connectionStateRef.current.hasJoinedEvent) {
        socket.emit('seat:heartbeat', {
          eventId,
          sessionId,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [eventId, sessionId]);

  // ✅ NEW: Handle page visibility changes (pause/resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📴 SeatSocketListener: Page hidden, reducing activity');
      } else {
        console.log('👁️ SeatSocketListener: Page visible, resuming activity');
        
        // Refresh seat availability when page becomes visible again
        if (eventId && socket.connected) {
          dispatch(fetchSeatAvailability(eventId));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch, eventId]);

  // ✅ NEW: Handle browser beforeunload (cleanup on page close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = connectionStateRef.current;
      
      if (state.hasJoinedEvent && state.eventId && socket.connected) {
        console.log('🚪 SeatSocketListener: Page unloading, leaving event room');
        socket.emit('seat:leave_event', state.eventId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ✅ NEW: Debug information (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logInterval = setInterval(() => {
        const state = connectionStateRef.current;
        console.log('🔍 SeatSocketListener Debug:', {
          connected: socket.connected,
          hasJoinedEvent: state.hasJoinedEvent,
          eventId: state.eventId,
          sessionId: state.sessionId?.substring(0, 12) + '...',
          currentEventId,
          listenerCount: socket.listenerCount('seat:status_changed')
        });
      }, 60000); // Every minute

      return () => clearInterval(logInterval);
    }
  }, [currentEventId]);

  // ✅ ENHANCED: Render children or status indicator
  if (children) {
    return children;
  }

  // Optional: Return a connection status indicator
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-xs font-medium transition-all duration-200 ${
        socket.connected 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          socket.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
        <span>
          {socket.connected ? 'Live updates active' : 'Connecting...'}
        </span>
        {connectionStateRef.current.hasJoinedEvent && (
          <span className="text-xs opacity-75">
            • Room joined
          </span>
        )}
      </div>
    </div>
  );
};

export default SeatSocketListener;