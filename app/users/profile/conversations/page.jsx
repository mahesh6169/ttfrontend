'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchConversations, deleteConversation } from '@/store/slices/messageSlice';
import { useRouter } from 'next/navigation';

const ConversationsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { conversations, status, error } = useSelector((state) => state.messages);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleDeleteConversation = (advertId, otherUserId) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      dispatch(deleteConversation({ advertId, otherUserId }));
    }
  };

  if (status === 'loading') return <div>Loading conversations...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!conversations.length) return <div className="text-xl font-bold text-gray-800 p-14">No conversations found.</div>;

  return (
<div className="p-4 w-full">
  <h1 className="text-lg md:text-2xl font-bold mb-4 text-center">Chat Messages</h1>

  {/* List */}
  <ul className="space-y-4 w-full">
    {conversations.map((conv) => (
      <li
        key={`${conv.advert.id}-${conv.otherUser.id}`}
        className="p-4 border rounded-lg shadow-md hover:bg-gray-100 flex justify-between items-center"
      >
        <div
          className="flex items-center space-x-4 w-full"
          onClick={() => router.push(`/chat/${conv.advert.id}?otherUser=${conv.otherUser.id}`)}
        >
          <img
            src={conv.advert.image || '/default.jpg'}
            alt={conv.advert.title}
            className="w-16 h-16 rounded-md object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold">{conv.advert.title}</h2>
            <p className="text-sm text-gray-600">{conv.lastMessage.text}</p>
            <p className="text-xs text-gray-500">{conv.otherUser.name}</p>
          </div>
        </div>

        <button
          onClick={() => handleDeleteConversation(conv.advert.id, conv.otherUser.id)}
          className="ml-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </li>
    ))}
  </ul>
</div>

  );
  
};

export default ConversationsPage;
