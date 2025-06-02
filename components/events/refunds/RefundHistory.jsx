'use client';

import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Redux Actions
import {
  setSearchTerm,
  updateFilters,
  clearFilters,
  setCurrentPage
} from '@/store/slices/events/refundSlice';

// Components
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

const RefundHistory = ({ 
  refunds, 
  summary, 
  onSearch, 
  onFilterChange, 
  onClearFilters, 
  filters 
}) => {
  const dispatch = useDispatch();
  
  // Redux State
  const { loading, pagination } = useSelector((state) => state.refunds);
  
  // Local State
  const [searchInput, setSearchInput] = useState(filters.searchTerm || '');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'refundProcessedDate', direction: 'desc' });

  // Handle search input
  const handleSearchChange = (value) => {
    setSearchInput(value);
    // Debounced search - trigger after user stops typing
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

  // Filtered and sorted refunds
  const processedRefunds = useMemo(() => {
    let filtered = [...refunds];

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(refund => 
        refund.ticketNumber?.toLowerCase().includes(searchTerm) ||
        refund.user?.name?.toLowerCase().includes(searchTerm) ||
        refund.user?.email?.toLowerCase().includes(searchTerm) ||
        refund.refundReason?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(refund => refund.refundStatus === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(refund => {
        const refundDate = new Date(refund.refundProcessedDate);
        return refundDate >= new Date(start) && refundDate <= new Date(end);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [refunds, filters, sortConfig]);

  // Pagination
  const itemsPerPage = pagination.itemsPerPage;
  const currentPage = pagination.currentPage;
  const totalItems = processedRefunds.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRefunds = processedRefunds.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Completed'
      },
      partial: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Partial'
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Failed'
      }
    };

    const config = statusConfig[status] || statusConfig.completed;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  // Export to CSV
  const handleExport = () => {
    const csvHeaders = [
      'Ticket Number',
      'Customer Name',
      'Customer Email',
      'Refund Amount',
      'Status',
      'Reason',
      'Processed Date',
      'Stripe Refund ID'
    ];

    const csvData = processedRefunds.map(refund => [
      refund.ticketNumber,
      refund.user?.name || 'N/A',
      refund.user?.email || 'N/A',
      refund.refundedAmount,
      refund.refundStatus,
      refund.refundReason || 'N/A',
      new Date(refund.refundProcessedDate).toLocaleString(),
      refund.stripeRefundId || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `refund-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
        <span className="ml-3 text-gray-600">Loading refund history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Summary Stats */}
      {summary && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Refund Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.refundCount}</div>
              <div className="text-sm text-blue-700">Total Refunds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRefunded)}</div>
              <div className="text-sm text-blue-700">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.refundCount > 0 ? formatCurrency(summary.totalRefunded / summary.refundCount) : '$0.00'}
              </div>
              <div className="text-sm text-blue-700">Average Refund</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          
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
                placeholder="Search by ticket, customer, or reason..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex space-x-3">
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={processedRefunds.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>

            {/* Clear Filters */}
            {(filters.searchTerm || filters.status !== 'all') && (
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
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} refunds
        </p>
        {totalItems > itemsPerPage && (
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Refunds Table */}
      {processedRefunds.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v1a2 2 0 002 2h2V5zM9 5a2 2 0 012 2v5H9V5zM11 12v8a2 2 0 11-4 0v-8h4zM16 5h2a2 2 0 012 2v1a2 2 0 01-2 2h-2V5zM16 5a2 2 0 00-2 2v5h2V5zM14 12v8a2 2 0 104 0v-8h-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Refunds Found</h3>
          <p className="text-gray-600">
            {filters.searchTerm || filters.status !== 'all' 
              ? 'No refunds match your current filters. Try adjusting your search criteria.'
              : 'No refunds have been processed for this event yet.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('ticketNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Ticket Number</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('user.name')}
                  >
                    Customer
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('refundedAmount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Amount</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('refundProcessedDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRefunds.map((refund, index) => (
                  <tr key={refund._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {refund.ticketNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{refund.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{refund.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(refund.refundedAmount || 0)}
                      </div>
                      {refund.refundStatus === 'partial' && (
                        <div className="text-xs text-gray-500">
                          of {formatCurrency(refund.priceDetails?.totalPrice || 0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(refund.refundStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {refund.refundReason || 'No reason provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(refund.refundProcessedDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(refund.refundProcessedDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
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

      {/* Refund Details Modal */}
      {selectedRefund && (
        <RefundDetailsModal 
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
        />
      )}

    </div>
  );
};

// Refund Details Modal Component
const RefundDetailsModal = ({ refund, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Refund Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 pb-6">
            <div className="space-y-4">
              
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Number:</span>
                    <span className="font-mono font-medium">{refund.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="capitalize font-medium">{refund.refundStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed Date:</span>
                    <span className="font-medium">
                      {new Date(refund.refundProcessedDate).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Financial Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Amount:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(refund.refundedAmount)}
                    </span>
                  </div>
                  {refund.priceDetails?.totalPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="font-medium">
                        {formatCurrency(refund.priceDetails.totalPrice)}
                      </span>
                    </div>
                  )}
                  {refund.stripeRefundId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stripe Refund ID:</span>
                      <span className="font-mono text-xs">{refund.stripeRefundId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{refund.user?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{refund.user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Refund Reason</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    {refund.refundReason || 'No reason provided'}
                  </p>
                </div>
              </div>

              {/* Processed By */}
              {refund.refundProcessedBy && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Processed By</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Organizer:</span>
                      <span className="font-medium">
                        {refund.refundProcessedBy?.name || refund.refundProcessedBy?.email || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundHistory;