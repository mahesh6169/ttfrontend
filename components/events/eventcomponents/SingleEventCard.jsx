// components/events/eventcomponents/SingleEventCard.jsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
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
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaTag,
  FaUserFriends,
  FaShoppingCart,
  FaShareAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MdLocationOn, MdEmail, MdPhone, MdPerson, MdEventSeat } from 'react-icons/md';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import { getEventTicketStatus, getTicketSaleStatus } from '@/utils/events/ticketStatusHelper';
import SendMessage from '@/components/chat/SendMessage';
import ShareIcons from '@/components/shared/ShareIcons';
import EventRegistrationModal from '../registration/EventRegistrationModal';
import EventCapacityDisplay from './EventCapacityDisplay';
import { formatInTimeZone } from 'date-fns-tz';
import { checkRegistrationStatus, unregisterFromFreeEvent } from '@/store/slices/events/freeEventSlice';

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
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [descriptionOverflow, setDescriptionOverflow] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const descriptionRef = useRef(null);
  const minSwipeDistance = 50;

  const { isInEventWishlist, toggleEventWishlist, isAuthenticated } = useEventWishlist();
  const isInWishlist = isInEventWishlist(event?._id);

  const { currentRegistration, registrationStatus } = useSelector((state) => state.freeEvents);
  const isRegistered = !!currentRegistration && currentRegistration.status === 'registered';

  if (!event) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-slate-500">Event details not available.</p>
      </div>
    );
  }

  const checkOverflow = (ref, setter) => {
    if (ref.current) {
      const { scrollHeight, clientHeight, scrollTop } = ref.current;
      const hasOverflow = scrollHeight > clientHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;
      setter(hasOverflow && !isAtBottom);
    }
  };

  useEffect(() => {
    if (event?._id) {
      dispatch(checkRegistrationStatus(event._id));
    }
  }, [dispatch, event?._id]);

  useEffect(() => {
    checkOverflow(descriptionRef, setDescriptionOverflow);

    const descriptionEl = descriptionRef.current;
    const handleDescriptionScroll = () => checkOverflow(descriptionRef, setDescriptionOverflow);

    if (descriptionEl) {
      descriptionEl.addEventListener('scroll', handleDescriptionScroll);
    }

    return () => {
      if (descriptionEl) {
        descriptionEl.removeEventListener('scroll', handleDescriptionScroll);
      }
    };
  }, [event.description]);

  // Check if user just logged in and wanted to register
  useEffect(() => {
    if (isAuthenticated && event?._id) {
      const pendingEventId = localStorage.getItem('eventRegistrationPending');
      if (pendingEventId === event._id) {
        // Clear the flag
        localStorage.removeItem('eventRegistrationPending');
        // Open registration modal for free events
        if (!event.isPaid) {
          setShowRegistrationForm(true);
        }
      }
    }
  }, [isAuthenticated, event?._id, event?.isPaid]);

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
    if (!isAuthenticated) {
      alert('Please log in to use the wishlist feature.');
      return;
    }
    toggleEventWishlist(event._id);
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

  // Handle ticket purchase navigation
  const handlePurchaseTickets = () => {
    if (!isAuthenticated) {
      // Save intended destination
      localStorage.setItem('redirectAfterLogin', `/events/tickets/${event._id}`);
      // Don't overwrite eventViewReturnUrl if it already exists
      // This preserves the original navigation path
      if (!localStorage.getItem('eventViewReturnUrl')) {
        localStorage.setItem('eventViewReturnUrl', '/events');
      }
      // Redirect to login with preserve redirect flag
      router.push('/login?preserveRedirect=true');
      return;
    }
    // Navigate to the ticket selection page
    router.push(`/events/tickets/${event._id}`);
  };

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
    <div className="border rounded shadow-md mx-auto">
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition-colors"
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
            className="absolute top-4 right-4 bg-amber-300 text-teal-700 p-2 rounded-full shadow hover:bg-amber-400 transition"
          >
            <FaTimes size={24} />
          </button>

          {event.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-300 text-teal-700 p-3 rounded-full shadow hover:bg-amber-400 transition"
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
        </div>
      )}

      {/* Main Details Section */}
      <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Event Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Date & Time */}
          <div className="text-sm sm:text-base">
            <span className="font-semibold text-slate-700">Date:</span>{' '}
            <span className="text-slate-600">{formattedDate}</span>
          </div>

          <div className="text-sm sm:text-base">
            <span className="font-semibold text-slate-700">Time:</span>{' '}
            <span className="text-slate-600">{formattedTime} ({dateTimeZone})</span>
          </div>

          {/* Venue */}
          <div className="text-sm sm:text-base">
            <span className="font-semibold text-slate-700">Venue:</span>{' '}
            <span className="text-slate-600">{event.venue}</span>
          </div>

          {/* Location - Full width if address exists */}
          {event.address && (
            <div className="text-sm sm:text-base sm:col-span-2">
              <span className="font-semibold text-slate-700">Address:</span>{' '}
              <span className="text-slate-600">{event.address.formattedAddress}</span>
            </div>
          )}

          {/* Category */}
          {event.category && (
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-slate-700">Category:</span>{' '}
              <span className="text-slate-600">{event.category}</span>
            </div>
          )}

          {/* Posted By - hide when curated on behalf of the organiser */}
          {event.postedBy?.name && !chatProps?.isCuratedEvent && (
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-slate-700">Posted By:</span>{' '}
              <span className="text-slate-600">{event.postedBy.name}</span>
            </div>
          )}

          {/* Event Code */}
          {event.eventCode && (
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-slate-700">Event Code:</span>{' '}
              <span className="text-slate-600">{event.eventCode}</span>
            </div>
          )}

          {/* Event Type */}
          <div className="text-sm sm:text-base">
            <span className="font-semibold text-slate-700">Type:</span>{' '}
            <span className="text-slate-600">{event.isPaid ? 'Paid Event' : 'Free Event'}</span>
          </div>
        </div>
      </div>
          
      {/* Event Organizer Section */}
      {event.organizer && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Event Organizer</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-slate-700">Name:</span>{' '}
              <span className="text-slate-600">{event.organizer.name}</span>
            </div>
            {event.organizer.website && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Website:</span>{' '}
                <a
                  href={event.organizer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
                >
                  {event.organizer.website}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}
            {event.organizer.contact && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Contact:</span>{' '}
                <a href={`tel:${event.organizer.contact}`} className="text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-1">
                  {event.organizer.contact}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}
            {event.organizer.email && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-slate-700">Email:</span>{' '}
                <a
                  href={`mailto:${event.organizer.email}`}
                  className="text-slate-700 hover:text-slate-900 hover:underline inline-flex items-center gap-1"
                >
                  {event.organizer.email}
                  <FaExternalLinkAlt className="text-xs text-slate-400" />
                </a>
              </div>
            )}
            {event.organizer.socialMedia && event.organizer.socialMedia.length > 0 && (
              <div className="flex items-center gap-2 text-sm sm:text-base flex-wrap">
                <span className="text-slate-700">Follow us:</span>
                {event.organizer.socialMedia.map((social, index) => (
                  <React.Fragment key={index}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-slate-900"
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
      {event.coordinators?.length > 0 &&
       event.coordinators.some(coord => coord?.name || coord?.role || coord?.phone || coord?.email) && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Event Coordinators</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.coordinators
              .filter(coordinator => coordinator?.name || coordinator?.role || coordinator?.phone || coordinator?.email)
              .map((coordinator, index) => (
              <div key={index} className="border border-slate-200 rounded p-2">
                {coordinator.name && (
                  <div className="text-sm sm:text-base">
                    <span className="font-semibold text-slate-700">{coordinator.name}</span>
                  </div>
                )}
                {coordinator.role && (
                  <div className="text-sm text-slate-600">{coordinator.role}</div>
                )}
                {coordinator.phone && (
                  <div className="text-sm text-slate-600">{coordinator.phone}</div>
                )}
                {coordinator.email && (
                  <div className="text-sm text-slate-600">
                    <a href={`mailto:${coordinator.email}`} className="text-slate-700 hover:text-slate-900 hover:underline">
                      {coordinator.email}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Description Section */}
      {event.description && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">About This Event</h3>
          <div className="relative">
            <div
              ref={descriptionRef}
              className="text-sm sm:text-base text-slate-700 space-y-2 overflow-y-auto min-h-[100px] max-h-[300px] sm:max-h-[400px] pr-2"
            >
              {event.description.split('\n').map((para, idx) => (
                para.trim() && <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
            {descriptionOverflow && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>
      )}

      {/* Capacity Display Section */}
      {!event.isAdvertiseOnly && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Event Capacity</h3>
          <EventCapacityDisplay
            eventId={event._id}
            isPaid={event.isPaid}
            context="viewing"
            maxPerRegistration={event.maxAttendeesPerRegistration}
          />
        </div>
      )}
        
      {/* Available Tickets Section (for paid events) */}
      {event.isPaid && event.ticketTypes?.length > 0 && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Available Tickets</h3>
          <div className="space-y-3">
            {event.ticketTypes.map((ticket, index) => (
              <div key={index} className="border border-slate-200 rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-700">{ticket.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-slate-700">${ticket.price}</p>
                    {event.applyGST && (
                      <p className="text-xs text-slate-500">incl. GST</p>
                    )}
                  </div>
                </div>

                {/* Dynamic Ticket Status */}
                {(() => {
                  if (!event.timeZone) return null;

                  const status = getTicketSaleStatus(ticket, event.timeZone, null); // Capacity only needed for PAID events

                  if (!status) return null;

                  return (
                    <div className={`text-xs mt-2 font-medium ${status.className}`}>
                      {status.icon} {status.message}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund Policy Section (for paid events) */}
      {event.isPaid && event.refundPolicy && (
        <div className="border border-slate-200 rounded shadow-sm my-4 mx-2 p-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 mb-3">Refund Policy</h3>
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

      {/* Registration/Purchase Button Section */}
      {!event.isAdvertiseOnly && (
        <div className="px-2 py-4 flex justify-center">
          {event.isPaid ? (
            <button
              onClick={handlePurchaseTickets}
              className="bg-teal-700 text-white hover:bg-teal-800 px-6 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors flex items-center"
            >
              <FaShoppingCart className="mr-2" />
              Purchase Tickets
            </button>
          ) : (
            isRegistered ? (
              <button
                onClick={() => dispatch(unregisterFromFreeEvent(event._id))}
                className="bg-red-500 text-white hover:bg-red-600 px-6 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
                disabled={registrationStatus === 'loading'}
              >
                {registrationStatus === 'loading' ? 'Unregistering...' : 'Unregister from Event'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    localStorage.setItem('eventRegistrationPending', event._id);
                    if (!localStorage.getItem('eventViewReturnUrl')) {
                      localStorage.setItem('eventViewReturnUrl', '/events');
                    }
                    router.push('/login?preserveRedirect=true');
                    return;
                  }
                  setShowRegistrationForm(true);
                }}
                className="bg-teal-700 text-white hover:bg-teal-800 px-6 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
                disabled={registrationStatus === 'loading'}
              >
                {registrationStatus === 'loading'
                  ? 'Processing...'
                  : !isAuthenticated
                    ? 'Login to Register'
                    : 'Register for Event'
                }
              </button>
            )
          )}
        </div>
      )}

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
        <div className="block lg:hidden px-2 my-4">
          {chatProps.isCuratedEvent ? (
            <div className="border border-slate-200 p-3 rounded shadow-md w-full">
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

      {/* Registration Modal */}
      <EventRegistrationModal
        event={event}
        isOpen={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        onSuccess={(data) => {
          console.log('Registration successful:', data);
        }}
      />

      {/* Floating Share Button - Mobile Only */}
      <button
        onClick={async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: event.title,
                text: event.title,
                url: window.location.href
              });
            } catch (err) {
              if (err.name !== 'AbortError') console.error('Share failed:', err);
            }
          }
        }}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-teal-700/80 backdrop-blur-sm text-white hover:bg-teal-700 flex items-center gap-2 px-4 py-3 rounded-full shadow font-semibold text-sm transition-colors"
        aria-label="Share event"
      >
        <FaShareAlt size={16} />
        <span>Share</span>
      </button>
    </div>
  );
};

export default SingleEventCard;