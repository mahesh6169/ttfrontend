'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations } from '@/store/slices/messageSlice';
import { useRouter } from 'next/navigation';

const ConversationsList = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { conversations, loading, error } = useSelector(
    (state) => state.messages
  );

  useEffect(() => {
    // Fetch conversations when the component mounts
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleConversationClick = (advertId) => {
    router.push(`/chat/${advertId}`);
  };

  if (loading) {
    return <div className="text-center mt-8">Loading conversations...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!conversations || conversations.length === 0) {
    return <div className="text-center mt-8">No conversations found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your Conversations</h2>
      <div className="space-y-4">
        {conversations.map((conversation, index) => (
          <div
            key={`${conversation.advert.id}-${index}`}
            className="flex items-center justify-between p-4 border rounded shadow hover:shadow-md transition cursor-pointer"
            onClick={() => handleConversationClick(conversation.advert.id)}
          >
            <div className="flex items-center space-x-4">
              <img
                src={
                  conversation.advert.image ||
                  '/default-advert.jpg'
                }
                alt={conversation.advert.title || 'Advert'}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-bold">
                  {conversation.advert.title}
                </h3>
                <p className="text-gray-600 truncate w-64">
                  Last Message: {conversation.lastMessage.message}
                </p>
                <p className="text-gray-500">
                  Participant: {conversation.participant.name}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(conversation.lastMessage.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationsList;
