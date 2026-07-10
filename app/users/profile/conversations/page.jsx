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
import { FaUserCircle, FaRegTrashAlt } from 'react-icons/fa';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';


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
  
  

  const showSkeleton = useDelayedLoading(status === 'loading');

  if (status === 'loading' || showSkeleton) return (
    <div className="space-y-4">
      <ProfilePageHeading title="Chat Messages" />
      {showSkeleton && <PageSkeleton variant="list" rows={6} />}
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <ProfilePageHeading title="Chat Messages" />
      <ErrorState onRetry={() => window.location.reload()} />
    </div>
  );

  if (!conversations.length)
    return (
      <div className="space-y-4">
        <ProfilePageHeading title="Chat Messages" />
        <EmptyState
          title="No messages yet"
          description="You don't have any conversations yet."
        />
      </div>
    );

  return (
    <div>
      <ProfilePageHeading title="Chat Messages" />

      <ul className="space-y-2">
        {conversations.map((conv) => {
           if (!conv.otherUser) return null;

           // Determine if the current user needs to respond
           const isOwner = user._id === conv.ownerId;
           const myRole = isOwner ? 'owner' : 'participant';
           const needsResponse = conv.lastMessage.senderRole !== myRole;
           
           return (
<li
  key={`${conv.resourceId}-${conv.otherUser.id}`}
  onClick={() =>
    router.push(
      `/chat/${conv.resourceType}/${conv.resourceId}?otherUser=${conv.otherUser.id}`
    )
  }
  className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer transition-colors hover:bg-slate-50 ${
    needsResponse ? 'border-l-[3px] border-l-teal-500' : ''
  }`}
>
  {/* Thumbnail */}
  {conv.image ? (
    <img
      src={conv.image}
      alt={conv.title}
      className="w-11 h-11 rounded-lg object-cover shrink-0"
    />
  ) : (
    <FaUserCircle className="w-11 h-11 text-slate-300 shrink-0" />
  )}

  {/* Body */}
  <div className="flex-1 min-w-0">
    {/* Title */}
    <h3 className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1">
      <span className="truncate">
        {conv.eventCode ? `${conv.eventCode} - ${conv.title}` : conv.title}
      </span>
      {conv.resourceType === 'event' && conv.recurrence?.isRecurring && (
        <MdRepeat className="text-slate-400 shrink-0" size={13} title="Recurring event" />
      )}
    </h3>

    {/* Message preview */}
    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage.text}</p>

    {/* With whom + status */}
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[11px] text-slate-400 truncate">
        with {conv.resourceType === 'deal' && conv.businessName ? conv.businessName : conv.otherUser.name}
      </span>
      {needsResponse && (
        <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
          Awaiting reply
        </span>
      )}
    </div>
  </div>

  {/* Delete */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteConversation(conv.resourceId, conv.otherUser.id, conv.resourceType);
    }}
    className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
    title="Delete conversation"
    aria-label="Delete conversation"
  >
    <FaRegTrashAlt size={13} />
  </button>
</li>


           );
          })}
      </ul>

      <ConfirmModal
  isOpen={isModalOpen}
  title={<span className="text-xs text-slate-800 font-bold">Confirm Deletion</span>}
  message={<span className="text-xs text-slate-800">Are you sure you want to delete this conversation?</span>}
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
