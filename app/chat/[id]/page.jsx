'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, addNewMessage, markMessageAsRead } from '@/store/slices/messageSlice';
import socket from '@/config/socket'; // Socket.IO client instance
import { useSearchParams, useParams } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

const ChatPage = () => {
  const params = useParams();
  const advertId = params.id;
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get('otherUser');

  const dispatch = useDispatch();

  const tokenValidated = useSelector((state) => state.user.tokenValidated);
  const currentUser = useSelector((state) => state.user.user);
  const currentUserId = currentUser?._id;

  const { activeConversation, status, error } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef(null);

  // ✅ Fetch messages only after token validation and user is ready
  useEffect(() => {
    if (tokenValidated && currentUserId && advertId && otherUserId) {
      dispatch(fetchMessages({ advertId, otherUserId }));
    }
  }, [dispatch, tokenValidated, currentUserId, advertId, otherUserId]);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);

  // ✅ Determine the role of the current user in this conversation
  const { owner, participant } = activeConversation?.participants || {};
  const myRole =
    owner?.id === currentUserId
      ? 'owner'
      : participant?.id === currentUserId
      ? 'participant'
      : null;

  // ✅ Mark messages as read
  useEffect(() => {
    if (!activeConversation?.messages || !myRole) return;

    activeConversation.messages.forEach((msg) => {
      const isMyMessage = msg.senderRole === myRole;
      if (!isMyMessage && !msg.isRead) {
        socket.emit('messageRead', { messageId: msg._id });
      }
    });
  }, [activeConversation, myRole]);

  // ✅ Listen for new incoming messages
  useEffect(() => {
    const handleNewMessage = (message) => {
      const alreadyExists = activeConversation?.messages?.some((msg) => msg._id === message._id);
      if (!alreadyExists) {
        dispatch(addNewMessage(message));
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => socket.off('newMessage', handleNewMessage);
  }, [dispatch, activeConversation]);

  // ✅ Listen for message read updates
  useEffect(() => {
    const handleMessageRead = ({ messageId, userId }) => {
      dispatch(markMessageAsRead({ messageId, userId }));
    };

    socket.on('messageRead', handleMessageRead);

    return () => socket.off('messageRead', handleMessageRead);
  }, [dispatch]);

  // ✅ Send message handler
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    dispatch(sendMessage({ advertId, participantId: otherUserId, message: newMessage }));
    setNewMessage('');
  };

  // ✅ LOADING & GUARDS
  if (!tokenValidated) return <div className="text-center mt-8">Validating session...</div>;
  if (!currentUserId) return <div className="text-center mt-8">Loading user data...</div>;
  if (status === 'loading') return <div className="text-center mt-8">Loading chat...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!activeConversation?.advert) return <div className="text-center text-gray-500">No conversation found.</div>;

  return (
    <div className="mt-12 p-4 max-w-4xl mx-auto">
      {/* Header with advert image & title */}
      <div className="flex items-center mb-4">
        <Link href={`/adverts/views/${advertId}`}>
          <img
            src={activeConversation.advert.image}
            alt={activeConversation.advert.title}
            className="w-16 h-16 rounded-lg mr-4 cursor-pointer hover:opacity-80 transition duration-200"
          />
        </Link>

        <Link href={`/adverts/views/${advertId}`}>
          <h1 className="text-2xl font-bold cursor-pointer hover:text-blue-600 transition duration-200">
            {activeConversation.advert.title}
          </h1>
        </Link>
      </div>

      {/* Messages container */}
      <div className="border rounded-lg p-4 mb-4 h-[500px] overflow-y-auto bg-white shadow-md">
        {activeConversation.messages.length > 0 ? (
          activeConversation.messages.map((msg) => {
            const isMyMessage = msg.senderRole === myRole;
            const alignment = isMyMessage ? 'justify-end' : 'justify-start';
            const bubbleColor = isMyMessage ? 'bg-green-600 text-white' : 'bg-gray-700 text-white';
            const senderName = isMyMessage
              ? (myRole === 'owner' ? owner?.name : participant?.name)
              : (msg.senderRole === 'owner' ? owner?.name : participant?.name);

            return (
              <div key={msg._id} className={`flex ${alignment} mb-2`}>
                <div className={`max-w-[70%] px-4 py-2 rounded-lg shadow ${bubbleColor}`}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold">{senderName}</span>
                    <span>{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  {msg.isRead && (
                    <div className="text-xs text-green-400 text-right mt-1">(read)</div>
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

      {/* Message input */}
      <div className="flex items-center border rounded-lg p-2 shadow bg-white">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border-none outline-none resize-none p-2 h-[4rem]"
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
