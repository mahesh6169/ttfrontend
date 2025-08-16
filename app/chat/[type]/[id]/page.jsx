'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  sendMessage,
  addNewMessage,
  markMessageAsRead,
  setUnreadExists,
  setInActiveChat, // Import the new action
  recalculateUnreadStatus,
  deleteMessage,
  setReplyingTo,
  clearReplyingTo,
  markMessageAsDeleted,
} from '@/store/slices/shared/messageSlice';
import socket from '@/config/socket';
import { useSearchParams, useParams } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { RiArrowGoBackFill } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";
import Link from 'next/link';

const ChatPage = () => {
  const router = useRouter();
  const { type: resourceType, id: resourceId } = useParams();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('otherUser');

  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const currentUserId = user?._id;
  const { activeConversation, status, error, replyingTo } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const { resource, participants } = activeConversation || {};
  const { owner, participant } = participants || {};
  const myRole = owner?.id === currentUserId ? 'owner' : participant?.id === currentUserId ? 'participant' : null;

  // Set inActiveChat to true when entering the chat page
  useEffect(() => {
    dispatch(setInActiveChat(true));
    
    // Set inActiveChat to false when leaving the chat page and recalculate status
    return () => {
      dispatch(setInActiveChat(false));
      if (currentUserId) {
        dispatch(recalculateUnreadStatus({ currentUserId }));
      }
    };
  }, [dispatch, currentUserId]);

  // Then add a new separate useEffect for socket event recalculation:
useEffect(() => {
  const handleSocketMessageUpdate = () => {
    if (currentUserId) {
      dispatch(recalculateUnreadStatus({ currentUserId }));
    }
  };

  socket.on('newMessage', handleSocketMessageUpdate);
  
  return () => {
    socket.off('newMessage', handleSocketMessageUpdate);
  };
}, [dispatch, currentUserId]);

  // Fetch messages
  useEffect(() => {
    if (tokenValidated && currentUserId && resourceId && otherUserId && resourceType) {
      dispatch(fetchMessages({ resourceId, resourceType, otherUserId }));
    }
  }, [dispatch, tokenValidated, currentUserId, resourceId, otherUserId, resourceType]);

  // Smooth scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Check if user is at bottom of scroll
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 50; // pixels from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    
    setIsAtBottom(atBottom);
    setShowJumpToBottom(!atBottom && scrollHeight > clientHeight);
  };

  // Handle scroll events with debouncing for Chrome
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      checkIfAtBottom();
    }, 50);
  };

  // Scroll to bottom on new messages (only if user sent it)
  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      const lastMessage = activeConversation.messages[activeConversation.messages.length - 1];
      const isMyMessage = lastMessage && lastMessage.senderRole === myRole;

      // Only auto-scroll if I sent the message, not when receiving messages
      if (isMyMessage) {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        });
      }
    }
  }, [activeConversation?.messages?.length, myRole]);

  // Initial scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollToBottom(false), 100);
  }, [activeConversation]);

  // Read receipts
  useEffect(() => {
    if (!activeConversation?.messages || !myRole || !currentUserId) return;
  
    const unreadMessages = activeConversation.messages.filter((msg) => {
      const isSentByMe =
        (msg.senderRole === 'owner' && msg.owner.toString() === currentUserId) ||
        (msg.senderRole === 'participant' && msg.participant.toString() === currentUserId);
  
      return !isSentByMe && msg.readBy !== currentUserId;
    });
  
    // ✅ Emit only once per unread message
    unreadMessages.forEach((msg) => {
      socket.emit('messageRead', { messageId: msg._id });
    });
  
  }, [activeConversation?.messages, myRole, currentUserId]);
  
  // Handle incoming socket messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      // Check if message belongs to current conversation
      const messageResourceId = msg[msg.relatedTo]?._id || msg[msg.relatedTo];
      const messageResourceType = msg.relatedTo;
      
      // Only add message if it belongs to current conversation
      if (messageResourceType === resourceType && 
          String(messageResourceId) === String(resourceId) &&
          (String(msg.owner) === String(currentUserId) || String(msg.participant) === String(currentUserId)) &&
          (String(msg.owner) === String(otherUserId) || String(msg.participant) === String(otherUserId))) {
        
        // Check for duplicates
        if (!activeConversation?.messages?.some((m) => m._id === msg._id)) {
          const messageWithPermissions = {
            ...msg,
            canDelete: false,
            isDeleted: msg.isDeleted || false
          };
          dispatch(addNewMessage(messageWithPermissions));
        }
      }
    };

    const handleMessageSent = (msg) => {
      // Check if message belongs to current conversation
      const messageResourceId = msg[msg.relatedTo]?._id || msg[msg.relatedTo];
      const messageResourceType = msg.relatedTo;
      
      // Only add message if it belongs to current conversation
      if (messageResourceType === resourceType && 
          String(messageResourceId) === String(resourceId) &&
          (String(msg.owner) === String(currentUserId) || String(msg.participant) === String(currentUserId)) &&
          (String(msg.owner) === String(otherUserId) || String(msg.participant) === String(otherUserId))) {
        
        const messageWithPermissions = {
          ...msg,
          canDelete: true,
          isDeleted: false
        };
        dispatch(addNewMessage(messageWithPermissions));
      }
    };
  
    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleMessageSent);
  
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleMessageSent);
    };
  }, [dispatch, activeConversation, resourceType, resourceId, currentUserId, otherUserId]);
  
  // Handle read from socket
  useEffect(() => {
    const handler = ({ messageId, userId }) => {
      dispatch(markMessageAsRead({ messageId, userId }));
    };
    socket.on('messageRead', handler);
    return () => socket.off('messageRead', handler);
  }, [dispatch]);

  // Handle message deletion from socket
  useEffect(() => {
    const handleMessageDeleted = ({ messageId, resourceType: msgResourceType, resourceId: msgResourceId }) => {
      // Only handle if it's for the current conversation (compare as strings)
      if (msgResourceType === resourceType && String(msgResourceId) === String(resourceId)) {
        dispatch(markMessageAsDeleted({ messageId }));
      }
    };
    socket.on('messageDeleted', handleMessageDeleted);
    return () => socket.off('messageDeleted', handleMessageDeleted);
  }, [dispatch, resourceType, resourceId]);


  // Monitor socket connection status
  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ [ChatPage] Socket connected!');
      setSocketConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('❌ [ChatPage] Socket disconnected!');
      setSocketConnected(false);
    };
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Set initial state
    setSocketConnected(socket.connected);
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Reconnect socket and ensure connection
  useEffect(() => {
    // Check initial connection status
    console.log(`📱 [ChatPage] Initial socket status - Connected: ${socket.connected}, ID: ${socket.id || 'none'}`);
    
    const reconnect = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('🔄 [ChatPage] Page visible, reconnecting socket...');
        socket.connect();
      }
    };
    
    // Force connection if not connected
    if (!socket.connected && tokenValidated) {
      console.log('⚡ [ChatPage] Socket not connected, forcing connection...');
      socket.connect();
    }
    
    document.addEventListener('visibilitychange', reconnect);
    return () => document.removeEventListener('visibilitychange', reconnect);
  }, [tokenValidated]);

  // Check for unread messages
  useEffect(() => {
    if (!activeConversation?.messages || !currentUserId) return;
  
    const hasUnread = activeConversation.messages.some((msg) => {
      const isNotMine =
        (msg.senderRole === 'owner' && msg.owner !== currentUserId) ||
        (msg.senderRole === 'participant' && msg.participant !== currentUserId);
  
      return isNotMine && msg.readBy !== currentUserId;
    });
  
    if (!hasUnread) {
      dispatch(setUnreadExists(false));
    }
  }, [activeConversation?.messages, currentUserId, dispatch]);
  

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const utcNow = zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    dispatch(sendMessage({
      resourceType,
      resourceId,
      participantId: otherUserId,
      message: newMessage,
      createdAt: utcNow.toISOString(),
      replyTo: replyingTo?._id || null,
    }));
    setNewMessage('');
    dispatch(clearReplyingTo());
    
    // Immediately scroll to bottom after sending
    setIsAtBottom(true);
    setShowJumpToBottom(false);
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleReply = (message) => {
    dispatch(setReplyingTo(message));
    // Auto-focus the input field
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 50);
  };

  const handleCancelReply = () => {
    dispatch(clearReplyingTo());
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      dispatch(deleteMessage(messageId));
    }
  };

  if (!tokenValidated) return <div className="text-center mt-8">Validating session...</div>;
  if (!currentUserId) return <div className="text-center mt-8">Loading user data...</div>;
  if (status === 'loading') return <div className="text-center mt-8">Loading chat...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!resource) return <div className="text-center text-gray-500">No conversation found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Navigation Bar */}
      <div className="mt-2 md:mt-4 flex justify-between items-center">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 md:gap-2 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-2 py-1 md:px-4 md:py-2 rounded shadow font-semibold text-xs md:text-base transition-colors"
        >
          <RiArrowGoBackFill className="text-sm md:text-base" />
          <span className="hidden md:inline">Back</span>
        </button>
        
        {/* View Resource Link */}
        <Link
          href={`/${resourceType}s/views/${resourceId}`}
          className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="hidden md:inline">View {resourceType === 'event' ? 'Event' : 'Advert'} Details</span>
          <span className="md:hidden">View Details</span>
        </Link>
      </div>
      
      <div className="border rounded shadow-md mt-4 w-full">
        {/* Header Section */}
        <div className="hidden md:block border-b border-gray-300 bg-gray-50 p-4">
          <div className="flex gap-3">
            {/* Image - spans height of title + date/time */}
            <Link href={`/${resourceType}s/views/${resourceId}`}>
              <img 
                src={resource.image || '/default.jpg'} 
                alt={resource.title} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg cursor-pointer hover:opacity-80 object-cover shadow-sm" 
              />
            </Link>
            
            {/* Title and Date/Time container */}
            <div className="flex-1 min-w-0">
              <Link href={`/${resourceType}s/views/${resourceId}`}>
                <h1 className="text-lg sm:text-xl font-bold cursor-pointer hover:text-blue-600 text-gray-800">
                  {resource.eventCode ? `${resource.eventCode} - ${resource.title}` : resource.title}
                </h1>
              </Link>
              
              {/* Date/Time - only show for events */}
              {resource.dateTime && (
                <div className="text-sm text-gray-600 mt-1">
                  {new Date(resource.dateTime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' at '}
                  {new Date(resource.dateTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                  {resource.timeZone && ` (${resource.timeZone})`}
                </div>
              )}
              
              {/* Chat participants */}
              <div className="text-xs text-gray-500 mt-2">
                Chat between <span className="font-medium">{owner?.name || 'Unknown'}</span> and <span className="font-medium">{participant?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="rounded my-6 bg-white shadow flex flex-col h-[500px] md:h-[600px]">
          {/* Jump to Bottom Button */}
          {showJumpToBottom && (
            <div className="relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => {
                    scrollToBottom(true);
                    setIsAtBottom(true);
                    setShowJumpToBottom(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-teal-700 rounded-full shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 text-sm"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Jump to latest
                </button>
              </div>
            </div>
          )}
          
          {/* Messages List */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-1 border-t border-b"
            style={{ overscrollBehavior: 'contain' }}
          >
            {activeConversation.messages.length > 0 ? (
              <>
                {activeConversation.messages.reduce((acc, msg, index) => {
                  const prevMsg = activeConversation.messages[index - 1];
                  const msgDate = new Date(msg.createdAt);
                  const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;
                  const showDateSeparator = !prevMsg || !isSameDay(msgDate, prevMsgDate);

                  const isMyMessage = msg.senderRole === myRole;
                  const alignment = isMyMessage ? 'justify-end' : 'justify-start';
                  const bubbleColor = isMyMessage
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200';

                  const senderName = isMyMessage
                    ? myRole === 'owner' ? owner?.name : participant?.name
                    : msg.senderRole === 'owner' ? owner?.name : participant?.name;

                  return [
                    ...acc,
                    showDateSeparator && (
                      <div key={`date-${msg._id}`} className="flex justify-center my-3 w-full">
                        <span className="bg-gray-200 text-gray-700 text-xs py-1 px-3 rounded-full">
                          {msgDate.toLocaleDateString()}
                        </span>
                      </div>
                    ),
                    <div
                      key={msg._id}
                      id={`message-${msg._id}`}
                      className={`mb-2 flex ${alignment} transition-colors duration-300`}
                    >
                      <div
                        className={`relative max-w-[85%] min-w-[100px] px-3 py-2 rounded-lg shadow-sm break-words ${bubbleColor}`}
                      >
                          {/* Reply indicator */}
                          {msg.replyTo && (
                            <div 
                              onClick={() => {
                                // Handle both cases: replyTo as object or just ID
                                const replyId = typeof msg.replyTo === 'object' ? msg.replyTo._id : msg.replyTo;
                                const replyElement = document.getElementById(`message-${replyId}`);
                                if (replyElement) {
                                  replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  replyElement.classList.add('bg-yellow-200');
                                  setTimeout(() => {
                                    replyElement.classList.remove('bg-yellow-200');
                                  }, 1500);
                                } else {
                                  // Message not found in current view
                                  console.log('Reply message not found in current messages');
                                }
                              }}
                              className={`mb-2 p-2 rounded cursor-pointer transition-all ${
                                isMyMessage
                                  ? 'bg-green-700 hover:bg-green-800 border-l-4 border-green-400'
                                  : 'bg-gray-200 hover:bg-gray-300 border-l-4 border-gray-400'
                              }`}
                            >
                              {typeof msg.replyTo === 'object' && msg.replyTo.senderRole ? (
                                <>
                                  <p className="text-xs font-semibold opacity-80">
                                    ↩ {msg.replyTo.senderRole === myRole ? 'You' : 
                                       msg.replyTo.senderRole === 'owner' ? owner?.name : participant?.name}
                                  </p>
                                  <p className="text-xs opacity-70 truncate">
                                    {msg.replyTo.deletedAt || msg.replyTo.message === '[Message deleted]' ? '[This message was deleted]' : 
                                     msg.replyTo.message ? `${msg.replyTo.message.substring(0, 50)}...` : '[Message unavailable]'}
                                  </p>
                                </>
                              ) : (
                                <p className="text-xs opacity-70 italic">Click to view replied message</p>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs mb-1 opacity-75">
                            <span className="font-semibold">{senderName}</span>
                            <span className="mx-1">•</span>
                            <span>{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                          {String(msg.readBy) === String(otherUserId) && isMyMessage && !msg.isDeleted && (
                            <div className="text-xs text-right mt-1 opacity-75">✓ Read</div>
                          )}
                          
                          {/* Action buttons */}
                          {!msg.isDeleted && (
                            <div className="flex items-center space-x-3 mt-2 text-xs">
                              <button
                                onClick={() => handleReply(msg)}
                                className={`flex items-center space-x-1 ${
                                  isMyMessage
                                    ? 'hover:text-lime-300'
                                    : 'hover:text-teal-600'
                                }`}
                              >
                                ↩ Reply
                              </button>
                              
                              {msg.canDelete && (
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className={`flex items-center space-x-1 ${
                                    isMyMessage
                                      ? 'hover:text-red-300'
                                      : 'hover:text-red-600'
                                  }`}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                    </div>,
                  ];
                }, [])}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
          
          {/* Message Input Box at the Bottom */}
          <div className="border-t bg-white p-3">
            {/* Reply indicator */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">
                    Replying to {replyingTo.senderRole === myRole ? 'yourself' : 
                      (replyingTo.senderRole === 'owner' ? owner?.name : participant?.name)}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {replyingTo.message.substring(0, 80)}...
                  </p>
                </div>
                <button
                  onClick={handleCancelReply}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                rows={1}
                style={{
                  minHeight: '36px',
                  height: 'auto',
                  maxHeight: '100px',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;