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
  FaShoppingCart
} from 'react-icons/fa';
import { MdLocationOn, MdEmail, MdPhone, MdPerson, MdEventSeat } from 'react-icons/md';
import { useEventWishlist } from '@/utils/helpers/events/userEventWishlist';
import { getEventTicketStatus, getTicketSaleStatus } from '@/utils/events/ticketStatusHelper';
import SendMessage from '@/components/chat/SendMessage';
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
  const descriptionRef = useRef(null);

  const { isInEventWishlist, toggleEventWishlist, isAuthenticated } = useEventWishlist();
  const isInWishlist = isInEventWishlist(event?._id);

  const { currentRegistration, registrationStatus } = useSelector((state) => state.freeEvents);
  const isRegistered = !!currentRegistration && currentRegistration.status === 'registered';

  if (!event) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-500">Event details not available.</p>
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
<div className="relative w-full mx-auto bg-gray-200 overflow-hidden rounded h-[200px] sm:h-[300px] md:h-[400px]">
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

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 text-white p-2 rounded-full z-10 ${
            isInWishlist
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-300 hover:bg-gray-400'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart
            className={`text-sm sm:text-base md:text-lg ${
              isInWishlist ? 'text-white' : 'text-gray-700'
            }`}
          />
        </button>


      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && event.images?.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img
            src={getOptimizedImageUrl(event.images[currentImageIndex], 'fullscreen')}
            alt={event.title || 'Event Image'}
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
      {event.title && (
        <div className="my-2 px-2">
          <h1 className="text-base sm:text-lg text-center font-bold my-1 px-2 text-gray-800 break-words">{event.title}</h1>
        </div>
      )}

      {/* Main Details Section */}
      <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Event Details</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Date & Time */}
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-gray-700">Date:</span>{' '}
              <span className="text-gray-600">{formattedDate}</span>
            </div>
            
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-gray-700">Time:</span>{' '}
              <span className="text-gray-600">{formattedTime} ({dateTimeZone})</span>
            </div>
            
            {/* Venue */}
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-gray-700">Venue:</span>{' '}
              <span className="text-gray-600">{event.venue}</span>
            </div>
            
            {/* Location - Full width if address exists */}
            {event.address && (
              <div className="text-sm sm:text-base sm:col-span-2">
                <span className="font-semibold text-gray-700">Address:</span>{' '}
                <span className="text-gray-600">{event.address.formattedAddress}</span>
              </div>
            )}
            
            {/* Category */}
            {event.category && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Category:</span>{' '}
                <span className="text-gray-600">{event.category}</span>
              </div>
            )}
            
            {/* Organized By - hide when posted by support on behalf of users */}
            {event.postedBy?.name && !chatProps?.isPostedBySupport && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Organized By:</span>{' '}
                <span className="text-gray-600">{event.postedBy.name}</span>
              </div>
            )}
            
            {/* Event Code */}
            {event.eventCode && (
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Event Code:</span>{' '}
                <span className="text-gray-600">{event.eventCode}</span>
              </div>
            )}
            
            {/* Event Type */}
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-gray-700">Type:</span>{' '}
              <span className="text-gray-600">{event.isPaid ? 'Paid Event' : 'Free Event'}</span>
            </div>
          </div>
        </div>
      </div>
          
      {/* Event Organizer Section */}
      {event.organizer && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Event Organizer</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="text-sm sm:text-base">
                <span className="font-semibold text-gray-700">Name:</span>{' '}
                <span className="text-gray-600">{event.organizer.name}</span>
              </div>
              {event.organizer.website && (
                <div className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">Website:</span>{' '}
                  <a 
                    href={event.organizer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {event.organizer.website}
                  </a>
                </div>
              )}
              {event.organizer.contact && (
                <div className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">Contact:</span>{' '}
                  <span className="text-gray-600">{event.organizer.contact}</span>
                </div>
              )}
              {event.organizer.email && (
                <div className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">Email:</span>{' '}
                  <a 
                    href={`mailto:${event.organizer.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {event.organizer.email}
                  </a>
                </div>
              )}
              {event.organizer.socialMedia && event.organizer.socialMedia.length > 0 && (
                <div className="text-sm sm:text-base">
                  <span className="font-semibold text-gray-700">Social Media:</span>{' '}
                  <span className="text-gray-600">
                    {event.organizer.socialMedia.map((social, index) => (
                      <a                          
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 ml-2"
                      >
                        {social.platform}
                      </a>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Coordinators Section */}
      {event.coordinators?.length > 0 && 
       event.coordinators.some(coord => coord?.name || coord?.role || coord?.phone || coord?.email) && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Event Coordinators</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.coordinators
                .filter(coordinator => coordinator?.name || coordinator?.role || coordinator?.phone || coordinator?.email)
                .map((coordinator, index) => (
                <div key={index} className="border border-gray-200 rounded p-2">
                  {coordinator.name && (
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold text-gray-700">{coordinator.name}</span>
                    </div>
                  )}
                  {coordinator.role && (
                    <div className="text-sm text-gray-600">{coordinator.role}</div>
                  )}
                  {coordinator.phone && (
                    <div className="text-sm text-gray-600">{coordinator.phone}</div>
                  )}
                  {coordinator.email && (
                    <div className="text-sm text-gray-600">
                      <a href={`mailto:${coordinator.email}`} className="text-blue-600 hover:underline">
                        {coordinator.email}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Description Section */}
      {event.description && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">About This Event</h3>
          </div>
          <div className="p-3 relative">
            <div 
              ref={descriptionRef}
              className="text-sm sm:text-base text-gray-700 space-y-2 overflow-y-auto min-h-[100px] max-h-[300px] sm:max-h-[400px] pr-2"
            >
              {event.description.split('\n').map((para, idx) => (
                para.trim() && <p key={idx} className="leading-relaxed">{para}</p>
              ))}
            </div>
            {descriptionOverflow && (
              <div className="absolute bottom-3 left-3 right-3 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            )}
          </div>
        </div>
      )}

      {/* Capacity Display Section */}
      {!event.isAdvertiseOnly && (
      <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800">Event Capacity</h3>
        </div>
        <div className="p-3">
          <EventCapacityDisplay 
            eventId={event._id} 
            isPaid={event.isPaid} 
            context="viewing"
            maxPerRegistration={event.maxAttendeesPerRegistration}
          />
        </div>
      </div>
      )}
        
      {/* Available Tickets Section (for paid events) */}
      {event.isPaid && event.ticketTypes?.length > 0 && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Available Tickets</h3>
          </div>
          <div className="p-3">
            <div className="space-y-3">
              {event.ticketTypes.map((ticket, index) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-700">{ticket.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-gray-700">${ticket.price}</p>
                      {event.applyGST && (
                        <p className="text-xs text-gray-500">incl. GST</p>
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
        </div>
      )}

      {/* Refund Policy Section (for paid events) */}
      {event.isPaid && event.refundPolicy && (
        <div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">Refund Policy</h3>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-700 space-y-2">
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
        </div>
      )}

      {/* Registration/Purchase Button Section */}
      {!event.isAdvertiseOnly && (
      <div className="px-2 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Handle Free vs Paid Events */}
          {event.isPaid ? (
            // PAID EVENT: Show Purchase Tickets button (now navigates to page instead of modal)
            <button
              onClick={handlePurchaseTickets}
              className="flex-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors flex items-center justify-center"
            >
              <FaShoppingCart className="mr-2" />
              Purchase Tickets
            </button>
          ) : (
            // FREE EVENT: Show Register/Unregister logic
            isRegistered ? (
              <button
                onClick={() => dispatch(unregisterFromFreeEvent(event._id))}
                className="flex-1 bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
                disabled={registrationStatus === 'loading'}
              >
                {registrationStatus === 'loading' ? 'Unregistering...' : 'Unregister from Event'}
              </button>
            ) : (
<button
  onClick={() => {
    if (!isAuthenticated) {
      // Save intended action
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      localStorage.setItem('eventRegistrationPending', event._id);
      // Don't overwrite eventViewReturnUrl if it already exists
      // This preserves the original navigation path
      if (!localStorage.getItem('eventViewReturnUrl')) {
        localStorage.setItem('eventViewReturnUrl', '/events');
      }
      // Redirect to login with preserve redirect flag
      router.push('/login?preserveRedirect=true');
      return;
    }
    setShowRegistrationForm(true);
  }}
  className="flex-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors"
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

      </div>
      )}

      {/* Chat Container - Mobile Only (At the bottom) */}
      {chatProps && (
        <div className="block lg:hidden px-2 my-4">
          <SendMessage {...chatProps} />
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
    </div>
  );
};

export default SingleEventCard;