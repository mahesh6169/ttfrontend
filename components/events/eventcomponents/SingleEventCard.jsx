// components/events/eventcomponents/SingleEventCard.jsx

'use client';

import React, { useState, useEffect } from 'react';
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
import SendMessage from '@/components/chat/SendMessage';
import EventRegistrationModal from '../registration/EventRegistrationModal';
import EventCapacityDisplay from './EventCapacityDisplay';
import { formatInTimeZone } from 'date-fns-tz';
import { checkRegistrationStatus, unregisterFromFreeEvent } from '@/store/slices/events/freeEventSlice';

const SingleEventCard = ({ event, chatProps }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

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

  useEffect(() => {
    if (event?._id) {
      dispatch(checkRegistrationStatus(event._id));
    }
  }, [dispatch, event?._id]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % event.images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? event.images.length - 1 : prev - 1
    );
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
      alert('Please log in to purchase tickets.');
      router.push('/login');
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 md:h-80 bg-gray-200 overflow-hidden">
        {event.images?.length > 0 ? (
          <img
            src={event.images[currentImageIndex].url}
            alt={event.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setIsFullscreen(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No Image Available</span>
          </div>
        )}

        {/* Image Navigation */}
        {event.images?.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
            >
              <FaChevronRight />
            </button>
            
            {/* Image indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {event.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-lg ${
            isInWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-700'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FaHeart className="text-lg" />
        </button>


      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img
            src={event.images[currentImageIndex].url}
            alt="Event Full"
            className="object-contain w-[95vw] h-[95vh] rounded shadow-2xl"
          />
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200"
          >
            <FaTimes size={24} />
          </button>
          {event.images?.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-black p-2 rounded-full shadow hover:bg-gray-200"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}

      {/* Event Content */}
      <div className="p-6">
        {/* Event Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
              {event.title}
            </h1>
            {event.eventCode && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {event.eventCode}
              </span>
            )}
          </div>
          
          {event.category && (
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <FaTag className="mr-2" />
              <span>{event.category}</span>
            </div>
          )}
          
          {event.postedBy?.name && (
            <div className="flex items-center text-sm text-gray-600">
              <FaUser className="mr-2" />
              <span>Organized by {event.postedBy.name}</span>
            </div>
          )}
        </div>

        {/* Event Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Date & Time */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-600" />
              Date & Time
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700">{formattedDate}</p>
              <p className="text-gray-700">{formattedTime}</p>
              <p className="text-sm text-gray-500">Timezone: {dateTimeZone}</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-red-600" />
              Location
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700 font-medium">{event.venue}</p>
              {event.address?.formattedAddress && (
                <p className="text-gray-600 text-sm">{event.address.formattedAddress}</p>
              )}
            </div>
          </div>
        </div>
          
        {/* Event Organizer */}
        {event.organizer && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FaUser className="mr-2" />
              Event Organizer
            </h3>
            <div className="bg-white p-4 rounded border">
              <div className="space-y-2">
                <p className="font-medium text-gray-900 text-lg">{event.organizer.name}</p>
                {event.organizer.website && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">🌐</span>
                    <a 
                      href={event.organizer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {event.organizer.website}
                    </a>
                  </p>
                )}
                {event.organizer.contact && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaPhone className="mr-1" />
                    {event.organizer.contact}
                  </p>
                )}
                {event.organizer.email && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <FaEnvelope className="mr-1" />
                    <a 
                      href={`mailto:${event.organizer.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {event.organizer.email}
                    </a>
                  </p>
                )}
                {event.organizer.socialMedia && event.organizer.socialMedia.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Social Media:</p>
                    <div className="flex flex-wrap gap-2">
                      {event.organizer.socialMedia.map((social, index) => (
                        <a                          
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200"
                        >
                          {social.platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



{/* Coordinators - Only show if there are coordinators with actual data */}
{event.coordinators?.length > 0 && 
 event.coordinators.some(coord => coord?.name || coord?.role || coord?.phone || coord?.email) && (
  <div className="bg-gray-50 p-4 rounded-lg mb-6">
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
      <FaUserFriends className="mr-2" />
      Event Coordinators
    </h3>
    <div className="grid md:grid-cols-2 gap-4">
      {event.coordinators
        .filter(coordinator => coordinator?.name || coordinator?.role || coordinator?.phone || coordinator?.email)
        .map((coordinator, index) => (
        <div key={index} className="bg-white p-3 rounded border">
          <div className="space-y-1">
            {coordinator.name && (
              <p className="font-medium text-gray-900">{coordinator.name}</p>
            )}
            {coordinator.role && (
              <p className="text-sm text-gray-600">{coordinator.role}</p>
            )}
            {coordinator.phone && (
              <p className="text-sm text-gray-600 flex items-center">
                <FaPhone className="mr-1" />
                {coordinator.phone}
              </p>
            )}
            {coordinator.email && (
              <p className="text-sm text-gray-600 flex items-center">
                <FaEnvelope className="mr-1" />
                {coordinator.email}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}


        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">About This Event</h3>
            <div className="prose max-w-none text-gray-700">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        <EventCapacityDisplay eventId={event._id} isPaid={event.isPaid}  maxPerRegistration={event.maxAttendeesPerRegistration}/>
        
        {/* Available Tickets (for paid events) */}
{event.isPaid && event.ticketTypes?.length > 0 && (
  <div className="bg-green-50 p-4 rounded-lg mb-6">
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
      <FaTicketAlt className="mr-2 text-green-600" />
      Available Tickets
    </h3>
    

    
<div className="space-y-3">
      {event.ticketTypes.map((ticket, index) => (
        <div key={index} className="p-3 bg-white rounded border">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{ticket.name}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">${ticket.price}</p>
              {event.applyGST && (
                <p className="text-xs text-gray-500">incl. GST</p>
              )}
            </div>
          </div>
          
{/* Dynamic Ticket Status */}
          {(() => {
            if (!event.timeZone) return null;
            
            const now = new Date();
            const eventTimeZone = event.timeZone;
            
            // Check if ticket sales haven't started yet
            if (ticket.startDate) {
              const startDate = new Date(ticket.startDate);
              if (now < startDate) {
                return (
                  <div className="text-xs text-amber-600 mt-2 font-medium">
                    📅 Available from {formatInTimeZone(
                      ticket.startDate, 
                      eventTimeZone, 
                      'MMM d, yyyy'
                    )}
                    {ticket.expiryDate && (
                      <span> • Until {formatInTimeZone(
                        ticket.expiryDate, 
                        eventTimeZone, 
                        'MMM d, yyyy'
                      )}</span>
                    )}
                  </div>
                );
              }
            }
            
            // Check if ticket sales have ended
            if (ticket.expiryDate) {
              const expiryDate = new Date(ticket.expiryDate);
              if (now > expiryDate) {
                return (
                  <div className="text-xs text-red-600 mt-2 font-medium">
                    ❌ Sales ended on {formatInTimeZone(
                      ticket.expiryDate, 
                      eventTimeZone, 
                      'MMM d, yyyy'
                    )}
                  </div>
                );
              }
              
              // Check if expiry is within 5 days (urgency message)
              const msPerDay = 24 * 60 * 60 * 1000;
              const daysUntilExpiry = Math.ceil((expiryDate - now) / msPerDay);
              
              if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
                return (
                  <div className="text-xs text-orange-600 mt-2 font-medium">
                    ⚡ Hurry! Only {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} left
                  </div>
                );
              }
            }
            
            // Ticket is currently available - show "On sale now"
            if (ticket.startDate || ticket.expiryDate) {
              return (
                <div className="text-xs text-green-600 mt-2 font-medium">
                  ✅ On sale now
                  {ticket.expiryDate && (
                    <span className="text-gray-500"> • Until {formatInTimeZone(
                      ticket.expiryDate, 
                      eventTimeZone, 
                      'MMM d, yyyy'
                    )}</span>
                  )}
                </div>
              );
            }
            
            // No date restrictions
            return null;
          })()}
        </div>
      ))}
    </div>
  </div>
)}

        {/* Mobile Chat */}
        {chatProps && (
          <div className="block lg:hidden mt-6 pt-6 border-t">
            <SendMessage {...chatProps} />
          </div>
        )}
      </div>

      {/* Registration/Purchase Button */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Handle Free vs Paid Events */}
          {event.isPaid ? (
            // PAID EVENT: Show Purchase Tickets button (now navigates to page instead of modal)
            <button
              onClick={handlePurchaseTickets}
              className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <FaShoppingCart className="mr-2" />
              Purchase Tickets
            </button>
          ) : (
            // FREE EVENT: Show Register/Unregister logic
            isRegistered ? (
              <button
                onClick={() => dispatch(unregisterFromFreeEvent(event._id))}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                disabled={registrationStatus === 'loading'}
              >
                {registrationStatus === 'loading' ? 'Unregistering...' : 'Unregister from Event'}
              </button>
            ) : (
<button
  onClick={() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowRegistrationForm(true);
  }}
  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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

        {event.isPaid && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            Secure payment processing.
          </p>
        )}
      </div>

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