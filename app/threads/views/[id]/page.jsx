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
  unlikeMessage
} from '@/store/slices/threads/threadSlice';
import {
  muteThreadNotification,
  unmuteThreadNotification,
} from '@/store/slices/users/userSlice';
import threadSocket from '@/config/threadSocket';
import { format, isSameDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';
import { MdNotificationsActive, MdNotificationsOff } from "react-icons/md";


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

  const messagesContainerRef = useRef(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);

  const isMuted = useSelector((state) =>
    state.user.mutedThreads?.includes(threadId)
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
  

  // ✅ Visitor Sender-Side Assignment..
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
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        80;
      setAutoScrollEnabled(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScrollEnabled]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const localNow = new Date();
      const utcNow = zonedTimeToUtc(
        localNow,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      dispatch(
        sendThreadMessage({
          threadId,
          message: newMessage,
          createdAt: utcNow.toISOString(),
        })
      );
      setNewMessage('');
    }
  };

  const handleLike = (messageId) => {
    dispatch(likeMessage(messageId));
  };

  const handleUnlike = (messageId) => {
    dispatch(unlikeMessage(messageId));
  };

  const handleToggleMute = () => {
    if (isMuted) {
      dispatch(unmuteThreadNotification(threadId));
    } else {
      dispatch(muteThreadNotification(threadId));
    }
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      thread.images && thread.images.length > 0 ? (prev + 1) % thread.images.length : 0
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      thread.images && thread.images.length > 0
        ? prev === 0
          ? thread.images.length - 1
          : prev - 1
        : 0
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) => b.likes - b.dislikes - (a.likes - a.dislikes)
  );

  const usefulAnswers = sortedMessages
    .filter((msg) => msg.likes - msg.dislikes > 0)
    .slice(0, 3);

  return (
    
    <div className="border  rounded shadow-md mx-auto">  

 {/* 🖼️ Image Preview Section */}
{thread.images?.length > 0 && (
  <div className="relative flex justify-center items-center w-full bg-white py-4 mb-4">
  <div className="relative max-w-xs sm:max-w-md w-full rounded shadow overflow-hidden bg-gray-50">
    <img
      src={thread.images[currentImageIndex].url}
      alt="Thread Image"
      className="w-full h-60 object-contain cursor-pointer"
      onClick={() => setIsFullscreen(true)}
    />

    {thread.images.length > 1 && (
      <>
        <button
          onClick={handlePrevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={handleNextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow"
        >
          <FaChevronRight />
        </button>
      </>
    )}
  </div>
</div>

)}

{/* 🖼️ Fullscreen Image Viewer */}
{isFullscreen && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
    <img
      src={thread.images[currentImageIndex].url}
      alt="Thread Full"
      className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
    />

    {/* ✖️ Close Button */}
    <button
      onClick={() => setIsFullscreen(false)}
      className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaTimes size={30} />
    </button>

    {/* ⬅️ Prev Button */}
    <button
      onClick={handlePrevImage}
      className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaChevronLeft />
    </button>

    {/* ➡️ Next Button */}
    <button
      onClick={handleNextImage}
      className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
    >
      <FaChevronRight />
    </button>
  </div>
)}

 {/* Title */}
 {thread.title && (
      <div className="my-2 px-4 ">
        <h2 className="text-2xl font-bold text-center break-words">{thread.title}</h2>
      </div>
    )}

    {/* Category & Posted Info */}
    <div className="text-sm text-gray-600 mb-2 px-4 text-left flex flex-wrap gap-4 ">
      {thread.category && (
        <span>
          <strong>Category:</strong> {thread.category}
        </span>
      )}
      {thread.owner?.name && (
        <span>
          <strong>Posted By:</strong> {thread.owner?.name}
        </span>
      )}
      {thread.createdAt && (
        <span>
          <strong>Posted:</strong> {format(new Date(thread.createdAt), 'dd MMM yyyy')}
        </span>
      )}
    </div>

{/* Mute Notifications */}
{currentUser && (
  <div className="flex justify-end mb-2">
    <button
      onClick={handleToggleMute}
      className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border w-auto inline-block ${
        isMuted
          ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
          : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
      } transition-colors duration-200`}
    >
      {isMuted ? (
        <>
          <MdNotificationsOff className="text-base" />
          Unmute Email Notifications
        </>
      ) : (
        <>
          <MdNotificationsActive className="text-base" />
          Mute Email Notifications
        </>
      )}
    </button>
  </div>
)}


    {/* Question */}
    {thread.question && (
      <div className=" px-2 rounded mb-6 bg-white shadow">
        
        <p className="text-gray-800 text-justify">{thread.question}</p>
      </div>
    )}

    {/* Useful Answers */}
    {usefulAnswers.length > 0 ? (
  <div className=" rounded mb-4  shadow">
    <h3 className="font-semibold mb-2 text-gray-900 text-base sm:text-lg">Comments marked as useful :</h3>
    {usefulAnswers.map((msg) => (
      <div
        key={msg._id}
        className="mb-6 p-2 bg-white rounded shadow-sm"
      >
        <p className="text-sm font-semibold text-gray-800">
          {msg.sender?.name || 'Former Member'}
        </p>
        <p className="text-gray-700 text-justify italic">{msg.message}</p>
        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
          <span>
            {new Date(msg.createdAt).toLocaleTimeString([], {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <div className="flex items-center space-x-3">
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
            <button
              onClick={() => handleUnlike(msg._id)}
              className={`flex items-center space-x-1 ${
                msg.dislikedBy?.includes(currentUser?._id)
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
            >
              👎 {msg.dislikes || 0}
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className=" rounded my-6  shadow">
    <h3 className="font-semibold mb-2 text-gray-900">Comments marked as useful</h3>
  <div className="border rounded mb-4 bg-yellow-50 shadow p-4 text-center text-sm text-gray-700">
    ⭐️⭐️ Please click  <strong>thumbs up 👍</strong> icon to mark comments as useful ⭐️⭐️
  </div>
  </div>
)}


    {/* Message Area */}
    <div className="rounded  mb-4 bg-white shadow space-y-2">
      {/* Message List */}
      <div
        ref={messagesContainerRef}
        className="max-h-[500px] overflow-y-auto pr-1 border"
      >
        {messages.length > 0 ? (
          messages.reduce((acc, msg, index) => {
            const prevMsg = messages[index - 1];
            const msgDate = new Date(msg.createdAt);
            const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt) : null;

            const showDateSeparator =
              !prevMsg || !isSameDay(msgDate, prevMsgDate);

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
                <div
                  key={`date-${msg._id}`}
                  className="flex justify-center my-3 w-full"
                >
                  <span className="bg-gray-700 text-white text-xs py-1 px-3 rounded-full shadow ">
                    {msgDate.toLocaleDateString()}
                  </span>
                </div>
              ),
              <div
                key={msg._id}
                className={`mb-2 flex  ${
                  isRightSide ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`relative max-w-[95%] min-w-[100px] px-2 rounded-lg shadow-md break-words whitespace-pre-wrap
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
                    <span className="ml-2">
                      {msgDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>

                  <p >{msg.message}</p>

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

      {/* Message Box or Login Prompt */}
      {currentUser ? (
  <div className="border rounded-lg shadow bg-white p-1  ">
    <textarea
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type your message..."
      rows={1}
      className="w-full border-none outline-none resize-none p-1 text-sm sm:text-base overflow-y-auto"
      style={{
        minHeight: '2.5rem',
        maxHeight: '8rem',
        height: 'auto',
      }}
      onInput={(e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
    />

    <div className="flex justify-end mt-2">
      <button
        onClick={handleSendMessage}
        disabled={!newMessage.trim()}
        className="px-4 py-2 bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  </div>
) : (
        <div className="text-center mt-2">
          <p className="text-gray-700 mb-4">
            You must be logged in to comment or like messages.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href={`/users/login?preserveRedirect=true`}
              onClick={() => {
                localStorage.setItem(
                  'redirectAfterLogin',
                  `/threads/views/${threadId}`
                );
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              href={`/users/register?preserveRedirect=true`}
              onClick={() => {
                localStorage.setItem(
                  'redirectAfterLogin',
                  `/threads/views/${threadId}`
                );
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default ThreadChatPage;
