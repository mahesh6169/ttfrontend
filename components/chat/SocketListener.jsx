'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';
import { setUnreadExists } from '@/store/slices/shared/messageSlice';
import axios from '@/utils/axiosConfig';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export const SocketListener = () => {
  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  const [isSocketReady, setIsSocketReady] = useState(false);
  const { isVisible, lastHiddenTime } = usePageVisibility();
  const reconnectTimeoutRef = useRef(null);
  
  // Track connection time and disconnections
  const connectionTimeRef = useRef(null);
  const disconnectCountRef = useRef(0);

  //console.log('[SocketListener] mounted');
  //console.log('[SocketListener] User:', user?._id);
  //console.log('[SocketListener] isAuthenticated:', isAuthenticated);

  // Check unread messages count
  const checkUnreadMessages = async () => {
    try {
      const response = await axios.get('/messages/unread-count');
      if (response.data.success) {
        dispatch(setUnreadExists(response.data.unreadCount > 0));
        console.log('[SocketListener] Unread count:', response.data.unreadCount);
      }
    } catch (error) {
      console.error('[SocketListener] Error checking unread count:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[SocketListener] Not authenticated, skipping socket connection');
      return;
    }

    const connectSocket = async () => {
      try {
        if (!socket.connected) {
          console.log('🔌 [SocketListener] Connecting socket for user:', user._id);
          socket.connect();
          
          // Wait for connection to be established
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Socket connection timeout'));
            }, 5000); // 5 second timeout
            
            socket.once('connect', () => {
              clearTimeout(timeout);
              connectionTimeRef.current = Date.now();
              console.log('✅ [SocketListener] Socket connected successfully:', socket.id);
              console.log('⏱️ [SocketListener] Connection time:', new Date().toISOString());
              setIsSocketReady(true);
              resolve();
            });
            
            socket.once('connect_error', (error) => {
              clearTimeout(timeout);
              console.error('❌ [SocketListener] Socket connection error:', error.message);
              reject(error);
            });
          });
        } else {
          console.log('✅ [SocketListener] Socket already connected:', socket.id);
          setIsSocketReady(true);
        }
      } catch (error) {
        console.error('❌ [SocketListener] Failed to connect socket:', error);
        // Retry connection after a delay
        setTimeout(connectSocket, 2000);
      }
    };

    connectSocket();

    // Check unread messages on mount
    checkUnreadMessages();

    // Cleanup function
    return () => {
      setIsSocketReady(false);
    };
  }, [isAuthenticated, user?._id]);

  // Set up message handlers only after socket is ready
  useEffect(() => {
    if (!isSocketReady) {
      console.log('[SocketListener] Socket not ready, skipping event handlers');
      return;
    }

    console.log('🎧 [SocketListener] Setting up message handlers');
    
    const handleNewMessage = (msg) => {
      console.log('📨 [SocketListener] New message received:', msg);
      dispatch(setUnreadExists(true));
    };

    const handleConnect = () => {
      connectionTimeRef.current = Date.now();
      console.log('🔄 [SocketListener] Socket reconnected:', socket.id);
      console.log('⏱️ [SocketListener] Reconnection time:', new Date().toISOString());
      // Check for missed messages on reconnection
      checkUnreadMessages();
    };

    const handleDisconnect = (reason) => {
      disconnectCountRef.current += 1;
      const disconnectTime = Date.now();
      const connectionDuration = connectionTimeRef.current ? 
        Math.round((disconnectTime - connectionTimeRef.current) / 1000) : 'unknown';
      
      console.log('🔌💔 [SocketListener] Socket disconnected:', reason);
      console.log('⏱️ [SocketListener] Disconnect time:', new Date().toISOString());
      console.log('📊 [SocketListener] Connection lasted:', connectionDuration, 'seconds');
      console.log('🔢 [SocketListener] Total disconnects this session:', disconnectCountRef.current);
      console.log('📍 [SocketListener] Disconnect reason details:', {
        reason,
        socketId: socket.id,
        connected: socket.connected,
        disconnectCount: disconnectCountRef.current
      });
      
      setIsSocketReady(false);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [dispatch, isSocketReady]);

  // Handle page visibility changes (mobile wake-up, tab switching)
  useEffect(() => {
    if (!isAuthenticated || !isVisible) return;

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // If page just became visible and socket is disconnected
    if (isVisible && !socket.connected && lastHiddenTime) {
      const hiddenDuration = Date.now() - lastHiddenTime;
      console.log(`[SocketListener] Page visible after ${hiddenDuration}ms, socket connected: ${socket.connected}`);
      
      // If hidden for more than 10 seconds, force reconnect
      if (hiddenDuration > 10000) {
        console.log('[SocketListener] Forcing reconnection after sleep/lock');
        
        // Small delay to let the device fully wake up
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socket.connected) {
            console.log('[SocketListener] Reconnecting socket...');
            socket.connect();
          }
          // Check for missed messages
          checkUnreadMessages();
        }, 500);
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isVisible, isAuthenticated, lastHiddenTime]);

  return null;
};
