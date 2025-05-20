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
} from '@/store/slices/shared/messageSlice';
import socket from '@/config/socket';
import { useSearchParams, useParams } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { RiArrowGoBackFill } from "react-icons/ri";
import Link from 'next/link';

const ChatPage = () => {
  const router = useRouter();
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

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

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
      // Recipient only: check for duplicates before adding
      if (!activeConversation?.messages?.some((m) => m._id === msg._id)) {
        dispatch(addNewMessage(msg));
      }
    };

    const handleMessageSent = (msg) => {
      // Sender only: add directly
      dispatch(addNewMessage(msg));
    };
  
    socket.on('newMessage', handleNewMessage);
    socket.on('messageSent', handleMessageSent);
  
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageSent', handleMessageSent);
    };
  }, [dispatch, activeConversation]);
  
  // Handle read from socket
  useEffect(() => {
    const handler = ({ messageId, userId }) => {
      dispatch(markMessageAsRead({ messageId, userId }));
    };
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
    }));
    setNewMessage('');
  };

  if (!tokenValidated) return <div className="text-center mt-8">Validating session...</div>;
  if (!currentUserId) return <div className="text-center mt-8">Loading user data...</div>;
  if (status === 'loading') return <div className="text-center mt-8">Loading chat...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!resource) return <div className="text-center text-gray-500">No conversation found.</div>;

  return (
    <div className="mt-4 px-2 sm:px-4 ">
       <div className="max-w-2xl w-full mx-auto">
      <div className="mb-2">
        <span
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 px-3 py-1.5 rounded-tr-xl rounded-bl-xl shadow-lg text-sm sm:text-base font-medium cursor-pointer"
        >
          <RiArrowGoBackFill className="text-xs sm:text-base" />
          <span>Back</span>
        </span>
      </div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <img src={resource.image || '/default.jpg'} alt={resource.title} className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg cursor-pointer hover:opacity-80" />
        </Link>
        <Link href={`/${resourceType}s/views/${resourceId}`}>
          <h1 className="text-lg sm:text-2xl font-bold cursor-pointer hover:text-blue-600">{resource.title}</h1>
        </Link>
      </div>


      {/* Messages Container */}
<div className="relative h-[55vh] sm:h-[60vh] max-h-[65vh] min-h-[20vh] border rounded-xl overflow-y-auto bg-gray-50 shadow-inner px-2 py-3 mb-3 flex flex-col gap-2">
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
            <div key={`date-${msg._id}`} className="flex justify-center my-2 w-full">
              <span className="bg-gray-300/80 text-gray-700 text-xs py-1 px-3 rounded-full shadow-sm">
                {msgDate.toLocaleDateString()}
              </span>
            </div>
          ),
          <div
            key={msg._id}
            className={`flex ${alignment} w-full`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[60%] px-4 py-2 rounded-2xl shadow ${bubbleColor} break-words whitespace-pre-wrap transition-all duration-150`}
            >
              <div className="flex items-center gap-x-2 text-xs mb-1 opacity-80">
  <span className="font-semibold">{senderName}</span>
  {/* Optional dot divider */}
  <span className="text-gray-300 text-lg leading-none select-none">•</span>
  <span>{msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
</div>

              <p className="text-base">{msg.message}</p>
              {String(msg.readBy) === String(otherUserId) && (
                <div className="text-xs text-green-300 text-right mt-1">(read)</div>
              )}
            </div>
          </div>,
        ];
      }, [])}
      <div ref={messagesEndRef} />
    </>
  ) : (
    <div className="flex-1 flex items-center justify-center text-center text-gray-400 text-sm">
      No messages yet. Start the conversation!
    </div>
  )}
</div>


      {/* Input */}
      {/* Message Input Bar */}
<div className="flex items-end gap-2 p-3 border rounded-xl shadow bg-white mt-4">
  {/* Auto-growing Textarea */}
  <textarea
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type your message..."
    rows={1}
    className="flex-1 min-h-[2.5rem] max-h-32 resize-none border-none outline-none p-3 rounded-lg bg-gray-50 text-base focus:bg-white focus:ring-2 focus:ring-yellow-400 transition"
    style={{ height: 'auto' }}
    onInput={e => {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }}
  />

  {/* Send Button */}
  <button
    onClick={handleSendMessage}
    disabled={!newMessage.trim()}
    className="flex items-center gap-1 px-4 py-2 bg-yellow-400 text-teal-700 rounded-xl font-semibold shadow hover:bg-teal-700 hover:text-lime-100 transition-colors duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
    aria-label="Send message"
    type="button"
  >
    Send
    {/* Optionally add a send icon here, e.g. <FiSend className="ml-1" /> */}
  </button>
</div>

    </div>
    </div>
  );
};

export default ChatPage;