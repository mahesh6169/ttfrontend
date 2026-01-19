'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchConversations,
  deleteConversation,
  setInActiveChat,
  recalculateUnreadStatus,
} from '@/store/slices/shared/messageSlice';
import ConfirmModal from '@/components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import socket from '@/config/socket';
import { MdRepeat } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';


const ConversationsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
const [pendingDelete, setPendingDelete] = useState(null);

  const { conversations, status, error,  deleteConversationStatus  } = useSelector(
    (state) => state.messages
  );

  const { user } = useSelector((state) => state.user); 

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    const handleNewMessage = () => {
      dispatch(fetchConversations());
      
      if (user && user._id) {
        dispatch(recalculateUnreadStatus({ currentUserId: user._id }));
      }
    };
    
    const handleMessageDeleted = () => {
      // Refresh conversations to update the last message preview
      dispatch(fetchConversations());
    };
  
    socket.on('newMessage', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [dispatch, user]);
  

  useEffect(() => {
    if (deleteConversationStatus === 'success') {
      dispatch(fetchConversations());
    }
  }, [deleteConversationStatus, dispatch]);

  useEffect(() => {
    dispatch(setInActiveChat(true));
    
    return () => {
      dispatch(setInActiveChat(false));
    };
  }, [dispatch]);

  const handleDeleteConversation = (resourceId, otherUserId, resourceType) => {
    setPendingDelete({ resourceId, otherUserId, resourceType });
    setIsModalOpen(true);
  };
  
  

  if (status === 'loading') return <div>Loading conversations...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!conversations.length)
    return (
      <div className="text-xl font-bold text-gray-800 p-14">
        No conversations found.
      </div>
    );

  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">
        Chat Messages
      </h1>

      <ul className="space-y-4">
        {conversations.map((conv) => {
           if (!conv.otherUser) return null;
           
           // Debug log to check conversation data
           console.log('Conversation data:', {
             title: conv.title,
             resourceType: conv.resourceType,
             recurrence: conv.recurrence,
             isRecurringInstance: conv.isRecurringInstance,
             dateTime: conv.dateTime
           });
           
           // Determine if the current user needs to respond
           const isOwner = user._id === conv.ownerId;
           const myRole = isOwner ? 'owner' : 'participant';
           const needsResponse = conv.lastMessage.senderRole !== myRole;
           
           return (
<li
  key={`${conv.resourceId}-${conv.otherUser.id}`}
  className={`px-3 py-3 border rounded-md shadow-sm w-full cursor-pointer transition-colors ${
    needsResponse 
      ? 'bg-amber-50 border-amber-300 hover:bg-amber-100' 
      : 'hover:bg-lime-50'
  }`}
  onClick={() =>
    router.push(
      `/chat/${conv.resourceType}/${conv.resourceId}?otherUser=${conv.otherUser.id}`
    )
  }
>
  <div className="flex flex-col gap-3">
    {/* Row 1: Image and Title/Date */}
    <div className="flex gap-3">
      {/* Image - spans height of title + date/time */}
      {conv.image ? (
        <img
          src={conv.image}
          alt={conv.title}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-md object-cover shrink-0"
        />
      ) : (
        <FaUserCircle className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400 shrink-0" />
      )}
      
      {/* Title and Date/Time container */}
      <div className="flex-1 min-w-0">
        {/* Title with recurring icon */}
        <h2 className="text-xs sm:text-sm font-medium text-gray-800 truncate flex items-center">
          <span className="truncate">
            {conv.eventCode ? `${conv.eventCode} - ${conv.title}` : conv.title}
          </span>
          {conv.resourceType === 'event' && conv.recurrence?.isRecurring && (
            <MdRepeat className="ml-1 text-gray-600 flex-shrink-0" size={14} title="Recurring event" />
          )}
        </h2>
        
        {/* Date/Time for events */}
        {conv.resourceType === 'event' && conv.dateTime && (
          <div className="text-xs text-gray-500 mt-1">
            {conv.recurrence?.isRecurring && (
              <span className="block">
                <span className="text-purple-600 font-semibold">Recurring Event:</span>
                <span className="text-gray-500"> This chat is for event on</span>
              </span>
            )}
            <span className={conv.recurrence?.isRecurring ? 'font-medium' : ''}>
              {new Date(conv.dateTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
              {' at '}
              {new Date(conv.dateTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
              {conv.timeZone && ` (${conv.timeZone})`}
            </span>
          </div>
        )}
      </div>
    </div>

    {/* Row 2: Message Preview */}
    <div className="w-full">
      <p className="text-xs text-gray-600 truncate">
        {conv.lastMessage.text}
      </p>
    </div>

    {/* Row 3: Chat with user and Delete button */}
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <p className="text-xs sm:text-sm text-teal-700">
          Chat with {conv.resourceType === 'deal' && conv.businessName ? conv.businessName : conv.otherUser.name}
        </p>
        {needsResponse && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Awaiting reply
          </span>
        )}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation(); // 🛑 Prevent click from triggering parent
          handleDeleteConversation(
            conv.resourceId,
            conv.otherUser.id,
            conv.resourceType
          );
        }}
        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
</li>


           );
          })}
      </ul>

      <ConfirmModal
  isOpen={isModalOpen}
  title={<span className="text-xs text-gray-800 font-bold">Confirm Deletion</span>}
  message={<span className="text-xs text-gray-800">Are you sure you want to delete this conversation?</span>}
  onCancel={() => setIsModalOpen(false)}
  onConfirm={() => {
    if (pendingDelete) {
      dispatch(deleteConversation(pendingDelete));
      toast.success('Conversation deletion started...');
    }
    setIsModalOpen(false);
  }}
/>

    </div>
  );
};

export default ConversationsPage;
