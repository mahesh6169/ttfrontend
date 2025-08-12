'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';
import { setUnreadExists } from '@/store/slices/shared/messageSlice';

export const SocketListener = () => {
  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  const [isSocketReady, setIsSocketReady] = useState(false);

  //console.log('[SocketListener] mounted');
  //console.log('[SocketListener] User:', user?._id);
  //console.log('[SocketListener] isAuthenticated:', isAuthenticated);

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
              console.log('✅ [SocketListener] Socket connected successfully:', socket.id);
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
      console.log('🔄 [SocketListener] Socket reconnected:', socket.id);
    };

    const handleDisconnect = (reason) => {
      console.log('🔌 [SocketListener] Socket disconnected:', reason);
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

  return null;
};
