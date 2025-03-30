'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchThreads,
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
  const router = useRouter();

  const thread =
    useSelector((state) =>
      state.threads.threads.find((t) => t._id === threadId)
    ) || {};
  const messages =
    useSelector((state) => state.threads.messages[threadId]) || [];
  const currentUser = useSelector((state) => state.user.user);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // ✅ Visitor Sender-Side Assignment.
  const senderSides = {};
  let toggleSide = true;

  messages.forEach((msg) => {
    const senderId = msg.sender?._id || msg.sender?.name;
    if (!(senderId in senderSides)) {
      senderSides[senderId] = toggleSide ? 'left' : 'right';
      toggleSide = !toggleSide;
    }
  });

  // Fetch threads if thread is missing
  useEffect(() => {
    if (!thread._id) {
      dispatch(fetchThreads());
    }
  }, [dispatch, threadId, thread._id]);

  // Save redirect URL for non-logged-in users
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('redirectAfterLogin', `/threads/${threadId}`);
    }
  }, [currentUser, threadId]);

  // Fetch messages & join socket room
  useEffect(() => {
    dispatch(fetchThreadMessages(threadId));
    threadSocket.emit('joinThread', threadId);
  }, [dispatch, threadId]);

  useEffect(() => {
    threadSocket.on('newThreadMessage', (message) => {
      dispatch(addNewThreadMessage({ threadId, message }));
    });

    return () => {
      threadSocket.off('newThreadMessage');
    };
  }, [dispatch, threadId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      dispatch(sendThreadMessage({ threadId, message: newMessage }));
      setNewMessage('');
    }
  };

  const handleLike = (messageId) => {
    dispatch(likeMessage(messageId));
  };

  const handleUnlike = (messageId) => {
    dispatch(unlikeMessage(messageId));
  };

  const sortedMessages = [...messages].sort(
    (a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)
  );

  const usefulAnswers = sortedMessages
    .filter((msg) => msg.likes - msg.dislikes > 0)
    .slice(0, 3);

  return (
    <div className="flex flex-col justify-center">
      <h1 className="text-lg font-bold mb-2">
        {thread.title || 'Thread Discussion'}
      </h1>

      {thread.question && (
        <p className="text-base text-gray-700 italic mb-4 border-b">
          {thread.question}
        </p>
      )}

      {/* ✅ Useful Answers */}
      {usefulAnswers.length > 0 && (
        <div className="mb-6 p-1 bg-green-400 border border-green-300 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-white mb-1">Useful Answers</h2>
          {usefulAnswers.map((msg) => (
            <div key={msg._id} className="mb-2 p-1 bg-green-100 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-gray-800">
                {msg.sender?.name}
              </p>
              <p className="text-gray-700">{msg.message}</p>
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                <span>{format(new Date(msg.createdAt), 'dd MMM yyyy HH:mm')}</span>
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

      {/* ✅ Message List */}
      <div className="border rounded-lg p-1 mb-4 max-h-96 overflow-y-auto bg-white shadow-md">
        {messages.length > 0 ? (
          messages.reduce((acc, msg, index) => {
            const prevMsg = messages[index - 1];
            const msgDate = new Date(msg.createdAt);
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;

            const showDateSeparator =
              !prevMsg || !isSameDay(msgDate, prevMsgDate);

            // ✅ Determine side
            let isRightSide = false;

            if (currentUser) {
              isRightSide = msg.sender?._id === currentUser?._id;
            } else {
              const senderId = msg.sender?._id || msg.sender?.name;
              isRightSide = senderSides[senderId] === 'right';
            }

            return [
              ...acc,
              showDateSeparator && (
                <div key={`date-${msg._id}`} className="flex justify-center my-3 w-full">
                  <span className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full shadow">
                    {format(msgDate, 'dd/MM/yyyy')}
                  </span>
                </div>
              ),
              <div
                key={msg._id}
                className={`mb-1 flex px-2 ${
                  isRightSide ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`relative max-w-[75%] p-2 rounded-lg shadow-md break-words whitespace-pre-wrap
                    ${
                      currentUser
                        ? isRightSide
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-black'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <p className="text-sm font-semibold">
                      {msg.sender?.name || 'Former Member'}
                    </p>
                    <span>{format(msgDate, 'hh:mm a')}</span>
                  </div>

                  <p>{msg.message}</p>

                  <div className="flex items-center space-x-3 mt-2 text-xs">
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
              </div>,
            ];
          }, [])
        ) : (
          <p className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ✅ Message Box / Login Prompt */}
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
              href="/users/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href="/users/register"
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
