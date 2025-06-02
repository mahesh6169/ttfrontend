'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Redux Actions
import { fetchMyEvents } from '@/store/slices/events/eventSlice';
import { 
  setSelectedEvent, 
  resetForNewEvent,
  clearMessages,
  setAutoRefresh 
} from '@/store/slices/events/refundSlice';

// Components (we'll create these next)
import RefundManagement from '@/components/events/refunds/RefundManagement';
import LoadingSpinner from '@/components/LoadingSpinner';

const RefundsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  
  // Redux State
  const { user } = useSelector((state) => state.user);
  const { myEvents, status: eventsStatus, error: eventsError } = useSelector((state) => state.events);
  const { selectedEvent, error: refundError, successMessage } = useSelector((state) => state.refunds);
  
  // Local State
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize component
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch user's events on component mount
    if (eventsStatus === 'idle') {
      dispatch(fetchMyEvents());
    }

    // Clear any existing messages
    dispatch(clearMessages());
    
    // Enable auto-refresh for real-time updates
    dispatch(setAutoRefresh(true));
    
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      dispatch(setAutoRefresh(false));
      dispatch(clearMessages());
    };
  }, [dispatch, user, router, eventsStatus]);

  // Handle event selection
  const handleEventSelection = (eventId) => {
    if (!eventId) {
      setSelectedEventId('');
      dispatch(setSelectedEvent(null));
      dispatch(resetForNewEvent());
      return;
    }

    const event = myEvents.find(e => e._id === eventId);
    if (event) {
      setSelectedEventId(eventId);
      dispatch(setSelectedEvent(event));
      dispatch(resetForNewEvent());
      dispatch(clearMessages());
    }
  };

  // Filter events to only show paid events (refunds only apply to paid events)
  const paidEvents = myEvents.filter(event => event.isPaid);

  // Loading states
  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (eventsStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="large" />
              <span className="ml-3 text-lg text-gray-600">Loading your events...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link 
                  href="/users/profile" 
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Profile
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Refund Management</span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
              <p className="mt-2 text-gray-600">
                Process refunds and manage ticket cancellations for your paid events
              </p>
            </div>
            
            {/* Quick Stats */}
            {paidEvents.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 min-w-[200px]">
                <div className="text-sm text-gray-500">Your Paid Events</div>
                <div className="text-2xl font-bold text-blue-600">{paidEvents.length}</div>
              </div>
            )}
          </div>
        </div>

        {/* Error Handling */}
        {eventsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading events</h3>
                <p className="mt-1 text-sm text-red-700">{eventsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {paidEvents.length === 0 ? (
          /* No Paid Events State */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Paid Events Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You don't have any paid events yet. Refund management is only available for paid events with ticket sales.
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/events/add"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Paid Event
              </Link>
              
              <div className="text-sm text-gray-500">
                or{' '}
                <Link 
                  href="/users/profile/manageevents" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  view your existing events
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Event Selection & Refund Management */
          <div className="space-y-6">
            
            {/* Event Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Choose an event to manage refunds
                  </label>
                  <select
                    id="event-select"
                    value={selectedEventId}
                    onChange={(e) => handleEventSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  >
                    <option value="">Select an event...</option>
                    {paidEvents.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.title} - {new Date(event.dateTime).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEvent && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">{selectedEvent.title}</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>📅 {new Date(selectedEvent.dateTime).toLocaleString()}</div>
                      <div>📍 {selectedEvent.venue}</div>
                      <div>🎫 {selectedEvent.ticketTypes?.length || 0} ticket types</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Refund Management Component */}
            {selectedEvent && (
              <RefundManagement 
                event={selectedEvent}
                onEventChange={handleEventSelection}
              />
            )}
            
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Processing Refunds</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Full refunds automatically release seats and restore inventory</li>
                <li>• Partial refunds keep the ticket active</li>
                <li>• Refunds are processed immediately via Stripe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Deleting Tickets</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Only use for administrative cancellations</li>
                <li>• Requires full refund to be processed first</li>
                <li>• Permanently removes ticket from system</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <Link 
              href="/support/contact" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Contact Support →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RefundsPage;