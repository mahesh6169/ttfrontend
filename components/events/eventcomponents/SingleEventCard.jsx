// components/events/eventcomponents/SingleEventCard.jsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  FaTimes,
  FaHeart,
  FaChevronLeft,
  FaChevronRight,
  FaTicketAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChair,
  FaClock,
  FaMapMarkerAlt,
  FaUser,
  FaMobileAlt,
  FaEnvelope,
  FaCalendarAlt,
  FaTag,
  FaUserFriends,
  FaShoppingCart,
  FaShareAlt,
  FaCommentDots,
  FaExternalLinkAlt,
  FaGlobe,
  FaThumbsUp,
  FaUserTie,
  FaMapMarkedAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { MdLocationOn, MdEmail, MdPhone, MdPerson, MdEventSeat } from 'react-icons/md';
import { GiTheaterCurtains } from 'react-icons/gi';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import { getEventTicketStatus, getTicketSaleStatus } from '@/utils/events/ticketStatusHelper';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import { buildSlugUrl } from '@/utils/slugUtils';
// Modal removed — RSVP now lives at /events/rsvp/[eventId] as a full page.
import EventCapacityDisplay from './EventCapacityDisplay';
import EventAttendAuthModal from './EventAttendAuthModal';
import WaitlistJoinModal from './WaitlistJoinModal';
import axios from '@/utils/axiosConfig';
import { toast } from 'react-toastify';
import { formatInTimeZone } from 'date-fns-tz';
import { checkRegistrationStatus, unregisterFromFreeEvent } from '@/store/slices/events/freeEventSlice';

// Linkify URLs (http(s):// or www.) and @handles (assumed Instagram) in plain-text descriptions.
const linkifyDescription = (text) => {
  if (!text) return null;
  const pattern = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+|(?:^|(?<=\s))@[\w.]+)/g;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 underline break-all">
          {part}
        </a>
      );
    }
    if (/^www\./.test(part)) {
      return (
        <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 underline break-all">
          {part}
        </a>
      );
    }
    if (/^@[\w.]+/.test(part)) {
      return (
        <a key={i} href={`https://instagram.com/${part.slice(1)}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 underline">
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

// Add this helper function right after your imports
const getOptimizedImageUrl = (imageObj, size = 'auto') => {
  if (!imageObj) return null;
  if (typeof imageObj === 'string') return imageObj;
  
  // Use pre-optimized URLs from backend
  if (imageObj.optimizedUrls) {
    if (size === 'fullscreen') return imageObj.optimizedUrls.fullscreen || imageObj.url || null;
    if (size === 'mobile') return imageObj.optimizedUrls.mobileDetail || imageObj.optimizedUrls.mobile || imageObj.url || null;
    if (size === 'desktop') return imageObj.optimizedUrls.desktopDetail || imageObj.optimizedUrls.desktop || imageObj.url || null;
    
    // Auto-detect based on screen size - use detail URLs for single view
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileUrl = imageObj.optimizedUrls.mobileDetail || imageObj.optimizedUrls.mobile;
    const desktopUrl = imageObj.optimizedUrls.desktopDetail || imageObj.optimizedUrls.desktop;
    return isMobile ? mobileUrl : desktopUrl;
  }
  
  // Fallback to original URL
  return imageObj.url || null;
};

const SingleEventCard = ({ event, chatProps }) => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;
  const dispatch = useDispatch();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const descriptionRef = useRef(null);
  const chatRef = useRef(null);
  // Ticket box (paid) / booking card (free): the floating pills hide from here down.
  const actionRef = useRef(null);
  const [pillsHidden, setPillsHidden] = useState(false);
  const coordSliderRef = useRef(null);
  const [coordActivePage, setCoordActivePage] = useState(0);
  const [coordTotalPages, setCoordTotalPages] = useState(1);
  const [coordCanScroll, setCoordCanScroll] = useState(false);

  const coordMobileSliderRef = useRef(null);
  const [coordMobileActivePage, setCoordMobileActivePage] = useState(0);
  const [coordMobileTotalPages, setCoordMobileTotalPages] = useState(1);
  const [coordMobileCanScroll, setCoordMobileCanScroll] = useState(false);
  const minSwipeDistance = 50;

  const filteredCoords = event?.coordinators?.filter(
    (c) => c?.name || c?.role || c?.phone || c?.email
  ) || [];
  const useCoordSlider = filteredCoords.length > 3;
  const useCoordMobileSlider = filteredCoords.length > 2;

  useEffect(() => {
    const node = actionRef.current;
    if (!node) return;
    // Hide the floating pills once the action zone is in view OR has scrolled above the
    // viewport, so they stay gone from the ticket box (or booking card) down through the chat.
    const observer = new IntersectionObserver(
      ([entry]) => setPillsHidden(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [event?._id, event?.isPaid, event?.isAdvertiseOnly]);

  useEffect(() => {
    if (!useCoordSlider) return;
    const el = coordSliderRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      if (clientWidth === 0) return;
      const total = Math.max(1, Math.ceil(scrollWidth / clientWidth));
      const maxScroll = scrollWidth - clientWidth;
      setCoordTotalPages(total);
      setCoordCanScroll(maxScroll > 1);
      if (total <= 1 || maxScroll <= 0) {
        setCoordActivePage(0);
      } else {
        const page = Math.round((scrollLeft / maxScroll) * (total - 1));
        setCoordActivePage(Math.min(Math.max(page, 0), total - 1));
      }
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [useCoordSlider, filteredCoords.length]);

  const scrollToCoordPage = (page) => {
    const el = coordSliderRef.current;
    if (!el || coordTotalPages <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = (page / (coordTotalPages - 1)) * maxScroll;
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!useCoordMobileSlider) return;
    const el = coordMobileSliderRef.current;
    if (!el) return;

    const total = Math.ceil(filteredCoords.length / 2);
    setCoordMobileTotalPages(total);

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (clientHeight === 0) return;
      const maxScroll = scrollHeight - clientHeight;
      setCoordMobileCanScroll(maxScroll > 1);
      if (total <= 1 || maxScroll <= 0) {
        setCoordMobileActivePage(0);
      } else {
        const page = Math.round((scrollTop / maxScroll) * (total - 1));
        setCoordMobileActivePage(Math.min(Math.max(page, 0), total - 1));
      }
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [useCoordMobileSlider, filteredCoords.length]);

  const scrollToCoordMobilePage = (page) => {
    const el = coordMobileSliderRef.current;
    if (!el || coordMobileTotalPages <= 1) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const target = (page / (coordMobileTotalPages - 1)) * maxScroll;
    el.scrollTo({ top: target, behavior: 'smooth' });
  };

  const { isInEventWishlist, toggleEventWishlist, isAuthenticated, canWishlist } = useEventWishlist();
  const isInWishlist = isInEventWishlist(event?._id);

  // Fork dialog for logged-out visitors: Log in / Register / Continue as guest.
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Waitlist: capacityFull comes from EventCapacityDisplay's callback (no second capacity fetch).
  const [capacityFull, setCapacityFull] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  // Live waitlist flag: seeded from the (possibly cached) event prop, then corrected by the live
  // capacity endpoint below so a stale slug-page cache can never hide/show the CTA wrongly.
  const [waitlistEnabledLive, setWaitlistEnabledLive] = useState(!!event?.waitlistEnabled);

  // Stable handler so EventCapacityDisplay's effect does not re-fetch every render. The child
  // already fetches capacity for its "N of M spots left" line; we reuse that result here instead
  // of a second fetch. 'sold-out' status => the event is full. The same LIVE response also carries
  // waitlistEnabled, so both signals the CTA needs come from the uncached endpoint.
  const handleCapacityUpdate = useCallback((cap) => {
    setCapacityFull(cap?.status === 'sold-out');
    if (cap && typeof cap.waitlistEnabled === 'boolean') {
      setWaitlistEnabledLive(cap.waitlistEnabled);
    }
  }, []);

  // Guests are treated as logged out on the event page: they see the Register/Purchase CTA
  // (same as a paid event), never the registered/checked-in state - their proof is the email.
  // Members keep it. See featureplans/events-guest-attendee.md.
  const currentUser = useSelector((state) => state.user.user);
  const isGuest = currentUser?.role === 'guest';

  const { currentRegistration, registrationStatus } = useSelector((state) => state.freeEvents);
  // currentRegistration is a single global value, so only trust it when it belongs to THIS
  // event; and never show the registered/checked-in state to a guest.
  const registrationForThisEvent =
    !isGuest && !!currentRegistration && String(currentRegistration.event) === String(event?._id);
  const isRegistered = registrationForThisEvent && currentRegistration.status === 'registered';
  const isCheckedIn = registrationForThisEvent && currentRegistration.status === 'checkedin';

  useEffect(() => {
    if (event?._id) {
      dispatch(checkRegistrationStatus(event._id));
    }
  }, [dispatch, event?._id]);

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
  }, [event?.description, descriptionExpanded]);

  // Check if user just logged in and wanted to register → send them straight to the RSVP page.
  // (The old version opened a modal here; now RSVP lives at /events/rsvp/[eventId].)
  useEffect(() => {
    if (isAuthenticated && event?._id) {
      const pendingEventId = localStorage.getItem('eventRegistrationPending');
      if (pendingEventId === event._id) {
        localStorage.removeItem('eventRegistrationPending');
        if (!event.isPaid) {
          router.push(`/events/rsvp/${event._id}`);
        }
      }
    }
  }, [isAuthenticated, event?._id, event?.isPaid, router]);

  const handleNextImage = () => {
    if (event.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }
  };

  const handlePrevImage = () => {
    if (event.images?.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? event.images.length - 1 : prev - 1
      );
    }
  };

  const handleWishlistToggle = () => {
    if (!canWishlist) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
    toggleEventWishlist(event._id);
  };

  // Floating Chat pill → scroll the inline chat into view and focus its textarea.
  const handleContactClick = () => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        chatRef.current?.querySelector('textarea')?.focus();
      }, 500);
    }
  };

  // Swipe handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && event.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
    }
    if (isRightSwipe && event.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? event.images.length - 1 : prev - 1));
    }
  };

  // Keyboard handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!event) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-slate-500">Event details not available.</p>
      </div>
    );
  }

  // Handle ticket purchase navigation
  const handlePurchaseTickets = () => {
    // Fork for a logged-out visitor AND for a live guest starting a new attend action:
    // each event re-offers Log in / Register / Continue as guest (the guest is treated as
    // logged out everywhere, so the CTA must ask again). The dialog owns the redirect and
    // guest-session logic. See featureplans/events-guest-attendee.md.
    if (!isAuthenticated || isGuest) {
      setAuthModalOpen(true);
      return;
    }
    // Navigate to the ticket selection page
    router.push(`/events/tickets/${event._id}`);
  };

  // Show the waitlist CTA only when the event is genuinely full, the organiser turned the
  // waitlist on, and it is a real (non-promo) event. Server re-validates all of this on join.
  const showWaitlist = capacityFull && waitlistEnabledLive && !event.isAdvertiseOnly;

  // Join in one tap for a live session (member or guest email); logged-out visitors get the
  // email + reCAPTCHA modal. Server decides the real outcome (see featureplans/events-waitlist.md).
  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      setWaitlistModalOpen(true);
      return;
    }
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${event._id}/waitlist/join`,
        {},
        { withCredentials: true }
      );
      setWaitlistJoined(true);
      toast.success(data?.message || 'You are on the waitlist.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not join the waitlist. Please try again.');
    }
  };

  // Green joined state, or the Join button. Reused by both the paid and free action areas.
  const waitlistBlock = waitlistJoined ? (
    <div className="w-full sm:w-auto bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
      <FaCheckCircle />
      You are on the waitlist
    </div>
  ) : (
    <button
      onClick={handleJoinWaitlist}
      className="inline-flex items-center gap-2 bg-teal-700 text-white hover:bg-teal-800 px-5 py-2 rounded-full shadow-sm font-semibold text-sm transition-colors"
    >
      Join the waitlist
    </button>
  );

  // Use timezone-aware formatting
  const dateTimeZone = event.timeZone || 'Australia/Sydney';

  const formattedDate = formatInTimeZone(
    event.dateTime,
    dateTimeZone,
    'EEEE, MMMM do, yyyy'
  );

  const formattedTime = formatInTimeZone(
    event.dateTime,
    dateTimeZone,
    'h:mm a'
  );

  return (
    <div className="mx-auto">
      {/* Image Section */}
      <div
        className="relative w-full mx-auto bg-white overflow-hidden rounded h-[200px] sm:h-[300px] md:h-[400px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={event.images?.length > 0 ? getOptimizedImageUrl(event.images[currentImageIndex]) : FALLBACK_IMAGE}
          alt={event.title || 'Event Image'}
          className="object-contain w-full h-full cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
  {/* Fullscreen hint */}
  {event.images?.length > 0 && (
    <div 
      className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs flex items-center gap-1 pointer-events-none"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
      <span>Click for full view</span>
    </div>
  )}

        {/* Image Navigation */}
        {event.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition-colors"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition-colors"
            >
              <FaChevronRight />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {event.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? 'w-6 bg-teal-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            
          </>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full z-10 transition-colors ${
            isInWishlist
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-slate-300 hover:bg-slate-400'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-sm sm:text-base md:text-lg ${
              isInWishlist ? 'text-white' : 'text-slate-700'
            }`}
          />
        </button>


      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && event.images?.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <img
            src={getOptimizedImageUrl(event.images[currentImageIndex], 'fullscreen')}
            alt={event.title || 'Event Image'}
            className="object-contain w-full h-full max-w-full max-h-full"
          />

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-800 p-2 rounded-full shadow hover:bg-white transition"
          >
            <FaTimes size={24} />
          </button>

          {event.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-3 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-slate-800 p-3 rounded-full shadow hover:bg-white transition"
              >
                <FaChevronRight />
              </button>

              {/* Fullscreen Dot Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {event.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex
                        ? 'w-8 bg-teal-500'
                        : 'w-2.5 bg-slate-400 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Title Section */}
      {event.title && (
        <div className="my-2 px-2">
          <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-slate-900 break-words">{event.title}</h1>
          {event.eventCode && (
            <p className="text-center text-sm sm:text-base text-slate-700 mt-1">
              (event code: {event.eventCode})
            </p>
          )}
        </div>
      )}

      {/* Main Details Section */}
      <div className="my-4 p-3">
        <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Event Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Date */}
          <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
            <FaCalendarAlt className="text-slate-500 shrink-0" size={13} title="Date" aria-label="Date" />
            <span>{formattedDate}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
            <FaClock className="text-slate-500 shrink-0" size={13} title="Time" aria-label="Time" />
            <span>{formattedTime} ({dateTimeZone})</span>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
            <GiTheaterCurtains className="text-slate-500 shrink-0" size={15} title="Venue" aria-label="Venue" />
            <span>{event.venue}</span>
          </div>

          {/* Address - Full width if address exists */}
          {event.address && (
            <div className="flex items-center gap-2 text-sm sm:text-base sm:col-span-2 text-slate-700 min-w-0">
              <FaMapMarkedAlt className="text-slate-500 shrink-0" size={13} title="Address" aria-label="Address" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address.formattedAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 underline"
              >
                {event.address.formattedAddress}
              </a>
            </div>
          )}

        </div>
      </div>
          
      {/* Event Organizer Section */}
      {event.organizer && (
        <div className="my-4 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Event Organizer</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
              <FaUser className="text-slate-500 shrink-0" size={13} title="Name" aria-label="Name" />
              <span className="truncate" title={event.organizer.name}>{event.organizer.name}</span>
            </div>
            {event.organizer.contact && (
              <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
                <FaMobileAlt className="text-slate-500 shrink-0" size={13} title="Phone" aria-label="Phone" />
                <a href={`tel:${event.organizer.contact}`} className="hover:text-slate-900 underline truncate sm:whitespace-normal">
                  {event.organizer.contact}
                </a>
              </div>
            )}
            {event.organizer.email && (
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
                <FaEnvelope className="text-slate-500 shrink-0" size={13} title="Email" aria-label="Email" />
                <a
                  href={`mailto:${event.organizer.email}`}
                  className="hover:text-slate-900 underline break-all"
                >
                  {event.organizer.email}
                </a>
              </div>
            )}
            {event.organizer.website && (
              <div className="col-span-2 sm:col-span-1 flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
                <FaGlobe className="text-slate-500 shrink-0" size={13} title="Website" aria-label="Website" />
                <a
                  href={event.organizer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 underline inline-flex items-center gap-1 break-all"
                >
                  {event.organizer.website}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}
            {event.organizer.socialMedia && event.organizer.socialMedia.length > 0 && (
              <div className="col-span-2 flex items-center gap-2 text-sm sm:text-base text-slate-700 flex-wrap">
                <FaThumbsUp className="text-slate-500 shrink-0" size={13} title="Follow us" aria-label="Follow us" />
                {event.organizer.socialMedia.map((social, index) => (
                  <React.Fragment key={index}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-slate-900"
                    >
                      {social.platform}
                    </a>
                    {index < event.organizer.socialMedia.length - 1 && (
                      <span className="text-slate-400">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}



      {/* Coordinators Section */}
      {filteredCoords.length > 0 && (() => {
        const renderCard = (coordinator, index, extraClasses = '') => (
          <div key={index} className={`p-2 space-y-1 ${extraClasses}`}>
            {coordinator.name && (
              <div className="flex items-center gap-2 text-sm sm:text-base text-slate-700 min-w-0">
                <FaUser className="text-slate-500 shrink-0" size={13} title="Name" aria-label="Name" />
                <span className="truncate" title={coordinator.name}>{coordinator.name}</span>
              </div>
            )}
            {coordinator.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <FaMobileAlt className="text-slate-500 shrink-0" size={12} title="Phone" aria-label="Phone" />
                <a href={`tel:${coordinator.phone}`} className="hover:text-slate-900 underline truncate">{coordinator.phone}</a>
              </div>
            )}
            {coordinator.role && (
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <FaUserTie className="text-slate-500 shrink-0" size={12} title="Role" aria-label="Role" />
                <span>{coordinator.role}</span>
              </div>
            )}
            {coordinator.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <FaEnvelope className="text-slate-500 shrink-0" size={12} title="Email" aria-label="Email" />
                <a href={`mailto:${coordinator.email}`} className="hover:text-slate-900 underline break-all">
                  {coordinator.email}
                </a>
              </div>
            )}
          </div>
        );

        return (
          <div className="my-4 p-3">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Event Coordinators</h3>

            {/* Mobile: vertical slider when >2 coords, otherwise stacked */}
            <div className="md:hidden">
              {useCoordMobileSlider ? (
                <div className="flex gap-2 items-stretch">
                  <div
                    ref={coordMobileSliderRef}
                    className="flex-1 min-w-0 max-h-56 overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth space-y-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                  >
                    {filteredCoords.map((c, i) => renderCard(c, i, 'snap-start'))}
                  </div>
                  {coordMobileCanScroll && coordMobileTotalPages > 1 && (
                    <div className="flex flex-col justify-center gap-1.5 shrink-0">
                      {Array.from({ length: coordMobileTotalPages }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToCoordMobilePage(i)}
                          aria-label={`Go to page ${i + 1}`}
                          className={`w-2 rounded-full transition-all ${
                            i === coordMobileActivePage
                              ? 'h-6 bg-teal-700'
                              : 'h-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCoords.map((c, i) => renderCard(c, i))}
                </div>
              )}
            </div>

            {/* Desktop: slider when >3 coords, otherwise 3-col grid */}
            <div className="hidden md:block">
              {useCoordSlider ? (
                <>
                  <div className="w-full max-w-full overflow-hidden">
                    <div
                      ref={coordSliderRef}
                      className="w-full max-w-full flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                    >
                      {filteredCoords.map((c, i) => renderCard(c, i, 'snap-start shrink-0 grow-0 basis-[calc((100%-1.5rem)/3)] min-w-0'))}
                    </div>
                  </div>
                  {coordCanScroll && coordTotalPages > 1 && (
                    <div className="flex justify-center gap-1.5 mt-3">
                      {Array.from({ length: coordTotalPages }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => scrollToCoordPage(i)}
                          aria-label={`Go to page ${i + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            i === coordActivePage
                              ? 'w-6 bg-teal-700'
                              : 'w-2 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredCoords.map((c, i) => renderCard(c, i))}
                </div>
              )}
            </div>
          </div>
        );
      })()}


      {/* Description Section */}
      {event.description && (
        <div className="my-4 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">About This Event</h3>
          <div className="relative">
            <div
              ref={descriptionRef}
              className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${
                descriptionExpanded ? '' : 'line-clamp-[20]'
              }`}
            >
              {linkifyDescription(event.description)}
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

      {/* Tickets — capacity + ticket types + purchase, in sequence (paid events) */}
      {event.isPaid && event.ticketTypes?.length > 0 && (
        <div ref={actionRef} className="my-4 p-3">
          {/* Two columns: ticket types take most of the width (column 1); capacity + purchase sit
              in a narrow column 2 (only the width they need). Stacks on mobile. No heading. */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">

            {/* Column 1 — ticket types. ONE bordered card, rows divided by a subtle line; 5+ types
                scroll inside the card so it stays compact. */}
            <div className="flex-1 min-w-0">
              <div className={`rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 transition-opacity ${capacityFull ? 'opacity-50' : ''} ${event.ticketTypes.length > 4 ? 'max-h-72 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full' : ''}`}>
                {event.ticketTypes.map((ticket, index) => {
                  // Capacity is event-level, not per-ticket, so the list only reflects sale-window status.
                  const status = event.timeZone ? getTicketSaleStatus(ticket, event.timeZone, null) : null;
                  const StatusIcon = status?.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start justify-between gap-4 px-4 py-3 ${status?.unavailable ? 'opacity-60' : ''}`}
                    >
                      {/* Name, note and status all wrap in this first column; the price sits
                          top-aligned in its own narrow column, so a long note stays left. */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold text-slate-800 truncate">{ticket.name}</p>
                        {ticket.note && (
                          <p className="text-xs mt-0.5 text-slate-500">{ticket.note}</p>
                        )}
                        {status && (
                          <p className={`flex items-center gap-1 text-xs mt-0.5 ${status.className}`}>
                            {StatusIcon && <StatusIcon size={12} className="shrink-0" />}
                            {status.message}
                          </p>
                        )}
                      </div>
                      <p className="text-base sm:text-lg font-bold text-teal-700 shrink-0">${ticket.price}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2 — capacity then purchase, only the width it needs. */}
            {!event.isAdvertiseOnly && (
              <div className="w-full lg:w-56 shrink-0 space-y-4">
                <EventCapacityDisplay
                  eventId={event._id}
                  isPaid={event.isPaid}
                  context="viewing"
                  maxPerRegistration={event.maxAttendeesPerRegistration}
                  onCapacityUpdate={handleCapacityUpdate}
                  stack
                />
                <div className="flex justify-center lg:justify-start">
                  {showWaitlist ? (
                    waitlistBlock
                  ) : (
                    <button
                      onClick={handlePurchaseTickets}
                      className="inline-flex items-center gap-2 bg-teal-700 text-white hover:bg-teal-800 px-5 py-2 rounded-full shadow-sm font-semibold text-sm transition-colors"
                    >
                      <FaShoppingCart />
                      Purchase Tickets
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Policy Section (for paid events) */}
      {event.isPaid && event.refundPolicy && (
        <div className="my-4 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 pb-2 border-b border-slate-200 mb-3">Refund Policy</h3>
          <div className="text-sm text-slate-700 space-y-2">
            {/* Processing Fee Policy */}
            <p>
              Processing fees are {event.refundPolicy.processingFeePolicy === 'refunded'
                ? 'refundable'
                : 'non-refundable'}.
            </p>

            {/* Custom Policy Text */}
            {event.refundPolicy.policyText && event.refundPolicy.policyText.trim() && (
              <p className="whitespace-pre-line leading-relaxed">
                {event.refundPolicy.policyText}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Booking Card — capacity + RSVP CTA (free events; paid events use the Tickets section above) */}
      {!event.isAdvertiseOnly && !event.isPaid && (
        <div ref={actionRef} className="my-4 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
          <EventCapacityDisplay
            eventId={event._id}
            isPaid={event.isPaid}
            context="viewing"
            maxPerRegistration={event.maxAttendeesPerRegistration}
            onCapacityUpdate={handleCapacityUpdate}
          />
          <div className="border-t border-slate-200 my-4"></div>
          <div className="flex justify-center">
            {isCheckedIn ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full sm:w-auto bg-green-50 text-green-700 border border-green-200 px-8 py-3 rounded-lg font-semibold text-sm md:text-base flex items-center justify-center gap-2">
                    <FaCheckCircle />
                    Checked In
                  </div>
                  <Link
                    href="/users/profile/myregistrations"
                    className="text-sm text-teal-700 hover:text-teal-800 underline"
                  >
                    View my RSVPs
                  </Link>
                </div>
              ) : isRegistered ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full sm:w-auto bg-green-50 text-green-700 border border-green-200 px-8 py-3 rounded-lg font-semibold text-sm md:text-base flex items-center justify-center gap-2">
                    <FaCheckCircle />
                    Already Registered
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Link
                      href="/users/profile/myregistrations"
                      className="text-teal-700 hover:text-teal-800 underline"
                    >
                      View my RSVPs
                    </Link>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => dispatch(unregisterFromFreeEvent(event._id))}
                      disabled={registrationStatus === 'loading'}
                      className="text-red-600 hover:text-red-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registrationStatus === 'loading' ? 'Cancelling...' : 'Cancel registration'}
                    </button>
                  </div>
                </div>
              ) : showWaitlist ? (
                waitlistBlock
              ) : (
                <button
                  onClick={() => {
                    // Fork for a logged-out visitor AND a live guest starting a new attend
                    // action (re-offers Log in / Register / Continue as guest per event).
                    if (!isAuthenticated || isGuest) {
                      setAuthModalOpen(true);
                      return;
                    }
                    router.push(`/events/rsvp/${event._id}`);
                  }}
                  className="w-full sm:w-auto bg-teal-700 text-white hover:bg-teal-800 px-8 py-3 rounded-lg shadow font-semibold text-sm md:text-base transition-colors"
                  disabled={registrationStatus === 'loading'}
                >
                  {registrationStatus === 'loading'
                    ? 'Processing...'
                    : 'Register for Event'
                  }
                </button>
              )
            }
          </div>
        </div>
      )}

      {/* Fork dialog for logged-out visitors (free Register + paid Purchase). */}
      <EventAttendAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        event={event}
      />

      {/* Logged-out waitlist join (email + reCAPTCHA). Session visitors join in one tap instead. */}
      <WaitlistJoinModal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        event={event}
        onJoined={() => setWaitlistJoined(true)}
      />

      {/* External registration / tickets button — shown after event details */}
      {chatProps?.isPromotionalEvent && event.externalTicketUrl && (
        <div className="px-2 py-4 flex justify-center">
          <a
            href={event.externalTicketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-teal-700 text-white hover:bg-teal-800 px-6 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors inline-flex items-center"
          >
            {chatProps.promoCtaLabel}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Chat Container - Mobile Only (At the bottom) */}
      {chatProps && (
        <div ref={chatRef} className="block lg:hidden px-2 my-4">
          {chatProps.isCuratedEvent ? (
            <div className="p-3 w-full border-t border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Get in touch</h2>
              <p className="text-sm text-slate-700 mb-4">
                This event has been added on behalf of the organiser. Please use the contact details provided to reach them directly.
              </p>
              <p className="text-xs text-slate-500">
                Are you the organiser?{' '}
                <a
                  href={`/support/removal?type=event&id=${event._id}&title=${encodeURIComponent(event.title)}`}
                  onClick={() => {
                    localStorage.setItem('removalReturnUrl', `/events/views/${event._id}`);
                  }}
                  className="text-slate-700 hover:text-slate-900 underline"
                >
                  Request removal of this event
                </a>
              </p>
            </div>
          ) : (
            <SendMessage {...chatProps} />
          )}
        </div>
      )}

      {/* Registration modal removed — RSVP is now a full page at /events/rsvp/[eventId]. */}

      {/* Floating Buttons - Mobile Only. Fade out once the inline chat is in view. */}
      <div
        className={`lg:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3 transition-all duration-200 ${
          pillsHidden ? 'opacity-0 pointer-events-none translate-y-2' : 'opacity-100'
        }`}
        aria-hidden={pillsHidden}
      >
        {/* Share Button */}
        <button
          onClick={async () => {
            if (navigator.share) {
              try {
                const slugUrl = buildSlugUrl('event', event.title, event._id);
                const shareUrl = `${window.location.origin}${slugUrl}?v=${Date.now()}`;
                await navigator.share({
                  title: event.title,
                  text: event.title,
                  url: shareUrl
                });
              } catch (err) {
                if (err.name !== 'AbortError') console.error('Share failed:', err);
              }
            }
          }}
          className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
          aria-label="Share event"
        >
          <FaShareAlt size={16} />
          <span>Share</span>
        </button>

        {/* Chat Button — enquiry events only (curated events have no chat) */}
        {chatProps && !chatProps.isCuratedEvent && (
          <button
            onClick={handleContactClick}
            className="bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
            aria-label="Chat with organiser"
          >
            <FaCommentDots size={16} />
            <span>Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleEventCard;