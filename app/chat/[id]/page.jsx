'use client';
import { useRef } from 'react';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, sendMessage, addNewMessage} from '@/store/slices/messageSlice';
import { markMessageAsRead } from '@/store/slices/messageSlice';
import socket from '@/config/socket'; // Socket.IO client instance
import { useSearchParams, useParams } from 'next/navigation';
import { format } from 'date-fns';

const ChatPage = () => {
  const params = useParams(); 
  const advertId = params.id; 
  const searchParams = useSearchParams(); 
  const otherUserId = searchParams.get('otherUser'); 

  const dispatch = useDispatch();
  const currentUserId = useSelector((state) => state.user.user._id);

  const { activeConversation, status, error } = useSelector((state) => state.messages);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef(null);


// Fetch messages when the component mounts
  useEffect(() => {
    if (advertId && otherUserId) {
      dispatch(fetchMessages({ advertId, otherUserId }));
    }
  }, [dispatch, advertId, otherUserId]);

   // Scroll to the bottom whenever messages update
   useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages]);


// Determine the role of the current user in this conversation
  const { owner, participant } = activeConversation.participants || {};
  let myRole = null;
  if (owner?.id === currentUserId) {
    myRole = 'owner';
  } else if (participant?.id === currentUserId) {
    myRole = 'participant';
  }

  // Mark other user's messages as read
  useEffect(() => {
    if (!activeConversation?.messages || !myRole) return;

    activeConversation.messages.forEach((msg) => {
      const isMyMessage = (msg.senderRole === myRole);
      if (!isMyMessage && !msg.isRead) {
        socket.emit('messageRead', { messageId: msg._id });
      }
    });
  }, [activeConversation, myRole]);

  // Listen for newMessage , after sending a message successfully completed in backend
  useEffect(() => {
    socket.on('newMessage', (message) => {
      if (
        activeConversation?.messages &&
        !activeConversation.messages.some((msg) => msg._id === message._id)
      ) {
        dispatch(addNewMessage(message));
      }
    });

    return () => {
      socket.off('newMessage');
    };
  }, [dispatch, activeConversation]);

  // Send a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      dispatch(sendMessage({ advertId, participantId: otherUserId, message: newMessage }));
      setNewMessage('');
    }
  };

  // Listen for read receipts from the server
  useEffect(() => {
    socket.on('messageRead', ({ messageId, userId }) => {
      console.log(`Message ${messageId} marked as read by user ${userId}`);
      // If you have a Redux action like markMessageRead, dispatch it here:
      dispatch(markMessageAsRead({ messageId, userId }));
    });

    return () => {
      socket.off('messageRead');
    };
  }, [dispatch]);

  if (status === 'loading') return <div>Loading chat...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!activeConversation.advert) return <div>No conversation found.</div>;

  return (
    <div className="mt-12 p-2">
      {/* Title Section */}
      <div className="flex items-center mb-4">
        <img
          src={activeConversation.advert.image}
          alt={activeConversation.advert.title}
          className="w-16 h-16 rounded-lg mr-4"
        />
        <h1 className="text-2xl font-bold">{activeConversation.advert.title}</h1>
      </div>

      {/* Messages Section */}
      <div className="border rounded-lg p-4 mb-4 max-h-96 overflow-y-auto w-full">
        {activeConversation.messages.map((msg, index) => {
          const isOwnerMsg = (msg.senderRole === 'owner');
          const alignment = isOwnerMsg ? 'text-right' : 'text-left';

          // Format the timestamp, e.g. "10:30 AM" or "25 Jan 2025 10:30 AM"
          let timeString = '';
          if (msg.createdAt) {
            timeString = format(new Date(msg.createdAt), 'dd MMM yyyy HH:mm');
          }

          return (
            <div key={`${msg._id}-${index}`} className={`mb-4 ${alignment}`}>
              <p className="text-sm text-gray-500 mb-1">
                {isOwnerMsg ? owner?.name || 'Owner' : participant?.name || 'Participant'}
              </p>
              <div className="inline-block">
                <p
                  className={`px-4 py-2 rounded-lg ${
                    isOwnerMsg ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.message}
                </p>
                {/* Below, we show the timestamp + read status */}
                <div className="text-xs text-gray-500 mt-1">
                  {timeString}
                  {msg.isRead && (
                    <span className="ml-2 text-green-600 font-medium">(read)</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} /> {/* This div scrolls to the bottom */}
      </div>

      {/* Message Input Section */}
      <div className="flex items-center">
  <textarea
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type your message..."
    className="flex-1 border rounded-lg p-2 resize-none h-auto overflow-auto"
    rows="3"
    style={{ minHeight: '4rem', maxHeight: '10rem' }}
  />
  <button
    onClick={handleSendMessage}
    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
  >
    Send
  </button>
</div>

    </div>
  );
};

export default ChatPage;
