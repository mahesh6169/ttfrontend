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
import { FaChevronLeft, FaChevronRight, FaReply, FaTimes, FaUser, FaCommentDots, FaShareAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { MdNotificationsActive, MdNotificationsOff, MdDelete } from "react-icons/md";
import LoadingSpinner from '@/components/LoadingSpinner';
import ReportLink from '@/components/support/ReportLink';
import ShareIcons from '@/components/shared/ShareIcons';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import { buildSlugUrl } from '@/utils/slugUtils';
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
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_THREAD_IMAGE_URL;
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [chatInView, setChatInView] = useState(false);
  const chatRef = useRef(null);
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

  // Topic Description read-more (mirrors events' SingleEventCard: line-clamp + fade + teal toggle)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const descriptionRef = useRef(null);

  // Share popover (matches listings/events B5: teal Share button → popover, closes on click-away/Esc)
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return;
    const handleClickOutside = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setShareOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [shareOpen]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const check = () => {
      setDescriptionOverflow(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [thread?.question, descriptionExpanded]);
  

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

  // Hide floating buttons once the conversation/chat area scrolls into view (mobile only)
  // Matches listings/events B6: watch the chat's visibility, not scroll direction.
  useEffect(() => {
    const node = chatRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setChatInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [thread?._id]);

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

      // After sending: shrink the composer back to one line AND keep focus in it so the
      // user can keep typing without re-tapping the field (mirrors /chat/[type]/[id]).
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.style.height = 'auto';
          messageInputRef.current.focus();
        }
      }, 50);

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
      messageElement.classList.add('bg-amber-200');
      setTimeout(() => {
        messageElement.classList.remove('bg-amber-200');
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
        <div id="viewsmain" className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <BackButton />
          </div>
          <div className="flex justify-center items-center min-h-[calc(100vh-16rem)]">
            <LoadingSpinner />
          </div>
        </div>
      );
    }
    if (threadStatus === 'failed' && !thread._id) {
      return (
        <div id="viewsmain" className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <BackButton />
          </div>
          <ErrorState onRetry={() => dispatch(fetchThreads())} />
        </div>
      );
    }
    if (threadStatus === 'success' && !thread._id) {
      return (
        <div id="viewsmain" className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <BackButton />
          </div>
          <EmptyState
            title="Thread not found"
            description="This thread may have been removed, or the link is incorrect."
            actionLabel="Browse threads"
            actionHref="/threads"
          />
        </div>
      );
    }    
    

  // Author "About" block — rendered inline on mobile, and as a sidebar card on desktop (under Share).
  const hasAuthorDetails =
    thread.author && (thread.author.name || thread.author.website || thread.author.contact ||
      thread.author.email || thread.author.aboutMyself ||
      (thread.author.socialMedia && thread.author.socialMedia.length > 0));

  const authorHeading = (
    <h3 className="text-sm sm:text-base font-semibold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-200 mb-3">
      <FaUser className="text-slate-600" />
      <span>About {thread.author?.name || 'Author'}</span>
    </h3>
  );

  const authorRows = (
    <div className="space-y-2">
      {thread.author?.aboutMyself && (
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 w-24 shrink-0">About:</span>
          <span className="text-sm text-slate-800">{thread.author.aboutMyself}</span>
        </div>
      )}

      {thread.author?.website && (
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 w-24 shrink-0">Website:</span>
          <a
            href={thread.author.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-700 hover:text-slate-900 hover:underline break-all inline-flex items-center gap-1"
          >
            {thread.author.website}
            <FaExternalLinkAlt className="text-xs text-slate-400 flex-shrink-0" />
          </a>
        </div>
      )}

      {thread.author?.contact && (
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 w-24 shrink-0">Contact:</span>
          <a
            href={`tel:${thread.author.contact}`}
            className="text-sm text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
          >
            {thread.author.contact}
            <FaExternalLinkAlt className="text-xs text-slate-400" />
          </a>
        </div>
      )}

      {thread.author?.email && (
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 w-24 shrink-0">Email:</span>
          <a
            href={`mailto:${thread.author.email}`}
            className="text-sm text-slate-700 hover:text-slate-900 hover:underline break-all inline-flex items-center gap-1"
          >
            {thread.author.email}
            <FaExternalLinkAlt className="text-xs text-slate-400 flex-shrink-0" />
          </a>
        </div>
      )}

      {thread.author?.socialMedia && thread.author.socialMedia.length > 0 && (
        <div className="flex items-start">
          <span className="text-sm font-medium text-slate-600 w-24 shrink-0">Follow us:</span>
          <div className="flex flex-wrap gap-2">
            {thread.author.socialMedia.map((social, index) => (
              social.platform && social.url && (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
                >
                  <span>{social.platform}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <ThreadSocketListener />
      <div id="viewsmain" className="flex flex-col gap-2">
    {/* Navigation Bar */}
    <div className="flex justify-between items-center">
      {/* Back */}
      <BackButton />
    
      {/* Report this Thread */}
      <ReportLink
        type="thread"
        id={thread._id}
        title={thread.title}
        returnUrl={`/threads/views/${threadId}`}
      />
    </div>

    {/* Layout: Content + Sidebar */}
    <div className="flex flex-col lg:flex-row lg:items-start gap-4 mt-4">
      {/* Primary Content */}
      <div className="flex-[7] bg-white w-full">
        <div className="w-full">

      {/* Image Section */}
      <div className="relative w-full mx-auto bg-white overflow-hidden rounded h-[200px] sm:h-[300px] md:h-[400px]">
        <img
          src={thread.images?.length > 0 ? getOptimizedImageUrl(thread.images[currentImageIndex]) : FALLBACK_IMAGE}
          alt="Thread Image"
          className="object-contain w-full h-full cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
        {/* Fullscreen hint */}
        {thread.images?.length > 0 && (
          <div 
            className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Click for full view</span>
          </div>
        )}

          {thread.images?.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronRight />
              </button>
              {/* Dots Indicator */}
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                {thread.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-6 bg-teal-600'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsFullscreen(false);
            if (e.key === 'ArrowLeft') handlePrevImage();
            if (e.key === 'ArrowRight') handleNextImage();
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            e.currentTarget.dataset.touchStartX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX || '0');
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) handleNextImage();
              else handlePrevImage();
            }
          }}
        >
          <img
            src={getOptimizedImageUrl(thread.images[currentImageIndex], 'fullscreen')}
            alt={thread.title || 'Thread Image'}
            className="object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh] rounded shadow-2xl"
          />

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition"
          >
            <FaTimes size={24} />
          </button>

          {thread.images?.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-3 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-3 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronRight size={20} />
              </button>
              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {thread.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-8 bg-teal-500'
                        : 'w-2.5 bg-slate-400 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Title Section */}
      {thread.title && (
        <div className="my-2 px-2">
          <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-slate-900 break-words">{thread.title}</h1>
          <div className="flex justify-center mt-1">
            <ThreadConnectionStatus />
          </div>
        </div>
      )}

      {/* Thread Details Section */}
      <div className="my-4 mx-2">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Topic Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {thread.category && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Category:</span>{' '}
                <span className="text-slate-600">{thread.category}</span>
              </div>
            )}
            {thread.owner?.name && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Posted By:</span>{' '}
                <span className="text-slate-600">{thread.isCuratedThread ? 'Desify Team' : thread.owner?.name}</span>
              </div>
            )}
            {thread.createdAt && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Posted:</span>{' '}
                <span className="text-slate-600">{format(new Date(thread.createdAt), 'dd MMM yyyy')}</span>
              </div>
            )}
            {thread.suburb?.name && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Location:</span>{' '}
                <span className="text-slate-600">{thread.suburb?.name}</span>
              </div>
            )}
        </div>
      </div>

      {/* Mute Notifications */}
      {currentUser && (
        <div className="flex justify-end px-2 mb-2">
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
              isMuted
                ? 'bg-red-600 text-white border-red-700 hover:bg-red-700'
                : 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
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
        <div className="my-4 mx-2">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Topic Description</h3>
          <div className="relative">
            <div
              ref={descriptionRef}
              className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${
                descriptionExpanded ? '' : 'line-clamp-[20]'
              }`}
            >
              {thread.question}
            </div>
            {!descriptionExpanded && descriptionOverflow && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
          {(descriptionOverflow || descriptionExpanded) && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded((e) => !e)}
              className="mt-2 text-teal-700 hover:text-teal-800 font-semibold text-sm underline"
            >
              {descriptionExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Author Details Section */}
      {/* About Author — mobile only (desktop shows it in the sidebar under Share) */}
      {hasAuthorDetails && (
        <div className="mt-4 mb-6 mx-2 lg:hidden">
          {authorHeading}
          {authorRows}
        </div>
      )}

{/* Message Area — Useful Comments pinned at the top, then the live chat */}
<div ref={chatRef} id="conversation-area" className="border border-slate-200 rounded shadow-sm my-4 mx-2 bg-white flex flex-col" style={{ maxHeight: '70vh' }}>

  {/* Useful Comments — highlighted band inside the conversation (hidden until a comment is liked) */}
  {usefulAnswers.length > 0 && (
    <div className="bg-slate-50 border-b border-slate-200 rounded-t px-3 py-2">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span aria-hidden="true">👍</span>
          <h3 className="text-sm font-semibold text-slate-800">Useful Comments</h3>
        </div>
        {usefulAnswers.length > 1 && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => setCurrentUsefulIndex((prev) => (prev === 0 ? usefulAnswers.length - 1 : prev - 1))}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <FaChevronLeft size={10} />
            </button>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              {currentUsefulIndex + 1}/{usefulAnswers.length}
            </span>
            <button
              onClick={() => setCurrentUsefulIndex((prev) => (prev + 1) % usefulAnswers.length)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {usefulAnswers[currentUsefulIndex] && (
        <div className="bg-white border border-slate-200 rounded-md px-2 py-1.5">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-700">
                {usefulAnswers[currentUsefulIndex].sender?.name || 'Former Member'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">
                {format(new Date(usefulAnswers[currentUsefulIndex].createdAt), 'dd MMM')}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <button
                onClick={() => handleLike(usefulAnswers[currentUsefulIndex]._id)}
                className={`flex items-center space-x-0.5 ${
                  usefulAnswers[currentUsefulIndex].likedBy?.includes(currentUser?._id)
                    ? 'text-teal-600'
                    : ''
                } hover:text-teal-600 focus:outline-none`}
              >
                👍 {usefulAnswers[currentUsefulIndex].likes || 0}
              </button>
              <button
                onClick={() => handleUnlike(usefulAnswers[currentUsefulIndex]._id)}
                className={`flex items-center space-x-0.5 ${
                  usefulAnswers[currentUsefulIndex].dislikedBy?.includes(currentUser?._id)
                    ? 'text-red-600'
                    : ''
                } hover:text-red-600 focus:outline-none`}
              >
                👎 {usefulAnswers[currentUsefulIndex].dislikes || 0}
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-snug line-clamp-3">
            {usefulAnswers[currentUsefulIndex].message}
          </p>
        </div>
      )}

      {usefulAnswers.length > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {usefulAnswers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentUsefulIndex(index)}
              className={`h-1 rounded-full transition-all focus:outline-none ${
                index === currentUsefulIndex ? 'bg-slate-500 w-4' : 'bg-slate-300 w-1'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )}

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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700/80 backdrop-blur-sm text-white rounded-full shadow hover:bg-teal-700 transition-all text-xs font-medium"
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

        // Group consecutive messages from the same sender into a "run": show the
        // avatar + name only at the run start, tighten spacing for continuations.
        const senderName = msg.sender?.name || 'Former Member';
        // Own messages read "You" (only for a logged-in user's real messages, not a
        // visitor's visually right-aligned bubbles) — mirrors /chat/[type]/[id].
        const displayName = (currentUser && msg.sender?._id === currentUser?._id) ? 'You' : senderName;
        const thisSenderId = msg.sender?._id || msg.sender?.name;
        const prevSenderId = prevMsg ? (prevMsg.sender?._id || prevMsg.sender?.name) : null;
        const isRunStart = showDateSeparator || !prevMsg || prevSenderId !== thisSenderId;

        return [
          ...acc,
          showDateSeparator && (
            <div
              key={`date-${msg._id}`}
              className="flex justify-center my-3 w-full"
            >
              <span className="bg-slate-100 text-slate-500 text-[11px] py-1 px-3 rounded-full">
                {msgDate.toLocaleDateString()}
              </span>
            </div>
          ),
          <div
            key={msg._id}
            id={`message-${msg._id}`}
            className={`flex ${
              isRightSide ? 'justify-end' : 'justify-start'
            } ${isRunStart ? 'mt-3' : 'mt-0.5'} transition-colors duration-300`}
          >
            <div
              className={`relative max-w-[85%] min-w-[80px] px-2.5 py-1.5 shadow-sm break-words rounded-2xl ${
                isRightSide ? 'rounded-br-sm' : 'rounded-bl-sm'
              } ${
                currentUser && isRightSide
                  ? 'bg-teal-600 text-white'
                  : `bg-white text-slate-800 border border-slate-200 ${!isRightSide ? 'border-l-4 border-l-slate-300' : ''}`
              }`}
            >
              <div className="flex justify-between items-center gap-2 mb-1">
                {isRunStart ? (
                  <p className="text-sm font-semibold">{displayName}</p>
                ) : (
                  <span />
                )}
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
                  className={`mb-2 p-1.5 rounded cursor-pointer transition-all ${
                    currentUser && isRightSide
                      ? 'bg-teal-700 hover:bg-teal-800 border-l-2 border-white/50'
                      : 'bg-slate-100 hover:bg-slate-200 border-l-2 border-teal-500'
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

              <div className="flex items-center space-x-3 mt-1.5 text-xs opacity-80">
                {!msg.deletedAt && (
                  <>
                    <button
                      onClick={() => handleLike(msg._id)}
                      className={`flex items-center space-x-1 ${
                        currentUser && isRightSide
                          ? 'hover:opacity-100'
                          : 'hover:text-blue-600'
                      }`}
                    >
                      👍 <span>{msg.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => handleUnlike(msg._id)}
                      className={`flex items-center space-x-1 ${
                        currentUser && isRightSide
                          ? 'hover:opacity-100'
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
                        ? 'hover:opacity-100'
                        : 'hover:text-teal-600'
                    }`}
                    title="Reply"
                  >
                    <FaReply size={12} />
                  </button>
                )}

                {currentUser && msg.sender?._id === currentUser._id && !msg.deletedAt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(msg._id);
                    }}
                    className={`${
                      isRightSide
                        ? 'hover:opacity-100'
                        : 'hover:text-red-600'
                    }`}
                    title="Delete"
                  >
                    <MdDelete size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>,
        ];
      }, [])
            ) : (
              <div 
                className="flex items-center justify-center h-full min-h-[200px] text-slate-500 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f5f5f5 0%, #f9f9f9 50%, #f5f5f5 100%)',
                }}
              >
                <p className="text-sm font-medium text-slate-600">No messages yet. Start the conversation!</p>
              </div>
            )}
  </div>

  {/* ✅ Message Input Box at the Bottom */}
  {currentUser ? (
    <div className="border-t bg-white p-3">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-slate-100 rounded-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700">
              Replying to {replyingTo.sender?.name || 'Former Member'}
            </p>
            <p className="text-xs text-slate-600 truncate">
              {replyingTo.message.substring(0, 80)}...
            </p>
          </div>
          <button
            onClick={handleCancelReply}
            className="ml-2 text-slate-500 hover:text-slate-700"
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
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder={socketConnected
            ? (replyingTo ? "Type your reply..." : "Join the conversation...")
            : "Connection issue. Please try again in a moment..."}
          disabled={!socketConnected}
          rows={1}
          className={`flex-1 border rounded-lg outline-none resize-none p-2 text-sm sm:text-base ${
            !socketConnected ? 'bg-slate-100 cursor-not-allowed' : ''
          }`}
          style={{
            minHeight: '2.5rem',
            maxHeight: '8rem',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; // cap at maxHeight (8rem)
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !socketConnected}
          className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={!socketConnected ? "Connection issue - please wait" : ""}
        >
          Send
        </button>
      </div>
    </div>
  ) : (
    <div className="border-t bg-slate-50 p-3">
      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          disabled
          placeholder="Login to join the conversation..."
          className="flex-1 border rounded-lg outline-none resize-none p-2 text-sm sm:text-base bg-slate-50 text-slate-500 cursor-not-allowed placeholder:text-slate-400"
          style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
        />
        <Link
          href={`/login?preserveRedirect=true`}
          onClick={() => {
            localStorage.setItem(
              'redirectAfterLogin',
              `/threads/views/${threadId}`
            );
          }}
          className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          Login
        </Link>
      </div>
    </div>
  )}

</div>

        </div>
      </div>

      {/* Desktop Sidebar - Comment + Share */}
      <div className="hidden lg:block flex-[3] sticky top-20 self-start space-y-4">
        {/* Comment Button */}
        <div className="border border-slate-200 p-4 rounded shadow-md w-full">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Join the Discussion</h2>
          <p className="text-sm text-slate-600 mb-4">
            Share your thoughts and engage with the community.
          </p>
          <button
            onClick={() => {
              const conversationArea = document.getElementById('conversation-area');
              if (conversationArea) {
                conversationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => {
                  if (messageInputRef.current) {
                    messageInputRef.current.focus();
                  }
                }, 500);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-semibold"
          >
            <FaCommentDots size={16} />
            <span>Comment</span>
          </button>
        </div>

        {/* Share - popover trigger */}
        <div className="flex justify-center py-3 px-4">
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShareOpen((open) => !open)}
              aria-expanded={shareOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 text-teal-700 hover:bg-teal-50 hover:text-teal-800 px-4 py-1.5 rounded-full font-semibold text-sm md:text-base transition-colors"
            >
              <FaShareAlt size={13} />
              <span>Share</span>
            </button>
            {shareOpen && (
              <div className="absolute right-0 mt-2 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
                <ShareIcons
                  type="thread"
                  title={thread.title}
                  id={thread._id}
                />
              </div>
            )}
          </div>
        </div>

        {/* About Author — desktop sidebar card (under Share) */}
        {hasAuthorDetails && (
          <div className="border border-slate-200 p-4 rounded shadow-md w-full">
            {authorHeading}
            {authorRows}
          </div>
        )}
      </div>

      {/* Mobile Floating Buttons — fade out once the conversation/chat area is in view (B6) */}
      <div
        className={`lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3 transition-all duration-200 ${
          chatInView || isInputFocused ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
        }`}
        aria-hidden={chatInView || isInputFocused}
      >
        {/* Share Button */}
        <button
          onClick={async () => {
            const shareUrl = `${window.location.origin}${buildSlugUrl('thread', thread.title, thread._id)}`;
            const shareText = `${thread.title}\n\nView on Desify\n`;

            if (navigator.share) {
              try {
                await navigator.share({
                  title: thread.title,
                  text: shareText,
                  url: shareUrl,
                });
              } catch (err) {
                if (err.name !== 'AbortError') {
                  navigator.clipboard.writeText(shareUrl);
                }
              }
            } else {
              navigator.clipboard.writeText(shareUrl);
            }
          }}
          className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
        >
          <FaShareAlt size={16} />
          <span>Share</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => {
            const conversationArea = document.getElementById('conversation-area');
            if (conversationArea) {
              conversationArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                if (messageInputRef.current) {
                  messageInputRef.current.focus();
                }
              }, 500);
            }
          }}
          className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
        >
          <FaCommentDots size={16} />
          <span>Comment</span>
        </button>
      </div>

      {/* Delete confirm dialog — centered modal (mirrors /chat/[type]/[id], style.md §4) */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={cancelDelete}
        >
          <div
            className="relative w-full max-w-xs p-5 text-center rounded-xl shadow-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cancelDelete}
              aria-label="Close"
              className="absolute top-2.5 right-3 text-teal-700 hover:text-teal-800 text-xl font-bold leading-none"
            >
              ✕
            </button>
            <h3 className="text-base font-semibold text-slate-900">Delete message?</h3>
            <p className="text-sm text-slate-600 mt-1">This can't be undone.</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-2 mt-4">
              <button
                onClick={cancelDelete}
                className="rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-1.5 text-sm font-semibold"
              >
                Keep
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                className="rounded-full bg-red-600 text-white hover:bg-red-700 px-4 py-1.5 text-sm font-semibold"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
};

export default ThreadChatPage;
