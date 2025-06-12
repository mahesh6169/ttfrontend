// Fixed page.jsx - Removed problematic isLoading selector causing infinite renders

'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOrganizerEvents,
  fetchRefundableTickets,
  setSelectedEvent,
  setActiveTab,
  selectEvents,
  selectSelectedEvent,
  selectTicketsState,
  selectUI
  // ❌ REMOVED: selectIsLoading - This was causing infinite renders
} from '@/store/slices/events/refundSlice';

// Components (imports stay the same)
import EventSelector from '@/components/events/refunds/EventSelector';
import TicketSearchBar from '@/components/events/refunds/TicketSearchBar';
import RefundableTicketsList from '@/components/events/refunds/RefundableTicketsList';
import RefundSummary from '@/components/events/refunds/RefundSummary';
import RefundModal from '@/components/events/refunds/RefundModal';
import LoadingSpinner from '@/components/events/refunds/LoadingSpinner';

export default function RefundsPage() {
  const dispatch = useDispatch();
  const events = useSelector(selectEvents);
  const selectedEvent = useSelector(selectSelectedEvent);
  const ticketsState = useSelector(selectTicketsState);
  const ui = useSelector(selectUI);
  
  // ✅ FIXED: Calculate loading state locally instead of using problematic selector
  const isLoading = events.loading || ticketsState.loading;

  const [searchTerm, setSearchTerm] = useState('');
  
  // Add refs to prevent infinite loops
  const lastFetchedEventId = useRef(null);
  const lastFetchedTab = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Fetch organizer's events on component mount
    if (isInitialMount.current) {
      console.log('🚀 INITIAL MOUNT: Fetching organizer events');
      dispatch(fetchOrganizerEvents());
      isInitialMount.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    console.log('🎯 Effect triggered', {
      selectedEventId: selectedEvent?._id,
      activeTab: ui.activeTab,
      lastFetchedEventId: lastFetchedEventId.current,
      lastFetchedTab: lastFetchedTab.current
    });

    // Only fetch tickets when event actually changes or tab changes
    if (selectedEvent && selectedEvent._id) {
      const eventId = selectedEvent._id;
      const currentTab = ui.activeTab;
      
      // Check if we need to fetch (different event or different tab)
      const shouldFetch = (
        lastFetchedEventId.current !== eventId || 
        lastFetchedTab.current !== currentTab
      );
      
      if (shouldFetch) {
        console.log('✅ FETCHING TICKETS:', { eventId, tab: currentTab });
        
        dispatch(fetchRefundableTickets({ 
          eventId: eventId,
          page: 1,
          limit: 20
        }));
        
        // Update refs to prevent re-fetching
        lastFetchedEventId.current = eventId;
        lastFetchedTab.current = currentTab;
      } else {
        console.log('⏭️ SKIPPING FETCH - Already fetched for this event/tab combo');
      }
    }
  }, [selectedEvent?._id, ui.activeTab, dispatch]);

  const handleEventSelect = (event) => {
    console.log('🎯 EVENT SELECTED:', event.title, event._id);
    dispatch(setSelectedEvent(event));
    setSearchTerm(''); // Clear search when switching events
    
    // Reset fetch tracking when event changes
    lastFetchedEventId.current = null;
    lastFetchedTab.current = null;
  };

  const handleSearch = (term) => {
    console.log('🔍 SEARCH TERM CHANGED:', term);
    setSearchTerm(term);
    // Search functionality will be handled in TicketSearchBar component
  };

  const handleTabChange = (tab) => {
    console.log('🔄 TAB CHANGED TO:', tab);
    dispatch(setActiveTab(tab));
    
    // Reset fetch tracking when tab changes to ensure fresh data
    lastFetchedTab.current = null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
            <p className="mt-2 text-gray-600">Process refunds for your event tickets</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Selection */}
        <div className="mb-8">
          <EventSelector 
            events={events.list}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
            loading={events.loading}
            error={events.error}
          />
        </div>

        {selectedEvent && (
          <>
            {/* Event Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span> {new Date(selectedEvent.dateTime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Venue:</span> {selectedEvent.venue}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Category:</span> {selectedEvent.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid Event
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                      <button
                        onClick={() => handleTabChange('individual')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                          ui.activeTab === 'individual'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Individual Refunds
                      </button>
                      <button
                        onClick={() => handleTabChange('group')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                          ui.activeTab === 'group'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Group Refunds
                      </button>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {/* Search Bar */}
                    <div className="mb-6">
                      <TicketSearchBar 
                        searchTerm={searchTerm}
                        onSearch={handleSearch}
                        activeTab={ui.activeTab}
                        eventId={selectedEvent._id}
                      />
                    </div>

                    {/* Loading State - ✅ Fixed: Use local loading calculation */}
                    {isLoading && (
                      <div className="flex justify-center items-center py-12">
                        <LoadingSpinner />
                        <span className="ml-3 text-gray-600">Loading refundable tickets...</span>
                      </div>
                    )}

                    {/* Tickets List - ✅ Fixed: Use local loading calculation */}
                    {!isLoading && (
                      <RefundableTicketsList 
                        activeTab={ui.activeTab}
                        loading={ticketsState.loading}
                        error={ticketsState.error}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <RefundSummary 
                    activeTab={ui.activeTab}
                    eventId={selectedEvent._id}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Event Selected State */}
        {!selectedEvent && !events.loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Select an Event</h3>
            <p className="mt-2 text-gray-500">Choose an event from the dropdown above to view refundable tickets.</p>
          </div>
        )}

        {/* No Events State */}
        {!events.loading && events.list.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Paid Events Found</h3>
            <p className="mt-2 text-gray-500">You don't have any paid events that support refunds yet.</p>
            <div className="mt-6">
              <a 
                href="/organizer/events/create" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Paid Event
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {ui.showRefundModal && (
        <RefundModal />
      )}
    </div>
  );
}