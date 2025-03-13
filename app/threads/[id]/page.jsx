'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchThreadMessages,
  sendThreadMessage,
  addNewThreadMessage,
  likeMessage,
  unlikeMessage,
} from '@/store/slices/threadSlice';
import threadSocket from '@/config/threadSocket';
import { format, isSameDay } from 'date-fns';

const ThreadChatPage = () => {
  const { id: threadId } = useParams();
  const dispatch = useDispatch();

  const thread =
    useSelector((state) =>
      state.threads.threads.find((t) => t._id === threadId)
    ) || {};
  const messages =
    useSelector((state) => state.threads.messages[threadId]) || [];
  const currentUser = useSelector((state) => state.user.user);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  /* 🔹 Fetch Messages & Join Thread Room */
  useEffect(() => {
    dispatch(fetchThreadMessages(threadId));
    threadSocket.emit('joinThread', threadId);
  }, [dispatch, threadId]);

  /* 🔹 Listen for new messages via Socket */
  useEffect(() => {
    threadSocket.on('newThreadMessage', (message) => {
      dispatch(addNewThreadMessage({ threadId, message }));
    });

    return () => {
      threadSocket.off('newThreadMessage');
    };
  }, [dispatch, threadId]);

  /* 🔹 Auto-scroll to the latest message */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* 🔹 Send Message Handler */
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      dispatch(sendThreadMessage({ threadId, message: newMessage }));
      setNewMessage('');
    }
  };

  /* 🔹 Like/Unlike Handlers */
  const handleLike = (messageId) => {
    dispatch(likeMessage(messageId));
  };

  const handleUnlike = (messageId) => {
    dispatch(unlikeMessage(messageId));
  };

  /* 🔹 Sort messages by likes (for useful answers) */
  const sortedMessages = [...messages].sort(
    (a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)
  );
  const usefulAnswers = sortedMessages
    .filter((msg) => msg.likes - msg.dislikes > 0)
    .slice(0, 3);

  return (
    <div className="mt-12 p-4 max-w-2xl mx-auto w-full">
      {/* ✅ Thread Title */}
      <h1 className="text-3xl font-bold mb-2">
        {thread.title || 'Thread Discussion'}
      </h1>

      {/* ✅ Thread Question */}
      {thread.question && (
        <p className="text-lg text-gray-700 italic mb-6 border-b pb-4">
          {thread.question}
        </p>
      )}

      {/* 🔥 Useful Answers Section */}
      {usefulAnswers.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-700 mb-3">
            🔥 Most Useful Answers
          </h2>
          {usefulAnswers.map((msg) => (
            <div
              key={msg._id}
              className="mb-4 p-3 bg-white rounded-lg shadow-sm"
            >
              <p className="text-sm font-semibold text-gray-800">
                {msg.sender?.name}
              </p>
              <p className="text-gray-700">{msg.message}</p>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>
                  {format(new Date(msg.createdAt), 'dd MMM yyyy HH:mm')}
                </span>
                <button
                  onClick={() => handleLike(msg._id)}
                  className={`flex items-center space-x-1 ${
                    msg.likedBy?.includes(currentUser?._id)
                      ? 'text-blue-500'
                      : 'text-gray-500'
                  }`}
                >
                  👍 {msg.likes || 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Messages Section */}
      <div className="border rounded-lg p-4 mb-4 max-h-96 overflow-y-auto w-full bg-white shadow-md">
        {messages.length > 0 ? (
          messages.reduce((acc, msg, index) => {
            const prevMsg = messages[index - 1];
            const msgDate = new Date(msg.createdAt);
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;

            const showDateSeparator =
              !prevMsg || !isSameDay(msgDate, prevMsgDate);
            const isCurrentUser = msg.sender?._id === currentUser?._id;

            return [
              ...acc,
              showDateSeparator && (
                <div
                  key={`date-${msg._id}`}
                  className="flex justify-center my-3 w-full"
                >
                  <span className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full shadow">
                    {format(msgDate, 'dd/MM/yyyy')}
                  </span>
                </div>
              ),
              <div
                key={msg._id}
                className={`mb-2 flex w-full px-2 ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`relative max-w-[75%] p-3 rounded-2xl shadow-md break-words whitespace-pre-wrap ${
                    isCurrentUser
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-300 mb-1">
                    {msg.sender?.name || 'Unknown'}
                  </p>

                  <p className="break-words whitespace-pre-wrap">
                    {msg.message}
                  </p>

                  <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
                    <span>{format(msgDate, 'hh:mm a')}</span>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleLike(msg._id)}
                        className="flex items-center space-x-1 hover:text-yellow-400"
                        disabled={!currentUser}
                      >
                        👍 <span>{msg.likes || 0}</span>
                      </button>

                      <button
                        onClick={() => handleUnlike(msg._id)}
                        className="flex items-center space-x-1 hover:text-red-400"
                        disabled={!currentUser}
                      >
                        👎 <span>{msg.dislikes || 0}</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-0 w-4 h-4 bg-inherit transform rotate-45 ${
                      isCurrentUser ? 'right-[-4px]' : 'left-[-4px]'
                    }`}
                  ></div>
                </div>
              </div>
            ];
          }, [])
        ) : (
          <p className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ✅ Conditional Message Input Section */}
      {currentUser ? (
        <div className="flex items-center border rounded-lg p-2 shadow-md bg-white">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border-none outline-none p-2 resize-none h-auto overflow-auto"
            rows="3"
            style={{ minHeight: '4rem', maxHeight: '10rem' }}
          />
          <button
            onClick={handleSendMessage}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      ) : (
        <div className="border rounded-lg p-4 shadow-md bg-white text-center">
          <p className="text-gray-700 mb-4">
            You must be logged in to comment or like messages.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href={`/users/login?redirect=/threads/${threadId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href={`/users/register?redirect=/threads/${threadId}`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadChatPage;
