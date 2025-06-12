'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleTicketSelection,
  selectInvoiceGroup,
  deselectInvoiceGroup,
  setCurrentPage,
  fetchRefundableTickets,
  selectSelectedTickets,
  selectSearch,
  // Use the new memoized selectors from the refactored slice
  selectCurrentTicketsByInvoice,
  selectCurrentTickets,
  selectCurrentStatistics,
  selectSelectedEvent,
  selectTicketsState, // Add this for accessing tickets state
  selectSearchTerm    // Add this for accessing search term
} from '@/store/slices/events/refundSlice';
import { 
  IoChevronBack, 
  IoChevronForward, 
  IoCash,
  IoTicket,
  IoPerson,
  IoCalendarOutline,
  IoCheckmarkCircle,
  IoInformationCircleOutline
} from 'react-icons/io5';

// Individual components
import RefundTicketCard from './RefundTicketCard';
import InvoiceGroupCard from './InvoiceGroupCard';
import LoadingSpinner from './LoadingSpinner';

export default function RefundableTicketsList({ 
  activeTab, 
  loading, 
  error 
}) {
  const dispatch = useDispatch();
  
  // Use the new memoized selectors
  const selectedTickets = useSelector(selectSelectedTickets);
  const search = useSelector(selectSearch);
  const ticketsByInvoice = useSelector(selectCurrentTicketsByInvoice);
  const displayTickets = useSelector(selectCurrentTickets);
  const statistics = useSelector(selectCurrentStatistics);
  const selectedEvent = useSelector(selectSelectedEvent);
  const ticketsState = useSelector(selectTicketsState);
  const searchTerm = useSelector(selectSearchTerm);

  // Extract pagination info from ticketsState
  const { currentPage, totalPages, total } = ticketsState;

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      dispatch(setCurrentPage(newPage));
      // Only fetch if not showing search results
      if (!searchTerm || search.results.length === 0) {
        dispatch(fetchRefundableTickets({ 
          eventId: selectedEvent?.id || displayTickets[0]?.event,
          page: newPage,
          limit: 20
        }));
      }
    }
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  const sortTickets = (ticketsToSort) => {
    return [...ticketsToSort].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'ticketNumber':
          aValue = a.ticketNumber;
          bValue = b.ticketNumber;
          break;
        case 'buyerName':
          aValue = `${a.buyer?.firstName || ''} ${a.buyer?.lastName || ''}`;
          bValue = `${b.buyer?.firstName || ''} ${b.buyer?.lastName || ''}`;
          break;
        case 'amount':
          aValue = a.priceDetails?.totalPrice || 0;
          bValue = b.priceDetails?.totalPrice || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Enhanced statistics for the new refund types
  const getRefundTypeInfo = () => {
    if (activeTab === 'individual') {
      return {
        title: 'Individual Refunds (Partial Transactions)',
        description: 'Each ticket creates a partial refund against the original payment',
        icon: <IoTicket className="h-5 w-5" />,
        color: 'blue'
      };
    } else {
      return {
        title: 'Group Refunds (Full Transactions)',
        description: 'Refunds entire invoice with one transaction (all tickets together)',
        icon: <IoCash className="h-5 w-5" />,
        color: 'purple'
      };
    }
  };

  // Loading state
  if (loading && displayTickets.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
        <span className="ml-3 text-gray-600">Loading refundable tickets...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading tickets</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No tickets state
  if (displayTickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 text-gray-400">
          <IoTicket className="h-full w-full" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {searchTerm ? 'No tickets found' : 'No refundable tickets'}
        </h3>
        <p className="mt-2 text-gray-500">
          {searchTerm 
            ? `No tickets match your search for "${searchTerm}"`
            : 'There are no tickets available for refund at this time.'
          }
        </p>
      </div>
    );
  }

  const sortedTickets = sortTickets(displayTickets);
  const refundTypeInfo = getRefundTypeInfo();

  return (
    <div className="space-y-6">
      {/* Refund Type Information Banner */}
      <div className={`bg-${refundTypeInfo.color}-50 border border-${refundTypeInfo.color}-200 rounded-lg p-4`}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 text-${refundTypeInfo.color}-600 mr-3`}>
            {refundTypeInfo.icon}
          </div>
          <div>
            <h3 className={`text-sm font-medium text-${refundTypeInfo.color}-900`}>
              {refundTypeInfo.title}
            </h3>
            <p className={`text-sm text-${refundTypeInfo.color}-700 mt-1`}>
              {refundTypeInfo.description}
            </p>
            {activeTab === 'group' && (
              <p className={`text-xs text-${refundTypeInfo.color}-600 mt-2`}>
                ⚠️ Group refunds will be blocked if any tickets in an invoice have individual refunds
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats - Now using memoized statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{statistics.totalCount}</div>
            <div className="text-sm text-gray-600">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${statistics.totalValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {activeTab === 'individual' ? selectedTickets.individual.length : Object.keys(selectedTickets.grouped).length}
            </div>
            <div className="text-sm text-gray-600">Selected {activeTab === 'individual' ? 'Tickets' : 'Groups'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.uniqueInvoices}
            </div>
            <div className="text-sm text-gray-600">Unique Invoices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.uniquePaymentIntents}
            </div>
            <div className="text-sm text-gray-600">Payment Intents</div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Purchase Date</option>
            <option value="ticketNumber">Ticket Number</option>
            <option value="buyerName">Buyer Name</option>
            <option value="amount">Amount</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {searchTerm ? (
            <span>Showing search results</span>
          ) : (
            <span>
              Showing {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, total)} of {total}
            </span>
          )}
        </div>
      </div>

      {/* Tickets Display */}
      {activeTab === 'individual' ? (
        // Individual Tickets View
        <div className="space-y-4">
          {sortedTickets.map((ticket) => (
            <RefundTicketCard
              key={ticket.ticketNumber}
              ticket={ticket}
              isSelected={selectedTickets.individual.some(t => t.ticketNumber === ticket.ticketNumber)}
              onToggleSelect={() => dispatch(toggleTicketSelection(ticket))}
            />
          ))}
        </div>
      ) : (
        // Group by Invoice View
        <div className="space-y-4">
          {Object.entries(ticketsByInvoice).map(([invoiceNumber, invoiceTickets]) => (
            <InvoiceGroupCard
              key={invoiceNumber}
              invoiceNumber={invoiceNumber}
              tickets={invoiceTickets}
              isSelected={!!selectedTickets.grouped[invoiceNumber]}
              selectedEvent={selectedEvent}
              onToggleSelect={() => {
                if (selectedTickets.grouped[invoiceNumber]) {
                  dispatch(deselectInvoiceGroup(invoiceNumber));
                } else {
                  dispatch(selectInvoiceGroup({ invoiceNumber, tickets: invoiceTickets }));
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!searchTerm && totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoChevronBack className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoChevronForward className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}