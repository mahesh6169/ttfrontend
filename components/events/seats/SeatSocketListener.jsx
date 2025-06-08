'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';

import {
  handleRemoteSeatUpdate,
  selectSessionId,
  fetchSeatAvailability
} from '@/store/slices/events/seatSelectionSlice';

const SeatSocketListener = ({ eventId, children }) => {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  
  // Tracks socket connection state to prevent duplicate listeners and room joins
  const connectionStateRef = useRef({
    isConnected: false,
    hasJoinedEvent: false,
    eventId: null,
    sessionId: null,
    listenersAttached: false
  });


  
  // Sets up socket event listeners once on component mount
  useEffect(() => {
    const state = connectionStateRef.current;
    
    // Prevent duplicate event listeners
    if (state.listenersAttached) return;

    // Handles successful socket connection
    const onConnect = () => {
      //console.log('✅ Seat Selection Socket connected');
      state.isConnected = true;
      
      // Auto-join event room if we have required data
      if (eventId && sessionId && !state.hasJoinedEvent) {
        joinEventRoom();
      }
    };

    // Handles socket disconnection and resets room state
    const onDisconnect = (reason) => {
      //console.log('❌ Seat Selection Socket disconnected:', reason);
      state.isConnected = false;
      state.hasJoinedEvent = false;
    };

    // Handles socket reconnection and refreshes seat data
    const onReconnect = (attemptNumber) => {
      //console.log(`🔄 Seat Selection Socket Reconnected after ${attemptNumber} attempts`);
      state.isConnected = true;
      
      if (eventId && sessionId) {
        joinEventRoom();
        // Refresh seat data to catch any missed updates during disconnection
        dispatch(fetchSeatAvailability(eventId));
      }
    };
    
    // Processes real-time seat status changes from other users
    const onSeatStatusChanged = (data) => {
      // Only process events for the current event
      if (data.eventId && data.eventId !== eventId) return;
      dispatch(handleRemoteSeatUpdate(data));
    };



    // Joins the event-specific socket room for targeted broadcasts
    const joinEventRoom = () => {
      if (socket.connected && eventId && sessionId && !state.hasJoinedEvent) {
        //console.log(`🚪 Seat Selection Socket Joining event room: ${eventId}`);
        socket.emit('seat:join_event', eventId);
        
        state.eventId = eventId;
        state.hasJoinedEvent = true;
        state.sessionId = sessionId;
      }
    };

    // Register all socket event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('seat:status_changed', onSeatStatusChanged);

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



      state.listenersAttached = false;
      state.hasJoinedEvent = false;
    };
  }, []);

  // Handles joining new event rooms when eventId or sessionId changes
  useEffect(() => {
    const state = connectionStateRef.current;
    
    if (eventId && sessionId && socket.connected && !state.hasJoinedEvent) {



      // Join the new event room
      socket.emit('seat:join_event', eventId);
      
      state.eventId = eventId;
      state.hasJoinedEvent = true;
      state.sessionId = sessionId;
    }
  }, [eventId, sessionId]);



  // Renders children or connection status indicator
  return children || (
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
      </div>
    </div>
  );
};

export default SeatSocketListener;