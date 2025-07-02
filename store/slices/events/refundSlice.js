import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunks for API calls

// Fetch organizer's events for dropdown (matches route: GET /api/events/refunds/my-events)
export const fetchOrganizerEvents = createAsyncThunk(
  'refunds/fetchOrganizerEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/refunds/my-events`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch events'
      );
    }
  }
);

// Fetch refundable tickets for a specific event (matches route: GET /api/events/:eventId/refunds/eligible)
export const fetchRefundableTickets = createAsyncThunk(
  'refunds/fetchRefundableTickets',
  async ({ eventId, page = 1, limit = 20, search = '', searchType = 'all' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(searchType && { searchType }),
      });

      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/refunds/eligible?${params}`,
        {
          withCredentials: true,
        }
      );
      
      return {
        ...response.data,
        eventId,
        page,
        search,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch refundable tickets'
      );
    }
  }
);

// Search tickets by invoice or ticket number (uses same endpoint with search params)
export const searchTickets = createAsyncThunk(
  'refunds/searchTickets',
  async ({ eventId, searchTerm, searchType = 'all' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/refunds/eligible`,
        {
          params: {
            search: searchTerm,
            searchType, // 'invoiceNumber', 'ticketNumber', 'buyerName', 'buyerEmail', 'all'
            limit: 100, // Get more results for search
          },
          withCredentials: true,
        }
      );
      
      return {
        ...response.data,
        searchTerm,
        searchType,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Search failed'
      );
    }
  }
);

// Check invoice refund eligibility for group refunds
export const checkInvoiceEligibility = createAsyncThunk(
  'refunds/checkInvoiceEligibility',
  async ({ eventId, invoiceNumber }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/refunds/eligible`,
        {
          params: {
            search: invoiceNumber,
            searchType: 'invoiceNumber',
            limit: 100,
          },
          withCredentials: true,
        }
      );
      
      const tickets = response.data.tickets || [];
      const invoiceTickets = tickets.filter(t => t.invoiceNumber === invoiceNumber);
      
      // Check for mixed refund scenarios
      const hasRefundedTickets = invoiceTickets.some(t => t.refundStatus === 'refunded');
      const paymentIntents = [...new Set(invoiceTickets.map(t => t.paymentIntentId))];
      const hasConsistentPaymentIntent = paymentIntents.length === 1;
      
      return {
        invoiceNumber,
        tickets: invoiceTickets,
        totalTickets: invoiceTickets.length,
        totalAmount: invoiceTickets.reduce((sum, t) => sum + t.priceDetails.totalPrice, 0),
        canProcessGroupRefund: !hasRefundedTickets && hasConsistentPaymentIntent && invoiceTickets.length > 0,
        hasRefundedTickets,
        hasConsistentPaymentIntent,
        paymentIntentId: paymentIntents[0],
        eligibilityReason: hasRefundedTickets 
          ? 'Some tickets in this invoice have already been refunded'
          : !hasConsistentPaymentIntent 
          ? 'Tickets have inconsistent payment intents'
          : invoiceTickets.length === 0
          ? 'No tickets found for this invoice'
          : 'Eligible for group refund'
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check invoice eligibility'
      );
    }
  }
);

// Process individual ticket refund (PARTIAL REFUND)
export const processIndividualRefund = createAsyncThunk(
  'refunds/processIndividualRefund',
  async ({ eventId, ticketNumber, refundAmount, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/refunds/ticket`,
        {
          ticketNumber,
          refundAmount,
          reason,
        },
        {
          withCredentials: true,
        }
      );
      
      return {
        ...response.data,
        ticketNumber,
        refundAmount,
        reason,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to process individual refund'
      );
    }
  }
);

// Process group refund by invoice (FULL TRANSACTION REFUND)
export const processGroupRefund = createAsyncThunk(
  'refunds/processGroupRefund',
  async ({ eventId, invoiceNumber, reason, refundAmount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/refunds/group`,
        {
          invoiceNumber,
          reason,
          refundAmount,
        },
        {
          withCredentials: true,
        }
      );
      
      return {
        ...response.data,
        invoiceNumber,
        reason,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to process group refund'
      );
    }
  }
);

// Initial state
const initialState = {
  // Events management
  events: {
    list: [],
    loading: false,
    error: null,
  },
  
  // Current selected event
  selectedEvent: null,
  
  // Tickets management
  tickets: {
    list: [],
    total: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 20,
    loading: false,
    error: null,
  },
  
  // Search functionality
  search: {
    term: '',
    type: 'all', // 'invoiceNumber', 'ticketNumber', 'buyerName', 'buyerEmail', 'all'
    results: [],
    loading: false,
    error: null,
  },
  
  // Invoice eligibility checking
  invoiceEligibility: {
    data: null,
    loading: false,
    error: null,
  },
  
  // Selected tickets for refund
  selectedTickets: {
    individual: [], // Array of ticket objects for individual refunds
    grouped: {}, // Object with invoiceNumber as key, tickets array as value
  },
  
  // Refund form data
  refundForm: {
    type: 'individual', // 'individual' or 'group'
    reason: '',
    customAmounts: {}, // ticketNumber: amount pairs for custom amounts
    groupCustomAmounts: {}, 
  },
  
  // Refund processing states
  processing: {
    individual: {
      loading: false,
      error: null,
      success: null,
    },
    group: {
      loading: false,
      error: null,
      success: null,
    },
  },
  
  // UI states
  ui: {
    showRefundModal: false,
    activeTab: 'individual', // 'individual' or 'group'
    selectedInvoice: null,
  },
  
  // Refund analytics
  analytics: {
    totalRefundsProcessed: 0,
    totalAmountRefunded: 0,
    lastRefundDate: null,
  },
};

const refundSlice = createSlice({
  name: 'refunds',
  initialState,
  reducers: {
    // Event selection
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
      // Clear tickets when changing events
      state.tickets.list = [];
      state.tickets.total = 0;
      state.tickets.currentPage = 1;
      state.tickets.loading = false; // FIX: Reset loading state
      state.tickets.error = null;    // FIX: Clear any errors
  
      state.selectedTickets.individual = [];
      state.selectedTickets.grouped = {};
      // Clear other related states
      state.invoiceEligibility.data = null;
      state.invoiceEligibility.loading = false;
      state.invoiceEligibility.error = null;
      
      // Clear search results
      state.search.results = [];
      state.search.term = '';
      state.search.loading = false;
      state.search.error = null;
    },
    
    // Search management
    setSearchTerm: (state, action) => {
      state.search.term = action.payload;
    },
    
    setSearchType: (state, action) => {
      state.search.type = action.payload;
    },
    
    clearSearchResults: (state) => {
      state.search.results = [];
      state.search.term = '';
      state.search.error = null;
    },
    
    // Ticket selection for refunds
    toggleTicketSelection: (state, action) => {
      const ticket = action.payload;
      const index = state.selectedTickets.individual.findIndex(
        t => t.ticketNumber === ticket.ticketNumber
      );
      
      if (index > -1) {
        state.selectedTickets.individual.splice(index, 1);
      } else {
        state.selectedTickets.individual.push(ticket);
      }
    },
    
    clearSelectedTickets: (state) => {
      state.selectedTickets.individual = [];
      state.selectedTickets.grouped = {};
    },
    
    // Group ticket selection by invoice
    selectInvoiceGroup: (state, action) => {
      const { invoiceNumber, tickets } = action.payload;
      state.selectedTickets.grouped[invoiceNumber] = tickets;
    },
    
    deselectInvoiceGroup: (state, action) => {
      const invoiceNumber = action.payload;
      delete state.selectedTickets.grouped[invoiceNumber];
    },
    
    // Refund form management
    setRefundType: (state, action) => {
      state.refundForm.type = action.payload;
    },
    
    setRefundReason: (state, action) => {
      state.refundForm.reason = action.payload;
    },
    
    setCustomRefundAmount: (state, action) => {
      const { ticketNumber, amount } = action.payload;
      if (amount === null || amount === undefined || amount === '') {
        delete state.refundForm.customAmounts[ticketNumber];
      } else {
        state.refundForm.customAmounts[ticketNumber] = amount;
      }
    },

    setGroupCustomAmount: (state, action) => {
  const { invoiceNumber, amount } = action.payload;
  if (amount === null || amount === undefined || amount === '') {
    delete state.refundForm.groupCustomAmounts[invoiceNumber];
  } else {
    state.refundForm.groupCustomAmounts[invoiceNumber] = amount;
  }
},
    
    clearRefundForm: (state) => {
      state.refundForm.reason = '';
      state.refundForm.customAmounts = {};
       state.refundForm.groupCustomAmounts = {};
    },
    
    // UI state management
    setShowRefundModal: (state, action) => {
      state.ui.showRefundModal = action.payload;
    },
    
    setActiveTab: (state, action) => {
      state.ui.activeTab = action.payload;
    },
    
    setSelectedInvoice: (state, action) => {
      state.ui.selectedInvoice = action.payload;
    },
    
    // Pagination
    setCurrentPage: (state, action) => {
      state.tickets.currentPage = action.payload;
    },
    
    setPageLimit: (state, action) => {
      state.tickets.limit = action.payload;
    },
    
    // Clear all errors
    clearErrors: (state) => {
      state.events.error = null;
      state.tickets.error = null;
      state.search.error = null;
      state.processing.individual.error = null;
      state.processing.group.error = null;
      state.invoiceEligibility.error = null;
    },
    
    // Clear success messages
    clearSuccessMessages: (state) => {
      state.processing.individual.success = null;
      state.processing.group.success = null;
    },

    clearProcessingState: (state) => {
  state.processing.individual.success = null;
  state.processing.individual.error = null;
  state.processing.group.success = null;
  state.processing.group.error = null;
},

clearIndividualProcessingState: (state) => {
  state.processing.individual.success = null;
  state.processing.individual.error = null;
},

clearGroupProcessingState: (state) => {
  state.processing.group.success = null;
  state.processing.group.error = null;
},
    
    // Clear invoice eligibility data
    clearInvoiceEligibility: (state) => {
      state.invoiceEligibility.data = null;
      state.invoiceEligibility.error = null;
    },
    
    // Update analytics
    updateRefundAnalytics: (state, action) => {
      const { type, amount } = action.payload;
      state.analytics.totalRefundsProcessed += 1;
      state.analytics.totalAmountRefunded += amount;
      state.analytics.lastRefundDate = new Date().toISOString();
    },
    
    // Reset entire state
    resetRefundState: (state) => {
      return initialState;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch organizer events
    builder
      .addCase(fetchOrganizerEvents.pending, (state) => {
        state.events.loading = true;
        state.events.error = null;
      })
      .addCase(fetchOrganizerEvents.fulfilled, (state, action) => {
        state.events.loading = false;
        state.events.list = action.payload.events || [];
        state.events.error = null;
      })
      .addCase(fetchOrganizerEvents.rejected, (state, action) => {
        state.events.loading = false;
        state.events.error = action.payload;
        state.events.list = [];
      });
    
    // Fetch refundable tickets
    builder
      .addCase(fetchRefundableTickets.pending, (state) => {
        state.tickets.loading = true;
        state.tickets.error = null;
      })
      .addCase(fetchRefundableTickets.fulfilled, (state, action) => {
        state.tickets.loading = false;
        state.tickets.list = action.payload.tickets || [];
        state.tickets.total = action.payload.pagination?.totalTickets || 0;
        state.tickets.currentPage = action.payload.pagination?.currentPage || 1;
        state.tickets.totalPages = action.payload.pagination?.totalPages || 1;
        state.tickets.error = null;
      })
      .addCase(fetchRefundableTickets.rejected, (state, action) => {
        state.tickets.loading = false;
        state.tickets.error = action.payload;
        state.tickets.list = [];
      });
    
    // Search tickets
    builder
      .addCase(searchTickets.pending, (state) => {
        state.search.loading = true;
        state.search.error = null;
      })
      .addCase(searchTickets.fulfilled, (state, action) => {
        state.search.loading = false;
        state.search.results = action.payload.tickets || [];
        state.search.error = null;
      })
      .addCase(searchTickets.rejected, (state, action) => {
        state.search.loading = false;
        state.search.error = action.payload;
        state.search.results = [];
      });
    
    // Check invoice eligibility
    builder
      .addCase(checkInvoiceEligibility.pending, (state) => {
        state.invoiceEligibility.loading = true;
        state.invoiceEligibility.error = null;
      })
      .addCase(checkInvoiceEligibility.fulfilled, (state, action) => {
        state.invoiceEligibility.loading = false;
        state.invoiceEligibility.data = action.payload;
        state.invoiceEligibility.error = null;
      })
      .addCase(checkInvoiceEligibility.rejected, (state, action) => {
        state.invoiceEligibility.loading = false;
        state.invoiceEligibility.error = action.payload;
        state.invoiceEligibility.data = null;
      });
    
    // Process individual refund
    builder
      .addCase(processIndividualRefund.pending, (state) => {
        state.processing.individual.loading = true;
        state.processing.individual.error = null;
        state.processing.individual.success = null;
      })
      .addCase(processIndividualRefund.fulfilled, (state, action) => {
  state.processing.individual.loading = false;
  state.processing.individual.success = action.payload;
  state.processing.individual.error = null;
  
  // Update the refunded ticket status instead of removing it
  const ticketNumber = action.payload.ticketNumber;
  
  // Update in main tickets list
  const ticketIndex = state.tickets.list.findIndex(
    ticket => ticket.ticketNumber === ticketNumber
  );
  if (ticketIndex > -1) {
    state.tickets.list[ticketIndex].refundStatus = 'refunded';
    state.tickets.list[ticketIndex].status = 'refunded';
    state.tickets.list[ticketIndex].refundType = 'individual';
    state.tickets.list[ticketIndex].stripeRefundId = action.payload.refund?.stripeRefundId;
    state.tickets.list[ticketIndex].refundedAt = new Date().toISOString();
  }
  
  // Update in search results
  const searchIndex = state.search.results.findIndex(
    ticket => ticket.ticketNumber === ticketNumber
  );
  if (searchIndex > -1) {
    state.search.results[searchIndex].refundStatus = 'refunded';
    state.search.results[searchIndex].status = 'refunded';
    state.search.results[searchIndex].refundType = 'individual';
    state.search.results[searchIndex].stripeRefundId = action.payload.refund?.stripeRefundId;
    state.search.results[searchIndex].refundedAt = new Date().toISOString();
  }
  
  // Update analytics
  const refundAmount = action.payload.refund?.amount || 0;
  state.analytics.totalRefundsProcessed += 1;
  state.analytics.totalAmountRefunded += refundAmount;
  state.analytics.lastRefundDate = new Date().toISOString();
})
      .addCase(processIndividualRefund.rejected, (state, action) => {
        state.processing.individual.loading = false;
        state.processing.individual.error = action.payload;
        state.processing.individual.success = null;
      });
    
    // Process group refund
    builder
      .addCase(processGroupRefund.pending, (state) => {
        state.processing.group.loading = true;
        state.processing.group.error = null;
        state.processing.group.success = null;
      })
      .addCase(processGroupRefund.fulfilled, (state, action) => {
        state.processing.group.loading = false;
        state.processing.group.success = action.payload;
        state.processing.group.error = null;
        
        // ✅ UPDATED: Handle new group refund response structure
        const invoiceNumber = action.payload.invoiceNumber;
        const refundedTicketNumbers = action.payload.refund?.ticketNumbers || [];
        
        if (refundedTicketNumbers.length > 0) {
          // Remove all tickets from the invoice from lists
          state.tickets.list = state.tickets.list.filter(
            ticket => !refundedTicketNumbers.includes(ticket.ticketNumber)
          );
          state.search.results = state.search.results.filter(
            ticket => !refundedTicketNumbers.includes(ticket.ticketNumber)
          );
          
          // Remove from grouped selection
          delete state.selectedTickets.grouped[invoiceNumber];
          
          // Update totals
          state.tickets.total = Math.max(0, state.tickets.total - refundedTicketNumbers.length);
        }
        
        // Update analytics with group refund data
        const refundAmount = action.payload.refund?.totalAmount || 0;
        state.analytics.totalRefundsProcessed += 1;
        state.analytics.totalAmountRefunded += refundAmount;
        state.analytics.lastRefundDate = new Date().toISOString();
        
        // Clear invoice eligibility data since the invoice is now refunded
        if (state.invoiceEligibility.data?.invoiceNumber === invoiceNumber) {
          state.invoiceEligibility.data = null;
        }
      })
      .addCase(processGroupRefund.rejected, (state, action) => {
        state.processing.group.loading = false;
        state.processing.group.error = action.payload;
        state.processing.group.success = null;
      });
  },
});

// Export actions
export const {
  setSelectedEvent,
  setSearchTerm,
  setSearchType,
  clearSearchResults,
  toggleTicketSelection,
  clearSelectedTickets,
  selectInvoiceGroup,
  deselectInvoiceGroup,
  setRefundType,
  setRefundReason,
  setCustomRefundAmount,
   setGroupCustomAmount,
  clearRefundForm,
  setShowRefundModal,
  setActiveTab,
  setSelectedInvoice,
  setCurrentPage,
  setPageLimit,
  clearErrors,
  clearSuccessMessages,
  clearProcessingState,
  clearIndividualProcessingState,
  clearGroupProcessingState,
  clearInvoiceEligibility,
  updateRefundAnalytics,
  resetRefundState,
} = refundSlice.actions;

// ===================================
// BASE SELECTORS (Simple state access)
// ===================================
export const selectRefundState = (state) => state.refunds;
export const selectEvents = (state) => state.refunds.events;
export const selectSelectedEvent = (state) => state.refunds.selectedEvent;
export const selectTicketsState = (state) => state.refunds.tickets;
export const selectTicketsList = (state) => state.refunds.tickets.list;
export const selectSearchState = (state) => state.refunds.search;
export const selectSearchResults = (state) => state.refunds.search.results;
export const selectSearchTerm = (state) => state.refunds.search.term;
export const selectSelectedTickets = (state) => state.refunds.selectedTickets;
export const selectRefundForm = (state) => state.refunds.refundForm;
export const selectProcessing = (state) => state.refunds.processing;
export const selectUI = (state) => state.refunds.ui;
export const selectInvoiceEligibility = (state) => state.refunds.invoiceEligibility;
export const selectAnalytics = (state) => state.refunds.analytics;

// ===================================
// MEMOIZED SELECTORS
// ===================================

// Tickets grouped by invoice number (main tickets list)
export const selectTicketsByInvoice = createSelector(
  [selectTicketsList],
  (tickets) => {
    return tickets.reduce((groups, ticket) => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!groups[invoiceNumber]) {
        groups[invoiceNumber] = [];
      }
      groups[invoiceNumber].push(ticket);
      return groups;
    }, {});
  }
);

// Search results grouped by invoice number
export const selectSearchTicketsByInvoice = createSelector(
  [selectSearchResults],
  (searchResults) => {
    return searchResults.reduce((groups, ticket) => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!groups[invoiceNumber]) {
        groups[invoiceNumber] = [];
      }
      groups[invoiceNumber].push(ticket);
      return groups;
    }, {});
  }
);

// Statistics for main tickets list
export const selectTicketStatistics = createSelector(
  [selectTicketsList],
  (tickets) => ({
    totalCount: tickets.length,
    totalValue: tickets.reduce((sum, ticket) => sum + (ticket.priceDetails?.totalPrice || 0), 0),
    uniqueInvoices: new Set(tickets.map(t => t.invoiceNumber)).size,
    uniquePaymentIntents: new Set(tickets.map(t => t.paymentIntentId)).size,
  })
);

// Statistics for search results
export const selectSearchStatistics = createSelector(
  [selectSearchResults],
  (searchResults) => ({
    totalCount: searchResults.length,
    totalValue: searchResults.reduce((sum, ticket) => sum + (ticket.priceDetails?.totalPrice || 0), 0),
    uniqueInvoices: new Set(searchResults.map(t => t.invoiceNumber)).size,
    uniquePaymentIntents: new Set(searchResults.map(t => t.paymentIntentId)).size,
  })
);

// Combined selectors that choose between regular and search results
export const selectCurrentTickets = createSelector(
  [selectSearchTerm, selectTicketsList, selectSearchResults],
  (searchTerm, tickets, searchResults) => {
    return searchTerm && searchResults.length > 0 ? searchResults : tickets;
  }
);

export const selectCurrentTicketsByInvoice = createSelector(
  [selectSearchTerm, selectTicketsByInvoice, selectSearchTicketsByInvoice],
  (searchTerm, ticketsByInvoice, searchTicketsByInvoice) => {
    return searchTerm ? searchTicketsByInvoice : ticketsByInvoice;
  }
);

export const selectCurrentStatistics = createSelector(
  [selectSearchTerm, selectTicketStatistics, selectSearchStatistics],
  (searchTerm, ticketStats, searchStats) => {
    return searchTerm ? searchStats : ticketStats;
  }
);

// Search state selector
export const selectSearch = createSelector(
  [selectSearchState],
  (searchState) => searchState
);

// ===================================
// COMPLEX DERIVED SELECTORS
// ===================================

// Calculate total refund amount for selected individual tickets
export const selectTotalRefundAmount = createSelector(
  [selectSelectedTickets, selectRefundForm],
  (selectedTickets, refundForm) => {
    const { individual } = selectedTickets;
    const { customAmounts } = refundForm;
    
    return individual.reduce((total, ticket) => {
      const customAmount = customAmounts[ticket.ticketNumber];
      const amount = customAmount !== undefined 
        ? parseFloat(customAmount) || 0
        : ticket.priceDetails?.totalPrice || 0;
      return total + amount;
    }, 0);
  }
);

// Calculate group refund amount by invoice number
export const selectGroupRefundAmount = createSelector(
  [selectSelectedTickets],
  (selectedTickets) => (invoiceNumber) => {
    const groupedTickets = selectedTickets.grouped[invoiceNumber] || [];
    return groupedTickets.reduce((total, ticket) => {
      return total + (ticket.priceDetails?.totalPrice || 0);
    }, 0);
  }
);

// Enhanced invoice group eligibility checker
export const selectInvoiceGroupEligibility = createSelector(
  [selectTicketsByInvoice],
  (ticketsByInvoice) => (invoiceNumber) => {
    const invoiceTickets = ticketsByInvoice[invoiceNumber] || [];
    
    if (invoiceTickets.length === 0) {
      return {
        eligible: false,
        reason: 'No tickets found for this invoice'
      };
    }
    
    const hasRefundedTickets = invoiceTickets.some(t => t.refundStatus === 'refunded');
    const paymentIntents = [...new Set(invoiceTickets.map(t => t.paymentIntentId))];
    const hasConsistentPaymentIntent = paymentIntents.length === 1;
    
    return {
      eligible: !hasRefundedTickets && hasConsistentPaymentIntent,
      reason: hasRefundedTickets 
        ? 'Some tickets already refunded - use individual refunds'
        : !hasConsistentPaymentIntent 
        ? 'Inconsistent payment intents'
        : 'Eligible for group refund',
      ticketCount: invoiceTickets.length,
      totalAmount: invoiceTickets.reduce((sum, t) => sum + (t.priceDetails?.totalPrice || 0), 0)
    };
  }
);

// Loading state aggregator
export const selectIsLoading = createSelector(
  [selectEvents, selectTicketsState, selectSearchState, selectProcessing, selectInvoiceEligibility],
  (events, tickets, search, processing, invoiceEligibility) => {
    return events.loading || 
           tickets.loading || 
           search.loading ||
           processing.individual.loading ||
           processing.group.loading ||
           invoiceEligibility.loading;
  }
);

// Error state aggregator
export const selectHasErrors = createSelector(
  [selectEvents, selectTicketsState, selectSearchState, selectProcessing, selectInvoiceEligibility],
  (events, tickets, search, processing, invoiceEligibility) => {
    return !!(events.error || 
             tickets.error || 
             search.error ||
             processing.individual.error ||
             processing.group.error ||
             invoiceEligibility.error);
  }
);

// Enhanced analytics with derived calculations
export const selectRefundStats = createSelector(
  [selectAnalytics, selectEvents],
  (analytics, events) => {
    return {
      ...analytics,
      averageRefundAmount: analytics.totalRefundsProcessed > 0 
        ? (analytics.totalAmountRefunded / analytics.totalRefundsProcessed).toFixed(2)
        : '0.00',
      eventsWithRefunds: events.list.filter(e => e.hasRefundableTickets || e.refundedTickets > 0).length
    };
  }
);

// Pagination info selector
export const selectPaginationInfo = createSelector(
  [selectTicketsState],
  (tickets) => ({
    currentPage: tickets.currentPage,
    totalPages: tickets.totalPages,
    total: tickets.total,
    limit: tickets.limit,
    hasNextPage: tickets.currentPage < tickets.totalPages,
    hasPrevPage: tickets.currentPage > 1,
  })
);

// Selected tickets summary
export const selectSelectedTicketsSummary = createSelector(
  [selectSelectedTickets],
  (selectedTickets) => {
    const individualCount = selectedTickets.individual.length;
    const groupedCount = Object.keys(selectedTickets.grouped).length;
    const totalGroupedTickets = Object.values(selectedTickets.grouped)
      .reduce((sum, tickets) => sum + tickets.length, 0);
    
    return {
      individualCount,
      groupedCount,
      totalGroupedTickets,
      totalSelected: individualCount + totalGroupedTickets,
      hasSelectedTickets: individualCount > 0 || groupedCount > 0,
    };
  }
);

// Form validation selector
export const selectRefundFormValidation = createSelector(
  [selectRefundForm, selectSelectedTickets],
  (refundForm, selectedTickets) => {
    const hasReason = refundForm.reason.trim().length > 0;
    const hasSelectedTickets = selectedTickets.individual.length > 0 || 
                              Object.keys(selectedTickets.grouped).length > 0;
    
    const errors = [];
    if (!hasReason) errors.push('Refund reason is required');
    if (!hasSelectedTickets) errors.push('At least one ticket must be selected');
    
    // Validate custom amounts
    const invalidCustomAmounts = [];
    selectedTickets.individual.forEach(ticket => {
      const customAmount = refundForm.customAmounts[ticket.ticketNumber];
      if (customAmount !== undefined) {
        const amount = parseFloat(customAmount);
        const maxAmount = ticket.priceDetails?.totalPrice || 0;
        if (isNaN(amount) || amount < 0) {
          invalidCustomAmounts.push(`Invalid amount for ticket ${ticket.ticketNumber}`);
        } else if (amount > maxAmount) {
          invalidCustomAmounts.push(`Amount for ticket ${ticket.ticketNumber} exceeds maximum (${maxAmount})`);
        }
      }
    });
    
    return {
      isValid: hasReason && hasSelectedTickets && invalidCustomAmounts.length === 0,
      hasReason,
      hasSelectedTickets,
      errors: [...errors, ...invalidCustomAmounts],
      customAmountErrors: invalidCustomAmounts,
    };
  }
);

// Success messages selector
export const selectSuccessMessages = createSelector(
  [selectProcessing],
  (processing) => {
    const messages = [];
    if (processing.individual.success) {
      messages.push({
        type: 'individual',
        message: 'Individual refund processed successfully',
        data: processing.individual.success
      });
    }
    if (processing.group.success) {
      messages.push({
        type: 'group',
        message: 'Group refund processed successfully',
        data: processing.group.success
      });
    }
    return messages;
  }
);

// All errors selector
export const selectAllErrors = createSelector(
  [selectEvents, selectTicketsState, selectSearchState, selectProcessing, selectInvoiceEligibility],
  (events, tickets, search, processing, invoiceEligibility) => {
    const errors = [];
    
    if (events.error) errors.push({ type: 'events', message: events.error });
    if (tickets.error) errors.push({ type: 'tickets', message: tickets.error });
    if (search.error) errors.push({ type: 'search', message: search.error });
    if (processing.individual.error) errors.push({ type: 'individual_refund', message: processing.individual.error });
    if (processing.group.error) errors.push({ type: 'group_refund', message: processing.group.error });
    if (invoiceEligibility.error) errors.push({ type: 'invoice_eligibility', message: invoiceEligibility.error });
    
    return errors;
  }
);

// Invoice details selector with enhanced info
export const selectInvoiceDetails = createSelector(
  [selectTicketsByInvoice, selectSelectedTickets],
  (ticketsByInvoice, selectedTickets) => (invoiceNumber) => {
    const tickets = ticketsByInvoice[invoiceNumber] || [];
    const isSelected = !!selectedTickets.grouped[invoiceNumber];
    
    if (tickets.length === 0) {
      return null;
    }
    
    const totalAmount = tickets.reduce((sum, t) => sum + (t.priceDetails?.totalPrice || 0), 0);
    const paymentIntents = [...new Set(tickets.map(t => t.paymentIntentId))];
    const buyers = [...new Set(tickets.map(t => `${t.buyer?.firstName} ${t.buyer?.lastName}`))];
    const refundStatuses = [...new Set(tickets.map(t => t.refundStatus))];
    
    return {
      invoiceNumber,
      tickets,
      ticketCount: tickets.length,
      totalAmount,
      paymentIntents,
      hasMultiplePaymentIntents: paymentIntents.length > 1,
      buyers,
      refundStatuses,
      hasRefundedTickets: refundStatuses.includes('refunded'),
      canGroupRefund: paymentIntents.length === 1 && !refundStatuses.includes('refunded'),
      isSelected,
      createdAt: tickets[0]?.createdAt,
      eventId: tickets[0]?.event,
    };
  }
);

// Current view selector (determines what data to show based on search state)
export const selectCurrentView = createSelector(
  [selectSearchTerm, selectSearchState, selectTicketsState],
  (searchTerm, searchState, ticketsState) => {
    return {
      isSearching: !!searchTerm,
      isSearchLoading: searchState.loading,
      isTicketsLoading: ticketsState.loading,
      hasSearchResults: searchState.results.length > 0,
      showPagination: !searchTerm && ticketsState.totalPages > 1,
      currentDataSource: searchTerm ? 'search' : 'tickets',
    };
  }
);

// Filter options selector (for advanced filtering)
export const selectFilterOptions = createSelector(
  [selectCurrentTickets],
  (tickets) => {
    const uniqueValues = tickets.reduce((acc, ticket) => {
      // Payment methods
      if (ticket.paymentMethod && !acc.paymentMethods.includes(ticket.paymentMethod)) {
        acc.paymentMethods.push(ticket.paymentMethod);
      }
      
      // Event types if available
      if (ticket.eventType && !acc.eventTypes.includes(ticket.eventType)) {
        acc.eventTypes.push(ticket.eventType);
      }
      
      // Price ranges
      const price = ticket.priceDetails?.totalPrice || 0;
      if (price < 50) acc.priceRanges.under50++;
      else if (price < 100) acc.priceRanges.under100++;
      else if (price < 200) acc.priceRanges.under200++;
      else acc.priceRanges.over200++;
      
      return acc;
    }, {
      paymentMethods: [],
      eventTypes: [],
      priceRanges: { under50: 0, under100: 0, under200: 0, over200: 0 }
    });
    
    return uniqueValues;
  }
);

// Performance metrics selector
export const selectPerformanceMetrics = createSelector(
  [selectTicketsState, selectSearchState, selectSelectedTickets],
  (ticketsState, searchState, selectedTickets) => {
    return {
      totalTicketsLoaded: ticketsState.list.length,
      searchResultsCount: searchState.results.length,
      selectedIndividualCount: selectedTickets.individual.length,
      selectedGroupsCount: Object.keys(selectedTickets.grouped).length,
      memoryUsage: {
        tickets: ticketsState.list.length,
        searchResults: searchState.results.length,
        selectedTickets: selectedTickets.individual.length + 
                         Object.values(selectedTickets.grouped).reduce((sum, tickets) => sum + tickets.length, 0)
      }
    };
  }
);

export default refundSlice.reducer;