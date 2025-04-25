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
    <div className="p-1">
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center">
        Chat Messages
      </h1>

      <ul className="space-y-4">
        {conversations.map((conv) => {
           if (!conv.otherUser) return null;
           return (
          <li
            key={`${conv.resourceId}-${conv.otherUser.id}`}
            className="p-4 border rounded-lg shadow-md hover:bg-gray-100 flex flex-col gap-2 sm:gap-3 w-full"
          >
            {/* Row 1 */}
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 cursor-pointer"
              onClick={() =>
                router.push(
                  `/chat/${conv.resourceType}/${conv.resourceId}?otherUser=${conv.otherUser.id}`
                )
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={conv.image || '/default.jpg'}
                  alt={conv.title}
                  className="w-14 h-14 rounded-md object-cover shrink-0"
                />
                <h2 className="text-lg font-semibold truncate">{conv.title}</h2>
              </div>

              <p className="text-sm text-gray-500 sm:text-start">
                Chat with {conv.otherUser.name}
              </p>
            </div>

            {/* Row 2 */}
            <div className="pl-0 sm:pl-[4.5rem]">
              <p className="text-sm text-gray-600 truncate w-[90%]">
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
                className="mt-1 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
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
