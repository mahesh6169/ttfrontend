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
      }
    } catch (error) {
      console.error('[SocketListener] Error checking unread count:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const connectSocket = async () => {
      try {
        if (!socket.connected) {
          socket.connect();
          
          // Wait for connection to be established
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Socket connection timeout'));
            }, 5000); // 5 second timeout
            
            socket.once('connect', () => {
              clearTimeout(timeout);
              connectionTimeRef.current = Date.now();
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
      return;
    }
    
    const handleNewMessage = (msg) => {
      dispatch(setUnreadExists(true));
    };

    const handleConnect = () => {
      connectionTimeRef.current = Date.now();
      checkUnreadMessages();
    };

    const handleDisconnect = (reason) => {
      disconnectCountRef.current += 1;
      const disconnectTime = Date.now();
      const connectionDuration = connectionTimeRef.current ? 
        Math.round((disconnectTime - connectionTimeRef.current) / 1000) : 'unknown';
      
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
      
      // If hidden for more than 10 seconds, force reconnect
      if (hiddenDuration > 10000) {
        // Small delay to let the device fully wake up
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socket.connected) {
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
