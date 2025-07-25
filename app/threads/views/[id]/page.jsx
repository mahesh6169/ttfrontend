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
import LoadingSpinner from '@/components/LoadingSpinner';
import { RiArrowGoBackFill } from "react-icons/ri";
import { MdReport } from "react-icons/md";


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
  const threadStatus = useSelector((state) => state.threads.status);


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

    if ((threadStatus === 'idle' || threadStatus === 'loading') && !thread._id) {
      return (
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      );
    }
    if (threadStatus === 'success' && !thread._id) {
      return (
        <div className="flex justify-center items-center text-center p-8">
          <p className="text-xs sm:text-sm text-gray-800">No Thread Found</p>
        </div>
      );
    }    
    

  return (
    
  <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
    {/* Navigation Bar */}
    <div className="mt-4 flex justify-between items-center">
      {/* Back to Topics */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
      >
        <RiArrowGoBackFill className="text-xs sm:text-base" />
        <span>Back to Topics</span>
      </button>
    
      {/* Report this Topic */}
      <Link
        href={`/support/report?type=topic&id=${thread._id}&title=${encodeURIComponent(thread.title)}`}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
      >
        <MdReport className="text-lg" />
        <span className="hidden sm:inline">Report this topic</span>
        <span className="sm:hidden">Report</span>
      </Link>
    </div>

    <div className="border rounded shadow-md mt-4 w-full"> 

      {/* Image Section */}
      {thread.images?.length > 0 && (
        <div className="relative w-full mx-auto bg-gray-200 flex overflow-hidden rounded">
          <img
            src={thread.images[currentImageIndex].url}
            alt="Thread Image"
            className="object-contain w-full h-full cursor-pointer"
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
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img
            src={thread.images[currentImageIndex].url}
            alt={thread.title || 'Thread Image'}
            className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
          />

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            <FaTimes size={30} />
          </button>

          <button
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            Prev
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-yellow-300 text-teal-700 p-2 rounded-full shadow hover:bg-gray-200 transition"
          >
            Next
          </button>
        </div>
      )}

      {/* Title Section */}
      {thread.title && (
        <div className="my-2 px-2">
          <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-gray-800 break-words">{thread.title}</h1>
        </div>
      )}

      {/* Thread Details Section */}
      <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Topic Details</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {thread.category && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Category:</span>{' '}
                <span className="text-gray-600">{thread.category}</span>
              </div>
            )}
            {thread.owner?.name && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Posted By:</span>{' '}
                <span className="text-gray-600">{thread.owner?.name}</span>
              </div>
            )}
            {thread.createdAt && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Posted:</span>{' '}
                <span className="text-gray-600">{format(new Date(thread.createdAt), 'dd MMM yyyy')}</span>
              </div>
            )}
            {thread.suburb?.name && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Location:</span>{' '}
                <span className="text-gray-600">{thread.suburb?.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mute Notifications */}
      {currentUser && (
        <div className="flex justify-end px-2 mb-2">
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
              isMuted
                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
            } transition-colors duration-200`}
          >
            {isMuted ? (
              <>
                <MdNotificationsOff className="text-base" />
                Unmute Notifications
              </>
            ) : (
              <>
                <MdNotificationsActive className="text-base" />
                Mute Notifications
              </>
            )}
          </button>
        </div>
      )}


      {/* Topic Description Section */}
      {thread.question && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Topic Description</h3>
          </div>
          <div className="p-3">
            <div className="text-sm sm:text-base text-gray-700 space-y-2">
              {thread.question.split('\n').map((para, idx) => (
                para.trim() && <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Useful Answers Section */}
      {usefulAnswers.length > 0 ? (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Comments Marked as Useful</h3>
            <p className="text-xs text-gray-600 mt-1">Click thumbs up 👍 to mark comments as useful</p>
          </div>
          <div className="p-3 space-y-3">
    {usefulAnswers.map((msg) => (
              <div
                key={msg._id}
                className="p-3 bg-yellow-50 rounded border border-yellow-200"
              >
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {msg.sender?.name || 'Former Member'}
                </p>
                <p className="text-sm sm:text-base text-gray-700">{msg.message}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>
                    {format(new Date(msg.createdAt), 'dd MMM yyyy, h:mm a')}
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleLike(msg._id)}
                      className={`flex items-center space-x-1 ${
                        msg.likedBy?.includes(currentUser?._id)
                          ? 'text-blue-500'
                          : 'text-gray-500'
                      } hover:text-blue-600`}
                    >
                      👍 {msg.likes || 0}
                    </button>
                    <button
                      onClick={() => handleUnlike(msg._id)}
                      className={`flex items-center space-x-1 ${
                        msg.dislikedBy?.includes(currentUser?._id)
                          ? 'text-red-500'
                          : 'text-gray-500'
                      } hover:text-red-600`}
                    >
                      👎 {msg.dislikes || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Comments Marked as Useful</h3>
            <p className="text-xs text-gray-600 mt-1">Click thumbs up 👍 to mark comments as useful</p>
          </div>
          <div className="p-3">
            <p className="text-sm text-gray-500 text-center">No comments marked as useful yet</p>
          </div>
        </div>
      )}



{/* Message Area */}
<div className="rounded my-6 bg-white shadow space-y-2">

  {/* ✅ Message Box at the Top */}
  {currentUser ? (
    <div className="border rounded-lg shadow bg-white p-1">
      <textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Join the conversation..."
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
    <div className="border rounded-lg shadow bg-white p-4 my-6 ">
  <textarea
    disabled
    placeholder=" 🔒 Log in to join the conversation..."
    rows={1}
    className="w-full border border-gray-300 bg-gray-100 text-gray-500 resize-none p-2 text-sm sm:text-base rounded"
    style={{
      minHeight: '2.5rem',
      maxHeight: '8rem',
      height: 'auto',
    }}
  />

  <div className="flex justify-center gap-4">
    <Link
      href={`/login?preserveRedirect=true`}
      onClick={() => {
        localStorage.setItem(
          'redirectAfterLogin',
          `/threads/views/${threadId}`
        );
      }}
      className="px-4 py-2 text-sm sm:text-base bg-teal-600 text-lime-100 rounded hover:bg-teal-700"
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
      className="px-4 py-2 text-sm sm:text-base bg-teal-600 text-lime-100 rounded hover:bg-teal-700"
    >
      Register
    </Link>
  </div>
</div>

  )}

  {/* ✅ Message List Below */}
  <div
    ref={messagesContainerRef}
    className="max-h-[500px] overflow-y-auto pr-1 border"
  >
    {messages.length > 0 ? (
      [...messages].reverse().reduce((acc, msg, index, reversed) => {
        const nextMsg = reversed[index - 1];
        const msgDate = new Date(msg.createdAt);
        const nextMsgDate = nextMsg ? new Date(nextMsg.createdAt) : null;

        const showDateSeparator =
          !nextMsg || !isSameDay(msgDate, nextMsgDate);

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
            className={`mb-2 flex ${
              isRightSide ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`relative max-w-[85%] min-w-[100px] px-3 py-2 rounded-lg shadow-sm break-words
                ${
                  currentUser
                    ? isRightSide
                      ? 'bg-teal-700 text-lime-100'
                      : 'bg-gray-100 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
            >
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold">
                  {msg.sender?.name || 'Former Member'}
                </p>
                <span className="text-xs opacity-75 ml-2">
                  {msgDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>

              <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.message}</p>

              <div className="flex items-center space-x-3 mt-2 text-xs">
                <button
                  onClick={() => handleLike(msg._id)}
                  className={`flex items-center space-x-1 ${
                    currentUser && isRightSide
                      ? 'hover:text-yellow-300'
                      : 'hover:text-blue-600'
                  }`}
                >
                  👍 <span>{msg.likes || 0}</span>
                </button>

                <button
                  onClick={() => handleUnlike(msg._id)}
                  className={`flex items-center space-x-1 ${
                    currentUser && isRightSide
                      ? 'hover:text-red-300'
                      : 'hover:text-red-600'
                  }`}
                >
                  👎 <span>{msg.dislikes || 0}</span>
                </button>
              </div>
            </div>
          </div>,
        ];
      }, [])
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ThreadChatPage;
