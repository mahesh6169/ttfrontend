'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchConversations } from '@/store/slices/shared/messageSlice';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';

const ConversationsList = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [failedImages, setFailedImages] = useState({});

  const { conversations, loading, error } = useSelector(
    (state) => state.messages
  );

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const handleConversationClick = (resourceType, resourceId, otherUserId) => {
    router.push(`/chat/${resourceType}/${resourceId}?otherUser=${otherUserId}`);
  };

  const handleImageError = (key) => {
    setFailedImages(prev => ({ ...prev, [key]: true }));
  };

  const hasValidImage = (image) => {
    return image && image.startsWith('http');
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
            key={`${conversation.resourceType}-${conversation.resourceId}-${index}`}
            className="flex items-center justify-between p-4 border rounded shadow hover:shadow-md transition cursor-pointer"
            onClick={() => handleConversationClick(
              conversation.resourceType,
              conversation.resourceId,
              conversation.otherUser?.id
            )}
          >
            <div className="flex items-center space-x-4">
              {hasValidImage(conversation.image) && !failedImages[`${conversation.resourceType}-${conversation.resourceId}`] ? (
                <img
                  src={conversation.image}
                  alt={conversation.title || 'Resource'}
                  className="w-16 h-16 object-cover rounded"
                  onError={() => handleImageError(`${conversation.resourceType}-${conversation.resourceId}`)}
                />
              ) : (
                <FaUserCircle className="w-16 h-16 text-slate-400" />
              )}
              <div>
                <h3 className="font-bold">{conversation.title}</h3>
                <p className="text-slate-600 truncate w-64">
                  Last Message: {conversation.lastMessage?.text}
                </p>
                <p className="text-slate-500">
                  {conversation.otherUser?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {conversation.lastMessage?.createdAt
                ? new Date(conversation.lastMessage.createdAt).toLocaleString()
                : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationsList;
