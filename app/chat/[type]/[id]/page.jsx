'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  sendMessage,
  addNewMessage,
  markMessageAsRead,
} from '@/store/slices/shared/messageSlice';
import socket from '@/config/socket';
import { useSearchParams, useParams } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import Link from 'next/link';

const ChatPage = () => {
  const { type: resourceType, id: resourceId } = useParams();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('otherUser');

  const dispatch = useDispatch();
  const { tokenValidated, user } = useSelector((state) => state.user);
  const currentUserId = user?._id;
  const { activeConversation, status, error } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const { resource, participants } = activeConversation || {};
  const { owner, participant } = participants || {};
  const myRole = owner?.id === currentUserId ? 'owner' : participant?.id === currentUserId ? 'participant' : null;

  // Fetch messages
  useEffect(() => {
    if (tokenValidated && currentUserId && resourceId && otherUserId && resourceType) {
      dispatch(fetchMessages({ resourceId, resourceType, otherUserId }));
    }
  }, [dispatch, tokenValidated, currentUserId, resourceId, otherUserId, resourceType]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Read receipts
  useEffect(() => {
    if (!activeConversation?.messages || !myRole) return;
  
    activeConversation.messages.forEach((msg) => {
      const isSentByMe =
        (msg.senderRole === 'owner' && msg.owner.toString() === currentUserId) ||
        (msg.senderRole === 'participant' && msg.participant.toString() === currentUserId);
  
      if (!isSentByMe && !msg.isRead) {
        socket.emit('messageRead', { messageId: msg._id });
      }
    });
  }, [activeConversation?.messages.length, myRole]);
  

  // Handle incoming socket messages
  useEffect(() => {
    const handleNew = (msg) => {
      if (!activeConversation?.messages?.some((m) => m._id === msg._id)) {
        dispatch(addNewMessage(msg));
      }
    };
    socket.on('newMessage', handleNew);
    return () => socket.off('newMessage', handleNew);
  }, [dispatch, activeConversation]);

  // Handle read from socket
  useEffect(() => {
    const handler = ({ messageId }) => dispatch(markMessageAsRead({ messageId }));
    socket.on('messageRead', handler);
    return () => socket.off('messageRead', handler);
  }, [dispatch]);

  // Reconnect socket
  useEffect(() => {
    const reconnect = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', reconnect);
    return () => document.removeEventListener('visibilitychange', reconnect);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const utcNow = zonedTimeToUtc(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    dispatch(sendMessage({
      resourceType,
      resourceId,
      participantId: otherUserId,
      message: newMessage,
      createdAt: utcNow.toISOString(),
    }));
    setNewMessage('');
  };

  if (!tokenValidated) return <div className="text-center mt-8">Validating session...</div>;
  if (!currentUserId) return <div className="text-center mt-8">Loading user data...</div>;
  if (status === 'loading') return <div className="text-center mt-8">Loading chat...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!resource) return <div className="text-center text-gray-500">No conversation found.</div>;

  return (
    <div className="w-full max-w-full px-2 sm:px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <img src={resource.image || '/default.jpg'} alt={resource.title} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg cursor-pointer hover:opacity-80" />
        </Link>
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <h1 className="text-lg sm:text-2xl font-bold cursor-pointer hover:text-blue-600">{resource.title}</h1>
        </Link>
      </div>

      {/* Messages */}
      <div className="border rounded-lg p-3 mb-4 overflow-y-auto bg-white shadow-md max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)]">
        {activeConversation.messages.length > 0 ? (
          <>
            {activeConversation.messages.reduce((acc, msg, index) => {
              const prevMsg = activeConversation.messages[index - 1];
              const msgDate = new Date(msg.createdAt);
              const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;
              const showDateSeparator = !prevMsg || !isSameDay(msgDate, prevMsgDate);

              const isMyMessage = msg.senderRole === myRole;
              const alignment = isMyMessage ? 'justify-end' : 'justify-start';
              const bubbleColor = isMyMessage ? 'bg-green-600 text-white' : 'bg-gray-700 text-white';
              const senderName = isMyMessage
                ? myRole === 'owner' ? owner?.name : participant?.name
                : msg.senderRole === 'owner' ? owner?.name : participant?.name;

              return [
                ...acc,
                showDateSeparator && (
                  <div key={`date-${msg._id}`} className="flex justify-center my-3 w-full">
                    <span className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full shadow">{msgDate.toLocaleDateString()}</span>
                  </div>
                ),
                <div key={msg._id} className={`flex ${alignment} mb-2`}>
                  <div className={`w-full max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-lg shadow ${bubbleColor} break-words whitespace-pre-wrap`}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold">{senderName}</span>
                      <span>{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                    <p>{msg.message}</p>
                    {msg.isRead && <div className="text-xs text-green-300 text-right mt-1">(read)</div>}
                  </div>
                </div>,
              ];
            }, [])}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        )}
      </div>

      {/* Input */}
      <div className="flex border rounded-lg shadow bg-white p-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border-none outline-none resize-none p-2 h-[4rem] text-sm sm:text-base"
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
