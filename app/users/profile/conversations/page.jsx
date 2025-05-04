'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchConversations,
  deleteConversation,
} from '@/store/slices/shared/messageSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const ConversationsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { conversations, status, error,  deleteConversationStatus  } = useSelector(
    (state) => state.messages
  );

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (deleteConversationStatus === 'success') {
      dispatch(fetchConversations());
    }
  }, [deleteConversationStatus, dispatch]);

  const handleDeleteConversation = (resourceId, otherUserId, resourceType) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      dispatch(deleteConversation({ resourceId, otherUserId, resourceType }));
      toast.success('Conversation deletion started...');
    }
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
      <h1 className="text-base sm:text-2xl font-bold mb-4 text-center">
        Chat Messages
      </h1>

      <ul className="space-y-4">
        {conversations.map((conv) => {
           if (!conv.otherUser) return null;
           return (
<li
  key={`${conv.resourceId}-${conv.otherUser.id}`}
  className="px-3 py-2 border rounded-md shadow-sm hover:bg-lime-50 flex flex-col gap-1 sm:gap-2 w-full"
>
  {/* Row 1 */}
  <div
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 cursor-pointer"
    onClick={() =>
      router.push(
        `/chat/${conv.resourceType}/${conv.resourceId}?otherUser=${conv.otherUser.id}`
      )
    }
  >
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={conv.image || '/default.jpg'}
        alt={conv.title}
        className="w-10 h-10 rounded-md object-cover shrink-0"
      />
      <h2 className="text-xs sm:text-sm font-medium ">{conv.title}</h2>
    </div>

    <p className="text-xs sm:text-sm font-medium text-teal-700 sm:text-start">
      Chat with {conv.otherUser.name}
    </p>
  </div>

  {/* Row 2 */}
  <div className="pl-0 sm:pl-[3rem]">
    <p className="text-xs text-gray-600 truncate w-[90%]">
      {conv.lastMessage.text}
    </p>
  </div>

  {/* Delete Button */}
  <div className="flex justify-end">
    <button
      onClick={() =>
        handleDeleteConversation(
          conv.resourceId,
          conv.otherUser.id,
          conv.resourceType
        )
      }
      className="mt-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
    >
      Delete
    </button>
  </div>
</li>

           );
          })}
      </ul>
    </div>
  );
};

export default ConversationsPage;
