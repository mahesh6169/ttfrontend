'use client';

import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Actions
import {
  setSearchTerm,
  updateFilters,
  clearFilters,
  setCurrentPage,
  setSelectedTicket
} from '@/store/slices/events/refundSlice';

// Components
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

const RefundableTickets = ({ 
  tickets, 
  onRefundTicket, 
  onDeleteTicket, 
  onSearch, 
  onFilterChange, 
  onClearFilters, 
  filters 
}) => {
  const dispatch = useDispatch();
  
  // Redux State
  const { loading, pagination, selectedTicket } = useSelector((state) => state.refunds);
  
  // Local State
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedTickets, setSelectedTickets] = useState(new Set());

  // Handle search input
  const handleSearchChange = (value) => {
    setSearchInput(value);
    // Debounced search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      dispatch(setSearchTerm(value));
      onSearch?.(value);
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    const newFilters = { [field]: value };
    dispatch(updateFilters(newFilters));
    onFilterChange?.(newFilters);
  };

  // Handle sorting
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    dispatch(clearFilters());
    onClearFilters?.();
  };

  // Handle ticket selection
  const handleTicketSelect = (ticketNumber) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketNumber)) {
      newSelected.delete(ticketNumber);
    } else {
      newSelected.add(ticketNumber);
    }
    setSelectedTickets(newSelected);
  };

  // Select all tickets
  const handleSelectAll = () => {
    if (selectedTickets.size === processedTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(processedTickets.map(t => t.ticketNumber)));
    }
  };

  // Filtered and sorted tickets
  const processedTickets = useMemo(() => {
    let filtered = [...tickets];

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticketNumber?.toLowerCase().includes(searchTerm) ||
        ticket.email?.toLowerCase().includes(searchTerm) ||
        ticket.attendees?.[0]?.name?.toLowerCase().includes(searchTerm) ||
        ticket.ticketType?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply ticket type filter
    if (filters.ticketType && filters.ticketType !== 'all') {
      filtered = filtered.filter(ticket => ticket.ticketType?.name === filters.ticketType);
    }

    // Apply refund status filter
    if (filters.refundStatus && filters.refundStatus !== 'all') {
      filtered = filtered.filter(ticket => {
        const status = ticket.refundStatus || 'none';
        return status === filters.refundStatus;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'customerName') {
        aValue = a.attendees?.[0]?.name || a.email;
        bValue = b.attendees?.[0]?.name || b.email;
      } else if (sortConfig.key === 'ticketTypeName') {
        aValue = a.ticketType?.name;
        bValue = b.ticketType?.name;
      } else if (sortConfig.key === 'totalPrice') {
        aValue = a.priceDetails?.totalPrice || 0;
        bValue = b.priceDetails?.totalPrice || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tickets, filters, sortConfig]);

  // Get unique ticket types for filter
  const ticketTypes = [...new Set(tickets.map(t => t.ticketType?.name).filter(Boolean))];

  // Pagination
  const itemsPerPage = pagination.itemsPerPage;
  const currentPage = pagination.currentPage;
  const totalItems = processedTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = processedTickets.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Calculate refundable amount
  const getRefundableAmount = (ticket) => {
    const totalPrice = ticket.priceDetails?.totalPrice || 0;
    const alreadyRefunded = ticket.refundedAmount || 0;
    return Math.max(0, totalPrice - alreadyRefunded);
  };

  // Get ticket status badge
  const getTicketStatusBadge = (ticket) => {
    const refundableAmount = getRefundableAmount(ticket);
    
    if (ticket.refundStatus === 'completed' || refundableAmount === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Refunded
        </span>
      );
    } else if (ticket.refundStatus === 'partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Partial Refund
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Refundable
        </span>
      );
    }
  };

  // Bulk refund action
  const handleBulkRefund = () => {
    if (selectedTickets.size === 0) return;
    
    // For now, just process the first selected ticket
    // In a full implementation, you might want a bulk refund modal
    const firstTicket = processedTickets.find(t => selectedTickets.has(t.ticketNumber));
    if (firstTicket) {
      onRefundTicket(firstTicket);
      setSelectedTickets(new Set());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
        <span className="ml-3 text-gray-600">Loading tickets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search tickets, customers, or types..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Ticket Type Filter */}
            <select
              value={filters.ticketType || 'all'}
              onChange={(e) => handleFilterChange('ticketType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {ticketTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Refund Status Filter */}
            <select
              value={filters.refundStatus || 'all'}
              onChange={(e) => handleFilterChange('refundStatus', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="none">Never Refunded</option>
              <option value="partial">Partially Refunded</option>
              <option value="completed">Fully Refunded</option>
            </select>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Clear Filters */}
            {(filters.searchTerm || filters.ticketType !== 'all' || filters.refundStatus !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTickets.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedTickets.size} ticket{selectedTickets.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkRefund}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  Bulk Refund
                </button>
                <button
                  onClick={() => setSelectedTickets(new Set())}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} tickets
        </p>
        {totalItems > itemsPerPage && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Tickets Display */}
      {processedTickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5zM16 5a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1V7a2 2 0 012-2h-1zM16 14a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a2 2 0 012-2h-1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Found</h3>
          <p className="text-gray-600">
            {filters.searchTerm || filters.ticketType !== 'all' || filters.refundStatus !== 'all'
              ? 'No tickets match your current filters. Try adjusting your search criteria.'
              : 'No refundable tickets found for this event.'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTickets.map((ticket) => (
            <TicketCard
              key={ticket.ticketNumber}
              ticket={ticket}
              isSelected={selectedTickets.has(ticket.ticketNumber)}
              onSelect={() => handleTicketSelect(ticket.ticketNumber)}
              onRefund={() => onRefundTicket(ticket)}
              onDelete={() => onDeleteTicket(ticket)}
              formatCurrency={formatCurrency}
              getRefundableAmount={getRefundableAmount}
              getTicketStatusBadge={getTicketStatusBadge}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTickets.size === paginatedTickets.length && paginatedTickets.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ticketNumber')}
                  >
                    Ticket Number
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customerName')}
                  >
                    Customer
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ticketTypeName')}
                  >
                    Type
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalPrice')}
                  >
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.ticketNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTickets.has(ticket.ticketNumber)}
                        onChange={() => handleTicketSelect(ticket.ticketNumber)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {ticket.ticketNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.attendees?.[0]?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{ticket.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.ticketType?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(ticket.priceDetails?.totalPrice || 0)}
                      </div>
                      {ticket.refundedAmount > 0 && (
                        <div className="text-xs text-red-600">
                          -{formatCurrency(ticket.refundedAmount)} refunded
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTicketStatusBadge(ticket)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {getRefundableAmount(ticket) > 0 && (
                        <button
                          onClick={() => onRefundTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Refund
                        </button>
                      )}
                      {ticket.refundStatus === 'completed' && (
                        <button
                          onClick={() => onDeleteTicket(ticket)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

    </div>
  );
};

// Ticket Card Component for Grid View
const TicketCard = ({ 
  ticket, 
  isSelected, 
  onSelect, 
  onRefund, 
  onDelete, 
  formatCurrency, 
  getRefundableAmount, 
  getTicketStatusBadge 
}) => {
  const refundableAmount = getRefundableAmount(ticket);
  const hasSeats = ticket.seats && ticket.seats.length > 0;

  return (
    <div className={`bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
      isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
    }`}>
      
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-mono text-sm font-semibold text-gray-900">
                {ticket.ticketNumber}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {getTicketStatusBadge(ticket)}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        
        {/* Customer Info */}
        <div>
          <div className="text-sm font-medium text-gray-900">
            {ticket.attendees?.[0]?.name || 'No Name'}
          </div>
          <div className="text-sm text-gray-500">{ticket.email}</div>
        </div>

        {/* Ticket Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type:</span>
            <span className="font-medium">{ticket.ticketType?.name}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">{formatCurrency(ticket.priceDetails?.totalPrice || 0)}</span>
          </div>

          {ticket.refundedAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Refunded:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(ticket.refundedAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Refundable:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(refundableAmount)}
            </span>
          </div>

          {hasSeats && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seats:</span>
              <span className="font-medium">
                {ticket.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex space-x-2">
          {refundableAmount > 0 && (
            <button
              onClick={onRefund}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Process Refund
            </button>
          )}
          
          {ticket.refundStatus === 'completed' && (
            <button
              onClick={onDelete}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Delete Ticket
            </button>
          )}

          {refundableAmount === 0 && ticket.refundStatus !== 'completed' && (
            <div className="flex-1 px-3 py-2 text-sm text-center text-gray-500 bg-gray-100 rounded-md">
              No Actions Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundableTickets;