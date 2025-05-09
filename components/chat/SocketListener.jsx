'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socket from '@/config/socket';
import { setUnreadExists } from '@/store/slices/shared/messageSlice';

export const SocketListener = () => {
  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;

  console.log('[SocketListener] mounted');
  console.log('[SocketListener] User:', user?._id);
  console.log('[SocketListener] isAuthenticated:', isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (!socket.connected) {
      console.log('[SocketListener] Connecting socket...');
      socket.connect();
    }

    const handleNewMessage = (msg) => {
      console.log('[SocketListener] New message received:', msg);
      dispatch(setUnreadExists(true));
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [dispatch, isAuthenticated]);

  return null;
};
