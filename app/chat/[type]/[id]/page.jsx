'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  sendMessage,
  addNewMessage,
  markMessageAsRead,
} from '@/store/slices/messageSlice';
import socket from '@/config/socket';
import { useSearchParams, useParams } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

const ChatPage = () => {
  const { type: resourceType, id: resourceId } = useParams();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('otherUser');

  const dispatch = useDispatch();

  const tokenValidated = useSelector((state) => state.user.tokenValidated);
  const currentUser = useSelector((state) => state.user.user);
  const currentUserId = currentUser?._id;

  const { activeConversation, status, error } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages when ready
  useEffect(() => {
    if (tokenValidated && currentUserId && resourceId && otherUserId && resourceType) {
      dispatch(fetchMessages({ resourceId, resourceType, otherUserId }));
    }
  }, [dispatch, tokenValidated, currentUserId, resourceId, otherUserId, resourceType]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);

  const { resource, participants } = activeConversation || {};
  const { owner, participant } = participants || {};

  const myRole =
    owner?.id === currentUserId
      ? 'owner'
      : participant?.id === currentUserId
      ? 'participant'
      : null;

  // Emit read receipts
  useEffect(() => {
    if (!activeConversation?.messages || !myRole) return;

    activeConversation.messages.forEach((msg) => {
      const isMyMessage = msg.senderRole === myRole;
      if (!isMyMessage && !msg.isRead) {
        socket.emit('messageRead', { messageId: msg._id });
      }
    });
  }, [activeConversation, myRole]);

  // Handle incoming socket messages
  useEffect(() => {
    const handleNewMessage = (message) => {
      const alreadyExists = activeConversation?.messages?.some(
        (msg) => msg._id === message._id
      );
      if (!alreadyExists) {
        dispatch(addNewMessage(message));
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [dispatch, activeConversation]);

  // Handle messageRead from socket
  useEffect(() => {
    const handleMessageRead = ({ messageId }) => {
      dispatch(markMessageAsRead({ messageId }));
    };

    socket.on('messageRead', handleMessageRead);
    return () => socket.off('messageRead', handleMessageRead);
  }, [dispatch]);

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    dispatch(
      sendMessage({ resourceType, resourceId, participantId: otherUserId, message: newMessage })
    );
    setNewMessage('');
  };

  // Reconnect socket if tab was hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('🔄 Reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Guards
  if (!tokenValidated) return <div className="text-center mt-8">Validating session...</div>;
  if (!currentUserId) return <div className="text-center mt-8">Loading user data...</div>;
  if (status === 'loading') return <div className="text-center mt-8">Loading chat...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!resource) return <div className="text-center text-gray-500">No conversation found.</div>;

  return (
    <div className="w-full max-w-full px-2 sm:px-4">
      {/* Header with image & title */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <img
            src={resource.image || '/default.jpg'}
            alt={resource.title}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg cursor-pointer hover:opacity-80 transition duration-200"
          />
        </Link>
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <h1 className="text-lg sm:text-2xl font-bold cursor-pointer hover:text-blue-600 transition duration-200">
            {resource.title}
          </h1>
        </Link>
      </div>

      {/* Messages */}
      <div className="border rounded-lg p-3 mb-4 overflow-y-auto bg-white shadow-md max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)]">
        {activeConversation.messages.length > 0 ? (
          activeConversation.messages.map((msg) => {
            const isMyMessage = msg.senderRole === myRole;
            const alignment = isMyMessage ? 'justify-end' : 'justify-start';
            const bubbleColor = isMyMessage ? 'bg-green-600 text-white' : 'bg-gray-700 text-white';
            const senderName =
              isMyMessage
                ? (myRole === 'owner' ? owner?.name : participant?.name)
                : (msg.senderRole === 'owner' ? owner?.name : participant?.name);

            return (
              <div key={msg._id} className={`flex ${alignment} mb-2`}>
                <div
                  className={`w-full max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-lg shadow ${bubbleColor} break-words whitespace-pre-wrap`}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold">{senderName}</span>
                    <span>{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                  </div>
                  <p>{msg.message}</p>
                  {msg.isRead && (
                    <div className="text-xs text-green-300 text-right mt-1">(read)</div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        )}
        <div ref={messagesEndRef} />
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
