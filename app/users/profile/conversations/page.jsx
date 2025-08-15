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
  
    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
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
           return (
<li
  key={`${conv.resourceId}-${conv.otherUser.id}`}
  className="px-3 py-2 border rounded-md shadow-sm hover:bg-lime-50 w-full cursor-pointer"
  onClick={() =>
    router.push(
      `/chat/${conv.resourceType}/${conv.resourceId}?otherUser=${conv.otherUser.id}`
    )
  }
>
  <div className="flex flex-col gap-1 sm:gap-2">
    {/* Row 1 */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={conv.image || '/default.jpg'}
          alt={conv.title}
          className="w-10 h-10 rounded-md object-cover shrink-0"
        />
        <h2 className="text-xs sm:text-sm font-medium">
          {conv.eventCode ? `${conv.eventCode} - ${conv.title}` : conv.title}
        </h2>
      </div>

      <p className="text-xs sm:text-sm font-medium text-teal-700 sm:text-start">
        Chat with {conv.otherUser.name}
      </p>
    </div>

    {/* Date/Time for events */}
    {conv.dateTime && (
      <div className="text-xs text-gray-500 pl-0 sm:pl-[3rem]">
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
      </div>
    )}

    {/* Last Message */}
    <div className="pl-0 sm:pl-[3rem] mt-1">
      <p className="text-xs text-gray-600 truncate w-[90%]">
        {conv.lastMessage.text}
      </p>
    </div>

    {/* Delete Button */}
    <div className="flex justify-end">
      <button
        onClick={(e) => {
          e.stopPropagation(); // 🛑 Prevent click from triggering parent
          handleDeleteConversation(
            conv.resourceId,
            conv.otherUser.id,
            conv.resourceType
          );
        }}
        className="mt-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
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
