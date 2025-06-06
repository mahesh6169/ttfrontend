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

// ✅ ENHANCED: Robust socket connection with proper cleanup
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

  // ✅ IMPROVED: Event room management with session tracking
  const joinEventRoom = () => {
    if (socket.connected && eventId && sessionId) {
      if (state.eventId !== eventId || !state.hasJoinedEvent) {
        // Leave previous room if different event
        if (state.eventId && state.eventId !== eventId && state.hasJoinedEvent) {
          console.log(`🚪 SeatSocketListener: Leaving previous event room: ${state.eventId}`);
          socket.emit('seat:leave_event', state.eventId);
        }

        // Join new event room and set session
        console.log(`🚪 SeatSocketListener: Joining event room: ${eventId}`);
        socket.emit('seat:join_event', eventId);
        socket.emit('seat:set_session', sessionId); // ✅ NEW: Send session ID
        
        // Update state
        state.eventId = eventId;
        state.hasJoinedEvent = true;
        state.sessionId = sessionId;
      }
    }
  };

  // ✅ ENHANCED: Socket event handlers
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
    
    // Refresh seat availability after reconnection
    if (eventId) {
      dispatch(fetchSeatAvailability(eventId));
    }
  };

  // ✅ ENHANCED: Seat-specific event handlers with bug fixes
  const onSeatStatusChanged = (data) => {
    console.log('📡 SeatSocketListener: seat:status_changed:', data);
    
    if (data.eventId && data.eventId !== eventId) {
      console.log(`⚠️ Ignoring seat update for different event: ${data.eventId} vs ${eventId}`);
      return;
    }

    dispatch(handleRemoteSeatUpdate(data));
  };

  const onUserDisconnected = (data) => {
    console.log('👤 SeatSocketListener: seat:user_disconnected:', data);
    
    if (data.eventId && data.eventId !== eventId) {
      console.log(`⚠️ Ignoring user disconnect for different event: ${data.eventId} vs ${eventId}`);
      return;
    }

    dispatch(handleUserDisconnected(data));
    
    // ✅ NEW: Refresh seat availability after user disconnect cleanup
    if (data.seatsReleased && data.seatsReleased.length > 0) {
      console.log(`🔄 Refreshing seats after user disconnect (${data.seatsReleased.length} seats released)`);
      setTimeout(() => {
        dispatch(fetchSeatAvailability(eventId));
      }, 500); // Small delay to ensure backend cleanup is complete
    }
  };

  // ✅ NEW: Handle user cleanup completion (fixes amber stuck bug)
  const onUserCleanupCompleted = (data) => {
    console.log('🧹 SeatSocketListener: seat:user_cleanup_completed:', data);
    
    if (data.eventId && data.eventId !== eventId) {
      return;
    }

    // Dispatch cleanup action
    dispatch(handleSeatCleanup(data));
    
    // Force refresh seat availability to clear any stuck states
    if (data.seatsReleased > 0) {
      console.log(`🔄 Force refreshing seats after cleanup (${data.seatsReleased} seats freed)`);
      dispatch(fetchSeatAvailability(eventId));
    }
  };

  const onCleanupCompleted = (data) => {
    console.log('🧹 SeatSocketListener: seat:cleanup_completed:', data);
    
    if (data.eventId && data.eventId !== eventId) {
      return;
    }

    dispatch(handleSeatCleanup(data));
    
    if (data.seatsReleased > 0) {
      console.log(`🔄 Refreshing seat availability after cleanup (${data.seatsReleased} seats released)`);
      dispatch(fetchSeatAvailability(eventId));
    }
  };

  // Register socket event listeners
  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('connect_error', onConnectError);
  socket.on('reconnect', onReconnect);
  socket.on('seat:status_changed', onSeatStatusChanged);
  socket.on('seat:user_disconnected', onUserDisconnected);
  socket.on('seat:user_cleanup_completed', onUserCleanupCompleted); // ✅ NEW
  socket.on('seat:cleanup_completed', onCleanupCompleted);

  // Initial connection setup
  ensureConnection();
  
  if (socket.connected) {
    joinEventRoom();
  }

  // ✅ ENHANCED: Cleanup function with proper leave event
  return () => {
    console.log('🧹 SeatSocketListener: Cleaning up...');
    
    // Leave event room with session cleanup
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
    socket.off('seat:user_cleanup_completed', onUserCleanupCompleted);
    socket.off('seat:cleanup_completed', onCleanupCompleted);

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

// ✅ SAFE DEBUG VERSION (optional - you can just delete this entirely)
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const logInterval = setInterval(() => {
      const state = connectionStateRef.current;
      console.log('🔍 SeatSocketListener Debug:', {
        connected: socket.connected,
        hasJoinedEvent: state.hasJoinedEvent,
        eventId: state.eventId,
        sessionId: state.sessionId?.substring(0, 12) + '...',
        currentEventId
        // Removed problematic listenerCount
      });
    }, 60000);

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