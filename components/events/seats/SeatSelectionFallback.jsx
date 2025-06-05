// components/events/seats/SeatSelectionFallback.jsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const SeatSelectionFallback = ({ event, ticketSelection, error, eventId }) => {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  // ✅ ENHANCED: Better error categorization
  const getErrorType = () => {
    if (!error) return 'unknown';
    
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('seating layout') || errorLower.includes('no seating')) {
      return 'no_layout';
    }
    if (errorLower.includes('not paid') || errorLower.includes('seat selection')) {
      return 'not_paid_event';
    }
    if (errorLower.includes('network') || errorLower.includes('fetch')) {
      return 'network';
    }
    if (errorLower.includes('unauthorized') || errorLower.includes('permission')) {
      return 'permission';
    }
    if (errorLower.includes('event not found')) {
      return 'event_not_found';
    }
    
    return 'generic';
  };

  // ✅ ENHANCED: Error-specific messaging
  const getErrorInfo = (errorType) => {
    switch (errorType) {
      case 'no_layout':
        return {
          title: 'Seating Layout Not Configured',
          message: 'This event doesn\'t have a seating layout set up yet. You can still purchase tickets without selecting specific seats.',
          icon: '🪑',
          canProceed: true,
          showContactOrganizer: true
        };
      case 'not_paid_event':
        return {
          title: 'Open Seating Event',
          message: 'This is a general admission event without assigned seating. You can proceed directly to checkout.',
          icon: '🎫',
          canProceed: true,
          showContactOrganizer: false
        };
      case 'network':
        return {
          title: 'Connection Problem',
          message: 'We\'re having trouble connecting to load the seating information. Please check your internet connection and try again.',
          icon: '📡',
          canProceed: false,
          showContactOrganizer: false
        };
      case 'permission':
        return {
          title: 'Access Restricted',
          message: 'You don\'t have permission to view the seating layout for this event. Please ensure you\'re logged in or contact the organizer.',
          icon: '🔒',
          canProceed: false,
          showContactOrganizer: true
        };
      case 'event_not_found':
        return {
          title: 'Event Not Found',
          message: 'The event you\'re looking for doesn\'t exist or has been removed.',
          icon: '🔍',
          canProceed: false,
          showContactOrganizer: false
        };
      default:
        return {
          title: 'Seat Selection Unavailable',
          message: 'We\'re having trouble loading the seat selection for this event. This might be temporary.',
          icon: '⚠️',
          canProceed: true,
          showContactOrganizer: true
        };
    }
  };

  const handleBackToEvent = () => {
    router.push(`/events/views/${eventId}`);
  };

  const handleProceedWithoutSeats = () => {
    // Navigate directly to checkout
    router.push(`/checkout/events/${eventId}`);
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Wait a moment then reload the page
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (error) {
      console.error('Retry failed:', error);
      setIsRetrying(false);
    }
  };

  const handleContactOrganizer = () => {
    // Could implement a contact modal or redirect to contact page
    if (event.coordinators && event.coordinators.length > 0) {
      const coordinator = event.coordinators[0];
      if (coordinator.email) {
        window.location.href = `mailto:${coordinator.email}?subject=Question about ${event.title}`;
      }
    }
  };

  const errorType = getErrorType();
  const errorInfo = getErrorInfo(errorType);

  // ✅ ENHANCED: Better ticket selection summary
  const getTicketSummary = () => {
    const totalTickets = Object.values(ticketSelection.tickets).reduce((sum, qty) => sum + qty, 0);
    const ticketTypes = Object.entries(ticketSelection.tickets)
      .filter(([_, qty]) => qty > 0)
      .map(([typeId, qty]) => {
        const type = event.ticketTypes?.find(t => t._id === typeId);
        return `${qty} × ${type?.name || 'Unknown'}`;
      });

    return {
      totalTickets,
      ticketTypes,
      totalAmount: ticketSelection.totals?.total || 0
    };
  };

  const ticketSummary = getTicketSummary();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          {/* ✅ ENHANCED: Dynamic error icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            {errorInfo.icon}
          </div>

          {/* ✅ ENHANCED: Error message */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {errorInfo.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {errorInfo.message}
          </p>

          {/* ✅ ENHANCED: Technical error details (collapsible) */}
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                {error}
              </div>
            </details>
          )}

          {/* ✅ ENHANCED: Event info card */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center">
                <span className="w-4">📍</span>
                <span className="ml-2">{event.venue}</span>
              </div>
              
              {event.dateTime && (
                <div className="flex items-center">
                  <span className="w-4">📅</span>
                  <span className="ml-2">
                    {new Date(event.dateTime).toLocaleDateString()} at{' '}
                    {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center">
                <span className="w-4">🎫</span>
                <span className="ml-2">
                  {ticketSummary.totalTickets} ticket{ticketSummary.totalTickets !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              {ticketSummary.ticketTypes.length > 0 && (
                <div className="flex items-start">
                  <span className="w-4">💰</span>
                  <div className="ml-2">
                    <div>{ticketSummary.ticketTypes.join(', ')}</div>
                    <div className="font-medium text-gray-900">
                      Total: ${ticketSummary.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ✅ ENHANCED: Action buttons with better logic */}
          <div className="space-y-3">
            {/* Primary action - proceed if possible */}
            {errorInfo.canProceed && (
              <button
                onClick={handleProceedWithoutSeats}
                className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                {errorType === 'not_paid_event' 
                  ? 'Continue to Checkout' 
                  : 'Proceed Without Seat Selection'
                }
              </button>
            )}

            {/* Retry button for network issues */}
            {errorType === 'network' && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </button>
            )}

            {/* Contact organizer button */}
            {errorInfo.showContactOrganizer && event.coordinators && event.coordinators.length > 0 && (
              <button
                onClick={handleContactOrganizer}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Contact Event Organizer
              </button>
            )}
            
            {/* Back to event button */}
            <button
              onClick={handleBackToEvent}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Event Details
            </button>
          </div>

          {/* ✅ ENHANCED: Contextual help text */}
          <div className="mt-6 text-xs text-gray-500 space-y-1">
            {errorType === 'no_layout' && (
              <>
                <p>💡 The event organizer may still be setting up seating arrangements.</p>
                <p>You can purchase tickets now and seat assignments may be provided later.</p>
              </>
            )}
            
            {errorType === 'not_paid_event' && (
              <p>💡 This event uses general admission - no specific seats needed!</p>
            )}
            
            {errorType === 'network' && (
              <p>💡 Check your internet connection and try refreshing the page.</p>
            )}
            
            {errorType === 'permission' && (
              <p>💡 Make sure you're logged in with the correct account.</p>
            )}
            
            {errorType === 'event_not_found' && (
              <p>💡 The event may have been moved, cancelled, or the link may be incorrect.</p>
            )}

            {errorType === 'generic' && (
              <>
                <p>💡 This is usually a temporary issue.</p>
                <p>If the problem persists, try refreshing the page or contact support.</p>
              </>
            )}
          </div>

          {/* ✅ NEW: Support contact info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact support at{' '}
              <a 
                href="mailto:support@example.com" 
                className="text-teal-600 hover:text-teal-700 underline"
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>

        {/* ✅ NEW: Quick actions outside the main card */}
        <div className="mt-4 flex justify-center space-x-4 text-sm">
          <button
            onClick={() => window.location.reload()}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => router.push('/events')}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            Browse Events
          </button>
          
          {ticketSummary.totalTickets > 0 && (
            <button
              onClick={() => router.push('/account/tickets')}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              My Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionFallback;