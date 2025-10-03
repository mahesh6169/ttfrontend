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
  setReplyingTo,
  clearReplyingTo,
  setScrollToMessage,
  clearScrollToMessage,
  deleteThreadMessage,
  markMessageAsDeleted,
  setActiveThreadId
} from '@/store/slices/threads/threadSlice';
import {
  muteThreadNotification,
  unmuteThreadNotification,
} from '@/store/slices/users/userSlice';
// Remove direct socket import - now handled by ThreadSocketListener
import { format, isSameDay } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { FaChevronLeft, FaChevronRight, FaReply } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';
import { MdNotificationsActive, MdNotificationsOff, MdDelete } from "react-icons/md";
import LoadingSpinner from '@/components/LoadingSpinner';
import { MdReport } from "react-icons/md";
import ShareIcons from '@/components/shared/ShareIcons';
import ThreadConnectionStatus from '@/components/threads/ThreadConnectionStatus';
import ThreadSocketListener from '@/components/ThreadSocketListener';


// Add this helper function for optimized image URLs
const getOptimizedImageUrl = (imageObj, size = 'desktop') => {
  if (!imageObj) return null;
  if (typeof imageObj === 'string') return imageObj;
  
  // Use pre-optimized URLs from backend
  if (imageObj.optimizedUrls) {
    if (size === 'fullscreen') return imageObj.optimizedUrls.fullscreen;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Use detail URLs for single view
    const mobileUrl = imageObj.optimizedUrls.mobileDetail || imageObj.optimizedUrls.mobile;
    const desktopUrl = imageObj.optimizedUrls.desktopDetail || imageObj.optimizedUrls.desktop;
    return isMobile ? mobileUrl : desktopUrl;
  }
  
  // Fallback to original URL
  return imageObj.url || null;
};

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
  const replyingTo = useSelector((state) => state.threads.replyingTo);
  const scrollToMessage = useSelector((state) => state.threads.scrollToMessage);
  const socketConnected = useSelector((state) => state.threads.socketConnected);


  const [newMessage, setNewMessage] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const messageInputRef = useRef(null);

  const isMuted = useSelector((state) =>
    state.user.mutedThreads?.includes(threadId)
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUsefulIndex, setCurrentUsefulIndex] = useState(0);
  

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

  // Click outside handler for delete confirmation
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deleteConfirmId && !e.target.closest('.delete-popover')) {
        setDeleteConfirmId(null);
      }
    };

    if (deleteConfirmId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [deleteConfirmId]);

  // Set active thread and fetch messages
  useEffect(() => {
    // Set this thread as active (triggers socket join in ThreadSocketListener)
    dispatch(setActiveThreadId(threadId));
    
    // Fetch thread messages
    dispatch(fetchThreadMessages(threadId));
    
    // Cleanup: clear active thread on unmount
    return () => {
      dispatch(setActiveThreadId(null));
    };
  }, [dispatch, threadId]);

  // Smooth scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Check if user is at bottom of scroll
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 50; // pixels from bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
    
    setIsAtBottom(atBottom);
    setShowJumpToBottom(!atBottom && scrollHeight > clientHeight);
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  // Scroll to bottom on new messages (only if user is already at bottom)
  useEffect(() => {
    if (messages.length === 0) return;
    
    // Check if new message was added
    const messageCountChanged = messages.length !== lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;
    
    if (!messageCountChanged) return;
    
    // Always scroll for own messages
    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage && lastMessage.sender?._id === currentUser?._id;

    if (isAtBottom || isMyMessage) {
      // Force scroll function
      const scrollToBottomMultiple = () => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
          
          // Double-check and force if needed (Firefox fix)
          if (container.scrollTop !== container.scrollHeight - container.clientHeight) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'instant'
            });
          }
        }
      };
      
      // Immediate attempt
      scrollToBottomMultiple();
      
      // Use MutationObserver for Firefox to detect when DOM actually updates
      if (messagesContainerRef.current && typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
          scrollToBottomMultiple();
          observer.disconnect();
        });
        
        observer.observe(messagesContainerRef.current, {
          childList: true,
          subtree: true
        });
        
        // Cleanup observer after a timeout
        setTimeout(() => observer.disconnect(), 500);
      }
      
      // Multiple fallback attempts
      requestAnimationFrame(scrollToBottomMultiple);
      setTimeout(scrollToBottomMultiple, 50);
      setTimeout(scrollToBottomMultiple, 100);
      setTimeout(scrollToBottomMultiple, 200);
    }
  }, [messages, currentUser?._id, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollToBottom(false), 100);
  }, [threadId]);

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
          replyTo: replyingTo?._id || null,
        })
      );
      setNewMessage('');
      dispatch(clearReplyingTo());
      
      // Force scroll to bottom after sending
      setIsAtBottom(true);
      setShowJumpToBottom(false);
      
      // Multiple scroll attempts for cross-browser compatibility
      const forceScrollToBottom = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      };
      
      // Immediate scroll
      forceScrollToBottom();
      
      // Multiple delayed scrolls for Firefox
      requestAnimationFrame(forceScrollToBottom);
      setTimeout(forceScrollToBottom, 50);
      setTimeout(forceScrollToBottom, 150);
      setTimeout(forceScrollToBottom, 300);
    }
  };

  const handleLike = (messageId) => {
    dispatch(likeMessage(messageId));
  };

  const handleUnlike = (messageId) => {
    dispatch(unlikeMessage(messageId));
  };

  const handleReply = (message) => {
    dispatch(setReplyingTo(message));
    // Auto-focus the input field
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus();
      }
    }, 50);
  };

  const handleCancelReply = () => {
    dispatch(clearReplyingTo());
  };

  const handleJumpToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement && messagesContainerRef.current) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Flash the message to indicate it's the target
      messageElement.classList.add('bg-yellow-200');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-200');
      }, 1500);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setDeleteConfirmId(messageId);
  };

  const confirmDelete = (messageId) => {
    dispatch(deleteThreadMessage({ threadId, messageId }));
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
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
    .filter((msg) => !msg.deletedAt && msg.likes - msg.dislikes > 0)
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
    <>
      <ThreadSocketListener />
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
    {/* Navigation Bar */}
    <div className="mt-4 flex justify-between items-center">
      {/* Back to Topics */}
      <button
        onClick={() => router.push('/threads')}
        className="flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
      >
        <span>&lt;</span>
        <span>back</span>
      </button>
    
      {/* Report this Topic */}
      <Link
        href={`/support/report?type=topic&id=${thread._id}&title=${encodeURIComponent(thread.title)}`}
        onClick={() => {
          localStorage.setItem('reportReturnUrl', `/threads/views/${threadId}`);
        }}
        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
      >
        <MdReport className="text-lg" />
        <span className="hidden sm:inline">Report this topic</span>
        <span className="sm:hidden">Report</span>
      </Link>
    </div>

    {/* Share Icons Row */}
    <div className="flex items-center justify-center py-3 px-4 bg-gray-50 rounded-lg mt-4">
      <span className="text-sm text-gray-600 mr-3">Share this topic:</span>
      <ShareIcons 
        type="thread"
        title={thread.title}
        id={thread._id}
      />
    </div>

    <div className="border rounded shadow-md mt-4 w-full"> 

      {/* Image Section */}
      {thread.images?.length > 0 && (
        <div className="relative w-full mx-auto bg-white overflow-hidden rounded h-[200px] sm:h-[300px] md:h-[400px]">
          <img
            src={getOptimizedImageUrl(thread.images[currentImageIndex])}
            alt="Thread Image"
            className="object-contain w-full h-full cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
          {/* Fullscreen hint */}
          <div 
            className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Click for full view</span>
          </div>

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
            src={getOptimizedImageUrl(thread.images[currentImageIndex], 'fullscreen')}
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
          <div className="flex justify-center mt-1">
            <ThreadConnectionStatus />
          </div>
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
          <div className="px-3 py-1.5 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Topic Description</h3>
          </div>
          <div className="p-3 relative">
            <div 
              className="text-sm sm:text-base text-gray-700 space-y-2 overflow-y-auto max-h-[200px] sm:max-h-[300px] pr-2"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 #f7fafc'
              }}
            >
              {thread.question.split('\n').map((para, idx) => (
                para.trim() && <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Useful Answers Section */}
      {usefulAnswers.length > 0 ? (
        <div className="border border-teal-600 rounded-lg shadow-sm my-4 mx-2">
          <div className="px-3 py-1.5 border-b border-gray-300">
            <div className="flex items-start sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">
                  <span className="sm:hidden">Useful Comments</span>
                  <span className="hidden sm:inline">Useful Comments</span>
                </h3>
                <p className="text-xs text-gray-600 mt-1 hidden sm:block">Click thumbs up 👍 to mark comments as useful</p>
              </div>
              {/* Navigation Buttons in Header */}
              {usefulAnswers.length > 1 && (
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => setCurrentUsefulIndex((prev) => (prev === 0 ? usefulAnswers.length - 1 : prev - 1))}
                    className="border border-teal-600 text-teal-700 p-1.5 rounded-full hover:bg-teal-50 transition"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                  <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
                    {currentUsefulIndex + 1} / {usefulAnswers.length}
                  </span>
                  <button
                    onClick={() => setCurrentUsefulIndex((prev) => (prev + 1) % usefulAnswers.length)}
                    className="border border-teal-600 text-teal-700 p-1.5 rounded-full hover:bg-teal-50 transition"
                  >
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="p-2 relative">
            <div className="min-h-[100px] max-h-[200px] relative">
              {/* Current Useful Comment */}
              {usefulAnswers[currentUsefulIndex] && (
                <div className="p-2 bg-white rounded-lg h-full overflow-y-auto">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-800">
                        {usefulAnswers[currentUsefulIndex].sender?.name || 'Former Member'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(usefulAnswers[currentUsefulIndex].createdAt), 'dd MMM, h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLike(usefulAnswers[currentUsefulIndex]._id)}
                        className={`flex items-center space-x-1 text-xs ${
                          usefulAnswers[currentUsefulIndex].likedBy?.includes(currentUser?._id)
                            ? 'text-blue-500'
                            : 'text-gray-500'
                        } hover:text-blue-600`}
                      >
                        👍 {usefulAnswers[currentUsefulIndex].likes || 0}
                      </button>
                      <button
                        onClick={() => handleUnlike(usefulAnswers[currentUsefulIndex]._id)}
                        className={`flex items-center space-x-1 text-xs ${
                          usefulAnswers[currentUsefulIndex].dislikedBy?.includes(currentUser?._id)
                            ? 'text-red-500'
                            : 'text-gray-500'
                        } hover:text-red-600`}
                      >
                        👎 {usefulAnswers[currentUsefulIndex].dislikes || 0}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm sm:text-base text-gray-700 overflow-y-auto max-h-[140px] pr-2">
                    {usefulAnswers[currentUsefulIndex].message}
                  </div>
                  {/* Fade overlay for long messages */}
                  <div className="absolute bottom-3 left-3 right-3 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
              )}

              {/* Carousel Indicators */}
              {usefulAnswers.length > 1 && (
                <div className="flex justify-center mt-3 space-x-1">
                  {usefulAnswers.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentUsefulIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentUsefulIndex ? 'bg-teal-600 w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-teal-600 rounded-lg shadow-sm my-4 mx-2">
          <div className="px-3 py-1.5 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Comments Marked as Useful</h3>
            <p className="text-xs text-gray-600 mt-1">Click thumbs up 👍 to mark comments as useful</p>
          </div>
          <div 
            className="p-2 min-h-[100px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f5f5f5 0%, #f9f9f9 50%, #f5f5f5 100%)',
            }}
          >
            <p className="text-sm text-gray-600 font-medium">No comments marked as useful yet 👍</p>
          </div>
        </div>
      )}



{/* Message Area */}
<div className="border border-gray-300 rounded shadow-sm my-4 mx-2 bg-white flex flex-col" style={{ maxHeight: '70vh' }}>

  {/* Jump to Bottom Button */}
  {showJumpToBottom && (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            scrollToBottom(true);
            setIsAtBottom(true);
            setShowJumpToBottom(false);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-teal-700 rounded-full shadow-lg hover:bg-yellow-500 transition-all transform hover:scale-105 text-sm"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          Jump to latest
        </button>
      </div>
    </div>
  )}

  {/* ✅ Message List */}
  <div
    ref={messagesContainerRef}
    onScroll={handleScroll}
    className={`flex-1 overflow-y-auto p-3 border-t border-b ${messages.length === 0 ? 'min-h-[200px]' : ''}`}
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
            id={`message-${msg._id}`}
            className={`mb-2 flex ${
              isRightSide ? 'justify-end' : 'justify-start'
            } transition-colors duration-300`}
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

              {/* Reply preview if message is a reply */}
              {msg.replyTo && (
                <div 
                  onClick={() => handleJumpToMessage(msg.replyTo._id)}
                  className={`mb-2 p-2 rounded cursor-pointer transition-all ${
                    currentUser && isRightSide
                      ? 'bg-teal-800 hover:bg-teal-900 border-l-4 border-yellow-400'
                      : 'bg-gray-200 hover:bg-gray-300 border-l-4 border-teal-600'
                  }`}
                >
                  <p className="text-xs font-semibold opacity-80">
                    ↩ {msg.replyTo.sender?.name || 'Former Member'}
                  </p>
                  <p className="text-xs opacity-70 truncate">
                    {msg.replyTo.deletedAt ? '[This message was deleted]' : `${msg.replyTo.message.substring(0, 50)}...`}
                  </p>
                </div>
              )}

              {msg.deletedAt ? (
                <p className="text-sm sm:text-base italic opacity-60">[This message was deleted]</p>
              ) : (
                <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.message}</p>
              )}

              <div className="flex items-center space-x-3 mt-2 text-xs">
                {!msg.deletedAt && (
                  <>
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
                  </>
                )}

                {currentUser && !msg.deletedAt && (
                  <button
                    onClick={() => handleReply(msg)}
                    className={`${
                      currentUser && isRightSide
                        ? 'hover:text-lime-300'
                        : 'hover:text-teal-600'
                    }`}
                    title="Reply"
                  >
                    <FaReply size={14} />
                  </button>
                )}

                {currentUser && msg.sender?._id === currentUser._id && !msg.deletedAt && (
                  <div className="relative inline-block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg._id);
                      }}
                      className={`${
                        isRightSide
                          ? 'hover:text-red-300'
                          : 'hover:text-red-600'
                      }`}
                      title="Delete"
                    >
                      <MdDelete size={16} />
                    </button>
                    
                    {deleteConfirmId === msg._id && (
                      <div className="delete-popover absolute bottom-full right-0 mb-2 z-50">
                        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm">
                          <div className="flex flex-col gap-2">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-nowrap">Delete message?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(msg._id);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-medium"
                              >
                                Yes
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelDelete();
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-xs font-medium"
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute -bottom-2 right-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white dark:border-t-gray-800"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
        ];
      }, [])
            ) : (
              <div 
                className="flex items-center justify-center h-full min-h-[200px] text-gray-500 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #f9f9f9 50%, #f5f5f5 100%)',
                }}
              >
                <p className="text-sm font-medium text-gray-600">No messages yet. Start the conversation!</p>
              </div>
            )}
  </div>

  {/* ✅ Message Input Box at the Bottom */}
  {currentUser ? (
    <div className="border-t bg-white p-3">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-700">
              Replying to {replyingTo.sender?.name || 'Former Member'}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {replyingTo.message.substring(0, 80)}...
            </p>
          </div>
          <button
            onClick={handleCancelReply}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <textarea
          ref={messageInputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && socketConnected) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={socketConnected 
            ? (replyingTo ? "Type your reply..." : "Join the conversation...") 
            : "Connection issue. Please try again in a moment..."}
          disabled={!socketConnected}
          rows={1}
          className={`flex-1 border rounded-lg outline-none resize-none p-2 text-sm sm:text-base ${
            !socketConnected ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          style={{
            minHeight: '2.5rem',
            maxHeight: '8rem',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !socketConnected}
          className="px-4 py-2 bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={!socketConnected ? "Connection issue - please wait" : ""}
        >
          Send
        </button>
      </div>
    </div>
  ) : (
    <div className="border-t bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-gray-600 mb-3">Login to join the conversation</p>
        <Link
          href={`/login?preserveRedirect=true`}
          onClick={() => {
            localStorage.setItem(
              'redirectAfterLogin',
              `/threads/views/${threadId}`
            );
          }}
          className="inline-block px-6 py-2 text-sm sm:text-base bg-teal-600 text-lime-100 rounded hover:bg-teal-700"
        >
          Login
        </Link>
      </div>
    </div>
  )}

</div>

      </div>
    </div>
    </>
  );
};

export default ThreadChatPage;
