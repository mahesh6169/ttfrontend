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
import { FaTimes, FaReply, FaChevronRight } from "react-icons/fa";
import { MdDelete, MdOutlineRemoveRedEye } from "react-icons/md";
import Link from 'next/link';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import ErrorState from '@/components/layout/ErrorState';
import EmptyState from '@/components/layout/EmptyState';
import BackButton from '@/components/BackButton';

const ChatPage = () => {
  const router = useRouter();
  const { type: resourceType, id: resourceId } = useParams();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('otherUser');

  const dispatch = useDispatch();
  const { tokenValidated, user, status: authStatus } = useSelector((state) => state.user);
  const currentUserId = user?._id;
  const { activeConversation, status, error, replyingTo } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [connectionFailed, setConnectionFailed] = useState(false); // true after 30s still disconnected
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null); // messageId pending delete (confirm modal)

  const { resource, participants } = activeConversation || {};
  const { owner, participant } = participants || {};
  const myRole = owner?.id === currentUserId ? 'owner' : participant?.id === currentUserId ? 'participant' : null;
  // The other person in the thread (vertical-agnostic — no role labels).
  const otherName = (myRole === 'owner' ? participant?.name : owner?.name) || 'Unknown';
  const initialOf = (name) => ((name || '?').trim().charAt(0) || '?').toUpperCase();

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
  

  // Connection messaging: while disconnected show "reconnecting…"; if still down after
  // 30s, escalate to "refresh / check network". Reset the moment it reconnects.
  useEffect(() => {
    if (socketConnected) {
      setConnectionFailed(false);
      return;
    }
    const t = setTimeout(() => setConnectionFailed(true), 30000);
    return () => clearTimeout(t);
  }, [socketConnected]);

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
    
    // Immediately scroll to bottom after sending, and keep focus in the input.
    setIsAtBottom(true);
    setShowJumpToBottom(false);
    setTimeout(() => {
      scrollToBottom(true);
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto'; // reset auto-grown height
        messageInputRef.current.focus();
      }
    }, 50);
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
    setDeleteTarget(messageId);
  };

  const confirmDeleteMessage = () => {
    if (deleteTarget) dispatch(deleteMessage(deleteTarget));
    setDeleteTarget(null);
  };

  // Redirect to login if not authenticated (preserve full URL including query params)
  useEffect(() => {
    if (authStatus === 'failed' || (tokenValidated && !currentUserId)) {
      const fullPath = window.location.pathname + window.location.search;
      localStorage.setItem('redirectAfterLogin', fullPath);
      router.push('/login?preserveRedirect=true');
    }
  }, [tokenValidated, currentUserId, authStatus, router]);

  if ((!tokenValidated && authStatus !== 'failed') || !currentUserId) return <PageSkeleton variant="list" rows={6} />;
  if (status === 'loading') return <PageSkeleton variant="list" rows={6} />;
  if (error) return <ErrorState onRetry={() => dispatch(fetchMessages({ resourceId, resourceType, otherUserId }))} />;
  if (!resource) return <EmptyState title="No conversation found" description="This conversation may have been removed, or the link is invalid." />;

  return (
    <div className="flex flex-col h-[calc(100dvh_-_160px_-_env(safe-area-inset-bottom))] md:h-auto md:block">
      {/* Navigation Bar */}
      <div className="flex justify-between items-center shrink-0">
        {/* Back Button */}
        <BackButton />
      </div>
      
      <div className="flex-1 md:flex-none min-h-0 flex flex-col overflow-hidden border border-slate-200 rounded-xl shadow-sm mt-4 w-full">
        {/* Compact header — the title is the clickable link to the listing/event (no thumbnail) */}
        <Link
          href={resourceType === 'event' ? `/events/views/${resourceId}` : `/listings/views/${resourceId}`}
          className="group block border-b border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-colors shrink-0"
        >
          <h1 className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-800 group-hover:text-teal-700 group-hover:underline">
            <span className="truncate">
              {resource.eventCode ? `${resource.eventCode} - ${resource.title}` : resource.title}
            </span>
            <FaChevronRight className="shrink-0 text-[10px] text-slate-400 group-hover:text-teal-700" />
          </h1>
          <p className="text-xs text-slate-500 truncate">with {otherName}</p>
        </Link>

        {/* Message Area */}
        <div className="flex flex-col flex-1 min-h-0 md:h-[600px] md:flex-none relative">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white rounded-full shadow-lg hover:bg-teal-800 transition-all transform hover:scale-105 text-sm"
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
            className="flex-1 min-h-0 overflow-y-auto py-2 bg-slate-50/40"
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
                  // First message of a run (new sender, or after a date break) → show avatar + name.
                  const isRunStart = showDateSeparator || !prevMsg || prevMsg.senderRole !== msg.senderRole;
                  const senderName = isMyMessage
                    ? 'You'
                    : (msg.senderRole === 'owner' ? owner?.name : participant?.name) || 'Unknown';
                  const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

                  return [
                    ...acc,
                    showDateSeparator && (
                      <div key={`date-${msg._id}`} className="flex justify-center my-3">
                        <span className="bg-slate-100 text-slate-500 text-[11px] py-1 px-3 rounded-full">
                          {msgDate.toLocaleDateString()}
                        </span>
                      </div>
                    ),
                    <div
                      key={msg._id}
                      id={`message-${msg._id}`}
                      className={`group flex ${isMyMessage ? 'justify-end' : 'justify-start'} gap-2 px-2 ${isRunStart ? 'mt-3' : 'mt-0.5'} transition-colors duration-300`}
                    >
                      {/* Other person's initials avatar (run start) / spacer (continuation) */}
                      {!isMyMessage && (
                        isRunStart ? (
                          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                            {initialOf(senderName)}
                          </div>
                        ) : (
                          <div className="w-8 shrink-0" />
                        )
                      )}

                      <div
                        className={`relative max-w-[80%] px-3 py-1.5 shadow-sm break-words ${
                          isMyMessage
                            ? 'bg-teal-700 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-200 border-l-4 border-l-slate-300 rounded-2xl rounded-bl-sm'
                        }`}
                      >
                        {/* Reply quote */}
                        {msg.replyTo && (
                          <div
                            onClick={() => {
                              const replyId = typeof msg.replyTo === 'object' ? msg.replyTo._id : msg.replyTo;
                              const replyElement = document.getElementById(`message-${replyId}`);
                              if (replyElement) {
                                replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                replyElement.classList.add('bg-teal-100');
                                setTimeout(() => replyElement.classList.remove('bg-teal-100'), 1500);
                              }
                            }}
                            className={`mb-1.5 p-2 rounded cursor-pointer transition-all ${
                              isMyMessage
                                ? 'bg-teal-800 hover:bg-teal-900 border-l-4 border-teal-500'
                                : 'bg-slate-100 hover:bg-slate-200 border-l-4 border-slate-300'
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

                        {/* Sender name — only at the start of a run (time is shown per-message below) */}
                        {isRunStart && (
                          <div className="text-[11px] mb-0.5 font-semibold opacity-70">{senderName}</div>
                        )}

                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>

                        {/* Actions (left) + time & read receipt (right) — always visible */}
                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] opacity-70">
                          {!msg.isDeleted ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleReply(msg)}
                                className={isMyMessage ? 'hover:text-teal-200' : 'hover:text-teal-600'}
                                title="Reply"
                              >
                                <FaReply size={12} />
                              </button>
                              {msg.canDelete && (
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className={isMyMessage ? 'hover:text-red-300' : 'hover:text-red-600'}
                                  title="Delete"
                                >
                                  <MdDelete size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span>{timeStr}</span>
                            {msg.readBy && String(msg.readBy) !== String(currentUserId) && isMyMessage && !msg.isDeleted && (
                              <MdOutlineRemoveRedEye size={14} title="Read" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>,
                  ];
                }, [])}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
          
          {/* Message Input Box at the Bottom */}
          <div className="border-t border-slate-200 bg-white p-3 relative z-10 shrink-0">
            {/* Reply indicator */}
            {replyingTo && (
              <div className="mb-2 p-2 bg-slate-100 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Replying to {replyingTo.senderRole === myRole ? 'yourself' : 
                      (replyingTo.senderRole === 'owner' ? owner?.name : participant?.name)}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {replyingTo.message.substring(0, 80)}...
                  </p>
                </div>
                <button
                  onClick={handleCancelReply}
                  className="ml-2 text-slate-500 hover:text-slate-700"
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
                  if (e.key === 'Enter' && !e.shiftKey && socketConnected) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={socketConnected
                  ? "Type your message..."
                  : connectionFailed
                    ? "Connection lost. Try refreshing the page or check your network connection."
                    : "Connection lost. Wait a moment, reconnecting…"}
                disabled={!socketConnected}
                className={`flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  !socketConnected ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
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
                disabled={!newMessage.trim() || !socketConnected}
                className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title={!socketConnected ? (connectionFailed ? "Connection lost. Try refreshing the page or check your network connection." : "Connection lost. Wait a moment, reconnecting…") : ""}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog — replaces window.confirm (style.md §4) */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="relative w-full max-w-xs p-5 text-center rounded-xl shadow-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDeleteTarget(null)}
              aria-label="Close"
              className="absolute top-2.5 right-3 text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
            >
              ✕
            </button>
            <h3 className="text-base font-semibold text-slate-900">Delete message?</h3>
            <p className="text-sm text-slate-600 mt-1">This can't be undone.</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-2 mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-1.5 text-sm font-semibold"
              >
                Keep
              </button>
              <button
                onClick={confirmDeleteMessage}
                className="rounded-full bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 text-sm font-semibold"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;