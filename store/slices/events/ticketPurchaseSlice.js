// store/slices/events/ticketPurchaseSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Async thunks for API calls
export const initializePurchaseSession = createAsyncThunk(
  'ticketPurchase/initializeSession',
  async ({ eventId }, { rejectWithValue }) => {
    try {
      // This could be used for session validation or event data fetching if needed
      return { eventId, timestamp: Date.now() };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPaymentIntent = createAsyncThunk(
  'ticketPurchase/createPaymentIntent',
  async ({ eventId, ticketData, buyerInfo }, { rejectWithValue }) => {
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/paid/create-payment-intent`,
        {
          tickets: ticketData.reduce((acc, ticket) => {
            acc[ticket.ticketTypeId] = ticket.quantity;
            return acc;
          }, {}),
          buyerInfo,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message || 'Failed to create payment intent');
      }
    } catch (error) {
      console.error('❌ Payment intent error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create payment intent'
      );
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'ticketPurchase/confirmPayment',
  async ({ eventId, paymentIntentId, paymentMethodId, tickets, buyerInfo }, { rejectWithValue }) => {
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/paid/confirm-payment`,
        {
          paymentIntentId,
          paymentMethodId,
          tickets,
          buyerInfo,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        return response.data;
      } else {
        return rejectWithValue(response.data.message || 'Payment confirmation failed');
      }
    } catch (error) {
      console.error('❌ Payment confirmation error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Payment confirmation failed'
      );
    }
  }
);

const initialState = {
  // Session Management
  eventId: null,
  sessionActive: false,
  currentStep: 'ticket-selection', // 'ticket-selection' | 'seat-selection' | 'checkout' | 'payment' | 'complete'
  
  // Ticket Selection
  selectedTickets: [], // [{ ticketTypeId, quantity, price, name }]
  ticketTotals: {
    subtotal: 0,
    fees: 0,
    tax: 0,
    total: 0,
    totalQuantity: 0,
  },
  
  // Buyer Information
  buyerInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  
  // Seat Information (coordination with seatSelectionSlice)
  seatInfo: {
    requiresSeats: false,
    selectedSeats: [],
    seatCount: 0,
  },
  
  // Payment State
  paymentStatus: 'idle', // 'idle' | 'creating' | 'pending' | 'succeeded' | 'failed'
  paymentIntent: null,
  paymentIntentId: null,
  clientSecret: null,
  pricing: null,
  
  // Loading States
  loading: {
    initializing: false,
    creatingPayment: false,
    confirmingPayment: false,
  },
  
  // Error Handling
  error: null,
  
  // Progress Tracking
  completedSteps: [],
  canProceedToNext: false,
};

const ticketPurchaseSlice = createSlice({
  name: 'ticketPurchase',
  initialState,
  reducers: {
    // Session Management
    resetPurchaseSession: (state) => {
      return { ...initialState };
    },
    
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    
    markStepCompleted: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
      }
    },
    
    // Ticket Selection Actions
    updateTicketSelection: (state, action) => {
      const { ticketTypeId, quantity, price, name, maxQuantity } = action.payload;
      
      // Find existing ticket or create new one
      const existingIndex = state.selectedTickets.findIndex(
        ticket => ticket.ticketTypeId === ticketTypeId
      );
      
      if (quantity === 0) {
        // Remove ticket if quantity is 0
        if (existingIndex !== -1) {
          state.selectedTickets.splice(existingIndex, 1);
        }
      } else {
        // Add or update ticket
        const ticketData = {
          ticketTypeId,
          quantity: Math.min(quantity, maxQuantity || quantity),
          price,
          name,
          maxQuantity,
        };
        
        if (existingIndex !== -1) {
          state.selectedTickets[existingIndex] = ticketData;
        } else {
          state.selectedTickets.push(ticketData);
        }
      }
      
      // Recalculate totals
      ticketPurchaseSlice.caseReducers.calculateTotals(state);
      
      // Update seat requirements
      const totalQuantity = state.selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      state.seatInfo.seatCount = totalQuantity;
      
      // Update canProceedToNext
      state.canProceedToNext = state.selectedTickets.length > 0 && totalQuantity > 0;
    },
    
    calculateTotals: (state) => {
      const subtotal = state.selectedTickets.reduce(
        (sum, ticket) => sum + (ticket.price * ticket.quantity), 0
      );
      const totalQuantity = state.selectedTickets.reduce(
        (sum, ticket) => sum + ticket.quantity, 0
      );
      
      // No automatic fees or tax - sellers set whole prices
      const total = subtotal;
      
      state.ticketTotals = {
        subtotal: Math.round(subtotal * 100) / 100,
        fees: 0,
        tax: 0,
        total: Math.round(total * 100) / 100,
        totalQuantity,
      };
    },
    
    // Buyer Information
    updateBuyerInfo: (state, action) => {
      state.buyerInfo = { ...state.buyerInfo, ...action.payload };
    },
    
    // Seat Coordination
    setSeatRequirement: (state, action) => {
      state.seatInfo.requiresSeats = action.payload;
    },
    
    updateSeatInfo: (state, action) => {
      state.seatInfo = { ...state.seatInfo, ...action.payload };
    },
    
    // Error Handling
    clearError: (state) => {
      state.error = null;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Payment Status
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize Purchase Session
      .addCase(initializePurchaseSession.pending, (state) => {
        state.loading.initializing = true;
        state.error = null;
      })
      .addCase(initializePurchaseSession.fulfilled, (state, action) => {
        state.loading.initializing = false;
        state.eventId = action.payload.eventId;
        state.sessionActive = true;
        state.error = null;
      })
      .addCase(initializePurchaseSession.rejected, (state, action) => {
        state.loading.initializing = false;
        state.error = action.payload;
      })
      
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading.creatingPayment = true;
        state.paymentStatus = 'creating';
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading.creatingPayment = false;
        state.paymentStatus = 'pending';
        state.paymentIntentId = action.payload.paymentIntentId;
        state.paymentIntent = { id: action.payload.paymentIntentId };
        state.clientSecret = action.payload.clientSecret;
        state.pricing = action.payload.pricing;
        state.error = null;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading.creatingPayment = false;
        state.paymentStatus = 'failed';
        state.error = action.payload;
      })
      
      // Confirm Payment
      .addCase(confirmPayment.pending, (state) => {
        state.loading.confirmingPayment = true;
        state.paymentStatus = 'pending';
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading.confirmingPayment = false;
        state.paymentStatus = 'succeeded';
        state.currentStep = 'complete';
        state.completedSteps.push('payment');
        state.error = null;
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading.confirmingPayment = false;
        state.paymentStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// Action creators
export const {
  resetPurchaseSession,
  setCurrentStep,
  markStepCompleted,
  updateTicketSelection,
  calculateTotals,
  updateBuyerInfo,
  setSeatRequirement,
  updateSeatInfo,
  clearError,
  setError,
  setPaymentStatus,
} = ticketPurchaseSlice.actions;

// Selectors
export const selectTicketPurchase = (state) => state.ticketPurchase;
export const selectSelectedTickets = (state) => state.ticketPurchase.selectedTickets;
export const selectTicketTotals = (state) => state.ticketPurchase.ticketTotals;
export const selectBuyerInfo = (state) => state.ticketPurchase.buyerInfo;
export const selectSeatInfo = (state) => state.ticketPurchase.seatInfo;
export const selectPaymentStatus = (state) => state.ticketPurchase.paymentStatus;
export const selectCurrentStep = (state) => state.ticketPurchase.currentStep;
export const selectCanProceedToNext = (state) => state.ticketPurchase.canProceedToNext;
export const selectPurchaseLoading = (state) => state.ticketPurchase.loading;
export const selectPurchaseError = (state) => state.ticketPurchase.error;

export default ticketPurchaseSlice.reducer;