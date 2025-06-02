'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Actions
import {
  fetchRefundHistory,
  fetchRefundableTickets,
  setSelectedTicket,
  openRefundModal,
  clearError,
  clearSuccessMessage,
  updateFilters,
  clearFilters,
  setSearchTerm,
  setCurrentPage
} from '@/store/slices/events/refundSlice';

// Components (we'll create these next)
import RefundModal from './RefundModal';
import RefundHistory from './RefundHistory';
import RefundableTickets from './RefundableTickets';
import LoadingSpinner from '@/components/LoadingSpinner';

const RefundManagement = ({ event, onEventChange }) => {
  const dispatch = useDispatch();

  // Redux State
  const {
    loading,
    processing,
    error,
    successMessage,
    refundHistory,
    refundableTickets,
    refundSummary,
    selectedTicket,
    refundModal,
    filters,
    lastUpdated
  } = useSelector((state) => state.refunds);

  // Local State
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'history'
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Initialize data when event changes
  useEffect(() => {
    if (event?._id) {
      console.log('🔄 Loading refund data for event:', event.title);
      dispatch(fetchRefundableTickets(event._id));
      dispatch(fetchRefundHistory(event._id));
    }
  }, [dispatch, event?._id]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (event?._id) {
      const interval = setInterval(() => {
        dispatch(fetchRefundableTickets(event._id));
        dispatch(fetchRefundHistory(event._id));
      }, 30000);

      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [dispatch, event?._id]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (event?._id) {
      dispatch(fetchRefundableTickets(event._id));
      dispatch(fetchRefundHistory(event._id));
    }
  };

  // Handle ticket selection for refund
  const handleRefundTicket = (ticket) => {
    dispatch(setSelectedTicket(ticket));
    dispatch(openRefundModal({ mode: 'refund', ticketData: ticket }));
  };

  // Handle ticket deletion
  const handleDeleteTicket = (ticket) => {
    dispatch(setSelectedTicket(ticket));
    dispatch(openRefundModal({ mode: 'delete', ticketData: ticket }));
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    dispatch(setSearchTerm(searchTerm));
  };

  // Handle filter changes
  const handleFilterChange = (filterUpdates) => {
    dispatch(updateFilters(filterUpdates));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Calculate summary statistics
  const summaryStats = {
    totalTickets: refundableTickets.length,
    totalRefunds: refundHistory.length,
    totalRefundAmount: refundSummary?.totalRefunded || '0.00',
    lastRefundDate: refundHistory[0]?.refundProcessedDate || null
  };

  if (!event) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-500">Select an event to manage refunds</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(clearError())}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Event Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(event.dateTime).toLocaleString()}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.venue}
              </div>
              {lastUpdated && (
                <div className="flex items-center text-xs text-gray-400">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg 
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5zM16 5a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1V7a2 2 0 012-2h-1zM16 14a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a2 2 0 012-2h-1z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Refunds</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalRefunds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Refund Amount</p>
              <p className="text-2xl font-semibold text-gray-900">${summaryStats.totalRefundAmount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Refund</p>
              <p className="text-sm font-semibold text-gray-900">
                {summaryStats.lastRefundDate 
                  ? new Date(summaryStats.lastRefundDate).toLocaleDateString()
                  : 'No refunds yet'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5zM16 5a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1V7a2 2 0 012-2h-1zM16 14a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a2 2 0 012-2h-1z" />
                </svg>
                Refundable Tickets ({summaryStats.totalTickets})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v1a2 2 0 002 2h2V5zM9 5a2 2 0 012 2v5H9V5zM11 12v8a2 2 0 11-4 0v-8h4zM16 5h2a2 2 0 012 2v1a2 2 0 01-2 2h-2V5zM16 5a2 2 0 00-2 2v5h2V5zM14 12v8a2 2 0 104 0v-8h-4z" />
                </svg>
                Refund History ({summaryStats.totalRefunds})
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" />
              <span className="ml-3 text-gray-600">Loading data...</span>
            </div>
          )}

          {!loading && activeTab === 'tickets' && (
            <RefundableTickets 
              tickets={refundableTickets}
              onRefundTicket={handleRefundTicket}
              onDeleteTicket={handleDeleteTicket}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              filters={filters}
            />
          )}

          {!loading && activeTab === 'history' && (
            <RefundHistory 
              refunds={refundHistory}
              summary={refundSummary}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              filters={filters}
            />
          )}
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal 
        isOpen={refundModal.isOpen}
        mode={refundModal.mode}
        ticket={refundModal.ticketData}
        event={event}
        onClose={() => dispatch(closeRefundModal())}
      />

    </div>
  );
};

export default RefundManagement;