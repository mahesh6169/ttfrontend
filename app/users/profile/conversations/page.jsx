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
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      dispatch(deleteConversation({ advertId, otherUserId }));
    }
  };

  if (status === 'loading') return <div>Loading conversations...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!conversations.length) return <div className="text-xl font-bold text-gray-800 p-14">No conversations found.</div>;

  return (
    <div className="p-1">
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center">Chat Messages</h1>

      <ul className="space-y-4">
        {conversations.map((conv) => (
          <li
  key={`${conv.advert.id}-${conv.otherUser.id}`}
  className="p-4 border rounded-lg shadow-md hover:bg-gray-100 flex flex-col gap-2 sm:gap-3 w-full"
>
  {/* Row 1 - Image | Title | Chat with X */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 cursor-pointer"
    onClick={() =>
      router.push(`/chat/${conv.advert.id}?otherUser=${conv.otherUser.id}`)
    }
  >
    <div className="flex items-center gap-3 min-w-0">
      <img
        src={conv.advert.image || '/default.jpg'}
        alt={conv.advert.title}
        className="w-14 h-14 rounded-md object-cover shrink-0"
      />
      <h2 className="text-lg font-semibold truncate">{conv.advert.title}</h2>
    </div>
    
    <p className="text-sm text-gray-500 sm:text-start">Chat with {conv.otherUser.name}</p>
  </div>

  {/* Row 2 - Last Message */}
  <div className="pl-0 sm:pl-[4.5rem] ">
  <p className="text-sm text-gray-600 truncate whitespace-nowrap overflow-hidden text-ellipsis w-[300px] sm:w-[300px] md:w-[350px] lg:w-[600px] xl:w-[800px] 2xl:w-[800px]">
    {conv.lastMessage.text}
  </p>
</div>


  {/* Delete Button aligned right */}
  <div className="flex justify-end">
    <button
      onClick={() => handleDeleteConversation(conv.advert.id, conv.otherUser.id)}
      className="mt-1 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
    >
      Delete
    </button>
  </div>
</li>


        ))}
      </ul>
    </div>
  );
};

export default ConversationsPage;
