'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { threadSocket } from '@/config/threadSocket';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { 
  addNewThreadMessage, 
  markMessageAsDeleted,
  setThreadSocketConnected,
  setActiveThreadId,
  updateThreadInList
} from '@/store/slices/threads/threadSlice';
import { toast } from 'react-toastify';

const ThreadSocketListener = () => {
  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  const { activeThreadId } = useSelector((state) => state.threads);
  const currentThreadRef = useRef(activeThreadId);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const { isVisible, lastHiddenTime } = usePageVisibility();
  const reconnectTimeoutRef = useRef(null);

  // Keep ref in sync with Redux state
  useEffect(() => {
    currentThreadRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[ThreadSocketListener] Not authenticated, skipping socket connection');
      // Disconnect socket when not authenticated
      if (threadSocket.connected) {
        threadSocket.disconnect();
        dispatch(setThreadSocketConnected(false));
      }
      return;
    }

    const connectSocket = async () => {
      try {
        if (!threadSocket.connected) {
          console.log('🔌 [ThreadSocketListener] Connecting socket for user:', user._id);
          threadSocket.connect();
          
          // Wait for connection to be established
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Thread socket connection timeout'));
            }, 5000);
            
            const handleConnect = () => {
              clearTimeout(timeout);
              console.log('✅ [ThreadSocketListener] Thread socket connected successfully:', threadSocket.id);
              dispatch(setThreadSocketConnected(true));
              reconnectAttempts.current = 0;
              
              // Rejoin active thread if any
              if (currentThreadRef.current) {
                console.log('Rejoining thread:', currentThreadRef.current);
                threadSocket.emit('joinThread', currentThreadRef.current);
              }
              
              threadSocket.off('connect', handleConnect);
              threadSocket.off('connect_error', handleError);
              resolve();
            };
            
            const handleError = (error) => {
              clearTimeout(timeout);
              console.error('❌ [ThreadSocketListener] Thread socket connection error:', error.message);
              threadSocket.off('connect', handleConnect);
              threadSocket.off('connect_error', handleError);
              reject(error);
            };
            
            threadSocket.once('connect', handleConnect);
            threadSocket.once('connect_error', handleError);
          });
        } else {
          console.log('✅ [ThreadSocketListener] Thread socket already connected:', threadSocket.id);
          dispatch(setThreadSocketConnected(true));
        }
      } catch (error) {
        console.error('❌ [ThreadSocketListener] Failed to connect thread socket:', error);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          // Retry connection after a delay
          setTimeout(connectSocket, 2000);
        } else {
          toast.error('Unable to connect to server. Please refresh the page.');
        }
      }
    };

    // Set up event handlers before connecting
    const handleConnect = () => {
      console.log('Thread socket connected successfully');
      dispatch(setThreadSocketConnected(true));
      reconnectAttempts.current = 0;
      
      // Rejoin active thread if any
      if (currentThreadRef.current) {
        console.log('Rejoining thread:', currentThreadRef.current);
        threadSocket.emit('joinThread', currentThreadRef.current);
      }
    };

    // Connect the socket
    connectSocket();

    const handleDisconnect = (reason) => {
      console.log('Thread socket disconnected:', reason);
      dispatch(setThreadSocketConnected(false));
      
      // Show user-friendly message for common disconnect reasons
      if (reason === 'io server disconnect') {
        toast.error('Connection lost. Trying to reconnect...');
      }
    };

    const handleConnectError = (error) => {
      console.error('Thread socket connection error:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Unable to connect to server. Please refresh the page.');
        threadSocket.disconnect();
      }
    };

    const handleReconnect = (attemptNumber) => {
      console.log('Thread socket reconnected after', attemptNumber, 'attempts');
      toast.success('Connection restored');
    };

    // Message event handlers
    const handleNewMessage = (message) => {
      console.log('New thread message received:', message);
      
      // Add to Redux state
      dispatch(addNewThreadMessage({ 
        threadId: message.thread, 
        message 
      }));

      // Update thread in list if it exists (for thread slice)
      dispatch(updateThreadInList({
        threadId: message.thread,
        lastMessage: message,
        lastActivity: message.createdAt
      }));

      // Show notification if message is not from current user and not in active thread
      if (message.sender._id !== user._id && message.thread !== currentThreadRef.current) {
        // Could add notification here if needed
        console.log('New message in background thread:', message.thread);
      }
    };

    const handleMessageDeleted = (data) => {
      console.log('Message deleted event:', data);
      
      dispatch(markMessageAsDeleted({
        threadId: data.threadId,
        messageId: data.messageId,
        message: data.message
      }));
    };

    const handleThreadUpdated = (data) => {
      console.log('Thread updated:', data);
      // Handle thread metadata updates (title, participants, etc.)
      // This would update the thread in the list
    };

    const handleError = (error) => {
      console.error('Thread socket error:', error);
      if (error.type === 'auth_error') {
        toast.error('Authentication error. Please login again.');
      }
    };

    // Register all event listeners
    threadSocket.on('connect', handleConnect);
    threadSocket.on('disconnect', handleDisconnect);
    threadSocket.on('connect_error', handleConnectError);
    threadSocket.on('reconnect', handleReconnect);
    threadSocket.on('error', handleError);
    
    // Thread-specific events
    threadSocket.on('newThreadMessage', handleNewMessage);
    threadSocket.on('messageDeleted', handleMessageDeleted);
    threadSocket.on('threadUpdated', handleThreadUpdated);

    // Cleanup function
    return () => {
      console.log('ThreadSocketListener: Cleaning up socket listeners');
      
      // Remove all listeners
      threadSocket.off('connect', handleConnect);
      threadSocket.off('disconnect', handleDisconnect);
      threadSocket.off('connect_error', handleConnectError);
      threadSocket.off('reconnect', handleReconnect);
      threadSocket.off('error', handleError);
      threadSocket.off('newThreadMessage', handleNewMessage);
      threadSocket.off('messageDeleted', handleMessageDeleted);
      threadSocket.off('threadUpdated', handleThreadUpdated);
      
      // Leave current thread if any
      if (currentThreadRef.current) {
        threadSocket.emit('leaveThread', currentThreadRef.current);
      }
    };
  }, [isAuthenticated, user?._id, dispatch]);

  // Handle thread switching
  useEffect(() => {
    if (!threadSocket.connected || !activeThreadId) return;

    const previousThreadId = currentThreadRef.current;
    
    // Leave previous thread if switching
    if (previousThreadId && previousThreadId !== activeThreadId) {
      console.log('Leaving thread:', previousThreadId);
      threadSocket.emit('leaveThread', previousThreadId);
    }

    // Join new thread
    if (activeThreadId) {
      console.log('Joining thread:', activeThreadId);
      threadSocket.emit('joinThread', activeThreadId);
    }
  }, [activeThreadId]);

  // Handle page visibility changes for thread socket
  useEffect(() => {
    if (!isAuthenticated || !isVisible) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (isVisible && !threadSocket.connected && lastHiddenTime) {
      const hiddenDuration = Date.now() - lastHiddenTime;
      console.log(`[ThreadSocket] Page visible after ${hiddenDuration}ms, connected: ${threadSocket.connected}`);
      
      if (hiddenDuration > 10000) {
        console.log('[ThreadSocket] Forcing reconnection after sleep/lock');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!threadSocket.connected) {
            console.log('[ThreadSocket] Reconnecting...');
            threadSocket.connect();
          }
        }, 500);
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isVisible, isAuthenticated, lastHiddenTime]);

  return null; // This component doesn't render anything
};

export default ThreadSocketListener;