// store/slices/events/refundSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ========================================
// ASYNC THUNKS - API CALLS
// ========================================

// Fetch refund history for an event
export const fetchRefundHistory = createAsyncThunk(
  'refunds/fetchHistory',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/refunds/history`,
        { withCredentials: true }
      );

      if (response.data.success) {
        return {
          eventId,
          refunds: response.data.refunds,
          summary: response.data.summary
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch refund history');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch refund history'
      );
    }
  }
);

// Fetch refundable tickets for an event
export const fetchRefundableTickets = createAsyncThunk(
  'refunds/fetchRefundableTickets',
  async (eventId, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching refundable tickets for event:', eventId);
      
      // ✅ FIXED: Use the new endpoint that gets ALL tickets for organizers
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/paid/all-tickets`,
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`📊 Found ${response.data.tickets.length} total tickets for event`);
        
        // Filter for refundable tickets (confirmed/checked-in, not fully refunded)
        const refundableTickets = response.data.tickets.filter(ticket => {
          const isActiveStatus = ['confirmed', 'checked-in'].includes(ticket.status);
          const isNotFullyRefunded = ticket.refundStatus !== 'completed';
          return isActiveStatus && isNotFullyRefunded;
        });

        console.log(`✅ Found ${refundableTickets.length} refundable tickets`);

        return {
          eventId,
          tickets: refundableTickets,
          totalTickets: response.data.tickets.length
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to fetch tickets');
      }
    } catch (error) {
      console.error('❌ Error fetching refundable tickets:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch refundable tickets'
      );
    }
  }
);

// Initiate refund for a ticket
export const initiateRefund = createAsyncThunk(
  'refunds/initiateRefund',
  async ({ eventId, ticketNumber, reason, refundAmount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/refunds/initiate`,
        { ticketNumber, reason, refundAmount },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
        }
      );

      if (response.data.success) {
        return {
          eventId,
          ticketNumber,
          refundData: response.data.refund,
          ticketData: response.data.ticket,
          seatsReleased: response.data.seatsReleased,
          inventoryRestored: response.data.inventoryRestored
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to process refund');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to process refund'
      );
    }
  }
);

// Delete ticket (for cancellations)
export const deleteTicket = createAsyncThunk(
  'refunds/deleteTicket',
  async ({ eventId, ticketNumber, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/events/${eventId}/tickets/${ticketNumber}`,
        { 
          data: { reason },
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
        }
      );

      if (response.data.success) {
        return {
          eventId,
          ticketNumber,
          deletionReason: reason,
          seatsReleased: response.data.seatsReleased,
          inventoryRestored: response.data.inventoryRestored
        };
      } else {
        return rejectWithValue(response.data.message || 'Failed to delete ticket');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete ticket'
      );
    }
  }
);

// ========================================
// INITIAL STATE
// ========================================

const initialState = {
  // UI State
  loading: false,
  processing: false,
  error: null,
  successMessage: '',
  
  // Data Collections
  refundHistory: [], // Array of refund records
  refundableTickets: [], // Array of tickets eligible for refund
  refundSummary: null, // Event-level refund statistics
  
  // Current Operation State
  selectedTicket: null, // Currently selected ticket for refund
  selectedEvent: null, // Currently selected event
  
  // Modal State
  refundModal: {
    isOpen: false,
    mode: 'refund', // 'refund' | 'delete'
    ticketData: null,
    step: 1 // Multi-step refund process
  },
  
  // Form State
  refundForm: {
    reason: '',
    refundAmount: null,
    isPartialRefund: false,
    maxRefundable: 0
  },
  
  // Filters and Search
  filters: {
    status: 'all', // 'all' | 'partial' | 'completed'
    dateRange: null,
    searchTerm: ''
  },
  
  // Pagination
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  
  // Real-time Updates
  lastUpdated: null,
  autoRefresh: false
};

// ========================================
// SLICE DEFINITION
// ========================================

const refundSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    // =====================================
    // UI STATE MANAGEMENT
    // =====================================
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setProcessing: (state, action) => {
      state.processing = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    clearSuccessMessage: (state) => {
      state.successMessage = '';
    },
    
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = '';
    },
    
    // =====================================
    // SELECTION MANAGEMENT
    // =====================================
    
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload;
      
      // Auto-populate refund form when ticket is selected
      if (action.payload) {
        const maxRefundable = action.payload.priceDetails?.totalPrice - (action.payload.refundedAmount || 0);
        state.refundForm.maxRefundable = Math.max(0, maxRefundable);
        state.refundForm.refundAmount = maxRefundable;
        state.refundForm.isPartialRefund = false;
      }
    },
    
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
      // Clear ticket selection when event changes
      state.selectedTicket = null;
      state.refundableTickets = [];
      state.refundHistory = [];
    },
    
    clearSelection: (state) => {
      state.selectedTicket = null;
      state.selectedEvent = null;
    },
    
    // =====================================
    // MODAL MANAGEMENT
    // =====================================
    
    openRefundModal: (state, action) => {
      const { mode = 'refund', ticketData = null } = action.payload || {};
      state.refundModal.isOpen = true;
      state.refundModal.mode = mode;
      state.refundModal.ticketData = ticketData;
      state.refundModal.step = 1;
      
      // Set selected ticket if provided
      if (ticketData) {
        state.selectedTicket = ticketData;
        const maxRefundable = ticketData.priceDetails?.totalPrice - (ticketData.refundedAmount || 0);
        state.refundForm.maxRefundable = Math.max(0, maxRefundable);
        state.refundForm.refundAmount = maxRefundable;
      }
    },
    
    closeRefundModal: (state) => {
      state.refundModal.isOpen = false;
      state.refundModal.mode = 'refund';
      state.refundModal.ticketData = null;
      state.refundModal.step = 1;
      state.processing = false;
      state.error = null;
    },
    
    setModalStep: (state, action) => {
      state.refundModal.step = action.payload;
    },
    
    nextModalStep: (state) => {
      state.refundModal.step += 1;
    },
    
    prevModalStep: (state) => {
      if (state.refundModal.step > 1) {
        state.refundModal.step -= 1;
      }
    },
    
    // =====================================
    // FORM MANAGEMENT
    // =====================================
    
    updateRefundForm: (state, action) => {
      const { field, value } = action.payload;
      state.refundForm[field] = value;
      
      // Auto-detect partial refund
      if (field === 'refundAmount') {
        state.refundForm.isPartialRefund = value < state.refundForm.maxRefundable;
      }
    },
    
    resetRefundForm: (state) => {
      state.refundForm = {
        reason: '',
        refundAmount: null,
        isPartialRefund: false,
        maxRefundable: 0
      };
    },
    
    setRefundAmount: (state, action) => {
      const amount = action.payload;
      state.refundForm.refundAmount = amount;
      state.refundForm.isPartialRefund = amount < state.refundForm.maxRefundable;
    },
    
    // =====================================
    // FILTERS AND SEARCH
    // =====================================
    
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page when filtering
    },
    
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        dateRange: null,
        searchTerm: ''
      };
      state.pagination.currentPage = 1;
    },
    
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
      state.pagination.currentPage = 1;
    },
    
    // =====================================
    // PAGINATION
    // =====================================
    
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    
    // =====================================
    // DATA MANAGEMENT
    // =====================================
    
    updateTicketInList: (state, action) => {
      const { ticketNumber, updates } = action.payload;
      
      // Update in refundable tickets
      const ticketIndex = state.refundableTickets.findIndex(
        ticket => ticket.ticketNumber === ticketNumber
      );
      if (ticketIndex !== -1) {
        state.refundableTickets[ticketIndex] = {
          ...state.refundableTickets[ticketIndex],
          ...updates
        };
      }
      
      // Update selected ticket if it matches
      if (state.selectedTicket?.ticketNumber === ticketNumber) {
        state.selectedTicket = { ...state.selectedTicket, ...updates };
      }
    },
    
    removeTicketFromList: (state, action) => {
      const ticketNumber = action.payload;
      
      // Remove from refundable tickets
      state.refundableTickets = state.refundableTickets.filter(
        ticket => ticket.ticketNumber !== ticketNumber
      );
      
      // Clear selection if it was the removed ticket
      if (state.selectedTicket?.ticketNumber === ticketNumber) {
        state.selectedTicket = null;
      }
    },
    
    addRefundToHistory: (state, action) => {
      const refundRecord = action.payload;
      state.refundHistory.unshift(refundRecord); // Add to beginning
      state.lastUpdated = new Date().toISOString();
    },
    
    // =====================================
    // AUTO-REFRESH
    // =====================================
    
    setAutoRefresh: (state, action) => {
      state.autoRefresh = action.payload;
    },
    
    updateLastRefreshed: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    
    // =====================================
    // RESET FUNCTIONS
    // =====================================
    
    resetRefundState: (state) => {
      return { ...initialState };
    },
    
    resetForNewEvent: (state) => {
      state.refundHistory = [];
      state.refundableTickets = [];
      state.refundSummary = null;
      state.selectedTicket = null;
      state.error = null;
      state.successMessage = '';
      state.filters = initialState.filters;
      state.pagination = initialState.pagination;
    }
  },
  
  // ========================================
  // EXTRA REDUCERS - ASYNC THUNK HANDLING
  // ========================================
  
  extraReducers: (builder) => {
    // Fetch Refund History
    builder
      .addCase(fetchRefundHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRefundHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.refundHistory = action.payload.refunds;
        state.refundSummary = action.payload.summary;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRefundHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Fetch Refundable Tickets
    builder
      .addCase(fetchRefundableTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRefundableTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.refundableTickets = action.payload.tickets;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRefundableTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // Initiate Refund
    builder
      .addCase(initiateRefund.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(initiateRefund.fulfilled, (state, action) => {
        state.processing = false;
        state.successMessage = 'Refund processed successfully';
        
        const { ticketNumber, refundData, ticketData } = action.payload;
        
        // Update ticket in list
        const ticketIndex = state.refundableTickets.findIndex(
          ticket => ticket.ticketNumber === ticketNumber
        );
        if (ticketIndex !== -1) {
          state.refundableTickets[ticketIndex] = {
            ...state.refundableTickets[ticketIndex],
            ...ticketData
          };
        }
        
        // Add to refund history (optimistic update)
        const refundRecord = {
          ticketNumber,
          refundAmount: refundData.amount,
          status: refundData.status,
          refundDate: new Date().toISOString(),
          stripeRefundId: refundData.stripeRefundId
        };
        state.refundHistory.unshift(refundRecord);
        
        // Update summary
        if (state.refundSummary) {
          state.refundSummary.totalRefunded = (
            parseFloat(state.refundSummary.totalRefunded) + refundData.amount
          ).toFixed(2);
          state.refundSummary.refundCount += 1;
        }
        
        // Close modal and reset form
        state.refundModal.isOpen = false;
        state.refundForm = initialState.refundForm;
        state.selectedTicket = null;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(initiateRefund.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      });
    
    // Delete Ticket
    builder
      .addCase(deleteTicket.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.processing = false;
        state.successMessage = 'Ticket deleted successfully';
        
        const { ticketNumber } = action.payload;
        
        // Remove from refundable tickets
        state.refundableTickets = state.refundableTickets.filter(
          ticket => ticket.ticketNumber !== ticketNumber
        );
        
        // Clear selection if it was the deleted ticket
        if (state.selectedTicket?.ticketNumber === ticketNumber) {
          state.selectedTicket = null;
        }
        
        // Close modal and reset form
        state.refundModal.isOpen = false;
        state.refundForm = initialState.refundForm;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload;
      });
  }
});

// ========================================
// SELECTORS
// ========================================

// Basic selectors
export const selectRefundLoading = (state) => state.refunds.loading;
export const selectRefundProcessing = (state) => state.refunds.processing;
export const selectRefundError = (state) => state.refunds.error;
export const selectRefundSuccessMessage = (state) => state.refunds.successMessage;

// Data selectors
export const selectRefundHistory = (state) => state.refunds.refundHistory;
export const selectRefundableTickets = (state) => state.refunds.refundableTickets;
export const selectRefundSummary = (state) => state.refunds.refundSummary;
export const selectSelectedTicket = (state) => state.refunds.selectedTicket;
export const selectSelectedEvent = (state) => state.refunds.selectedEvent;

// Modal selectors
export const selectRefundModal = (state) => state.refunds.refundModal;
export const selectRefundForm = (state) => state.refunds.refundForm;

// Filter and pagination selectors
export const selectRefundFilters = (state) => state.refunds.filters;
export const selectRefundPagination = (state) => state.refunds.pagination;

// Derived selectors
export const selectFilteredRefundHistory = (state) => {
  const { refundHistory, filters } = state.refunds;
  
  return refundHistory.filter(refund => {
    // Status filter
    if (filters.status !== 'all' && refund.refundStatus !== filters.status) {
      return false;
    }
    
    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      return (
        refund.ticketNumber.toLowerCase().includes(searchTerm) ||
        refund.user?.name?.toLowerCase().includes(searchTerm) ||
        refund.user?.email?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
};

export const selectFilteredRefundableTickets = (state) => {
  const { refundableTickets, filters } = state.refunds;
  
  return refundableTickets.filter(ticket => {
    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      return (
        ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
        ticket.user?.name?.toLowerCase().includes(searchTerm) ||
        ticket.user?.email?.toLowerCase().includes(searchTerm) ||
        ticket.ticketType?.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });
};

// Statistics selectors
export const selectRefundStatistics = (state) => {
  const { refundHistory, refundableTickets } = state.refunds;
  
  return {
    totalRefunds: refundHistory.length,
    totalRefundableTickets: refundableTickets.length,
    lastRefundDate: refundHistory[0]?.refundProcessedDate || null,
    averageRefundAmount: refundHistory.length > 0 
      ? refundHistory.reduce((sum, refund) => sum + (refund.refundedAmount || 0), 0) / refundHistory.length 
      : 0
  };
};

// ========================================
// EXPORT ACTIONS
// ========================================

export const {
  // UI State
  setLoading,
  setProcessing,
  clearError,
  clearSuccessMessage,
  clearMessages,
  
  // Selection
  setSelectedTicket,
  setSelectedEvent,
  clearSelection,
  
  // Modal
  openRefundModal,
  closeRefundModal,
  setModalStep,
  nextModalStep,
  prevModalStep,
  
  // Form
  updateRefundForm,
  resetRefundForm,
  setRefundAmount,
  
  // Filters
  updateFilters,
  clearFilters,
  setSearchTerm,
  
  // Pagination
  setPagination,
  setCurrentPage,
  
  // Data Management
  updateTicketInList,
  removeTicketFromList,
  addRefundToHistory,
  
  // Auto-refresh
  setAutoRefresh,
  updateLastRefreshed,
  
  // Reset
  resetRefundState,
  resetForNewEvent
} = refundSlice.actions;

export default refundSlice.reducer;