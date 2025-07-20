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

// ✅ FIXED: Simplified confirmPayment to match backend expectations
export const confirmPayment = createAsyncThunk(
  'ticketPurchase/confirmPayment',
  async ({ eventId, paymentIntentId, paymentMethodId, tickets, buyerInfo, formResponses }, { rejectWithValue }) => {
    
    try {
      console.log('🔄 Redux confirmPayment sending to backend:', {
        eventId,
        paymentIntentId,
        paymentMethodId,
        tickets,
        buyerInfo,
        formResponses
      });

      const response = await axios.post(
        `${API_BASE_URL}/events/${eventId}/paid/confirm-payment`,
        {
          paymentIntentId,
          paymentMethodId, // Optional - may be undefined
          tickets, // Object format: { ticketTypeId: quantity }
          buyerInfo,
          formResponses: formResponses ? Object.entries(formResponses).map(([fieldName, response]) => ({
            fieldName,
            response
          })) : []
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
      console.error('❌ Full error object:', error);
      
      // Extract the most user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Payment confirmation failed';
      
      console.log('🔍 Extracted error message:', errorMessage);
      return rejectWithValue(errorMessage);
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
      agreedToTerms: false,
      refundPolicyAccepted: false,
  },
  
  // Custom Registration Fields
  formResponses: {}, // { fieldName: response }
  
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

  // Refund Policy State
refundPolicyInfo: {
  policyType: null, // 'refunded' | 'non-refundable'
  policyText: '',
  policyDisplayed: false,
  policyAccepted: false,
},
  
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
    
    // Refund Policy Management
setRefundPolicyInfo: (state, action) => {
  state.refundPolicyInfo = { ...state.refundPolicyInfo, ...action.payload };
},

markRefundPolicyDisplayed: (state) => {
  state.refundPolicyInfo.policyDisplayed = true;
},

acceptRefundPolicy: (state) => {
  state.refundPolicyInfo.policyAccepted = true;
  state.buyerInfo.refundPolicyAccepted = true;
},

clearRefundPolicyAcceptance: (state) => {
  state.refundPolicyInfo.policyAccepted = false;
  state.buyerInfo.refundPolicyAccepted = false;
},

    // Custom Registration Fields
    updateFormResponse: (state, action) => {
      const { fieldName, value } = action.payload;
      state.formResponses[fieldName] = value;
    },
    
    clearFormResponses: (state) => {
      state.formResponses = {};
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
        state.stripeAccountId = action.payload.stripeAccountId;
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
   setRefundPolicyInfo,
  markRefundPolicyDisplayed,
  acceptRefundPolicy,
  clearRefundPolicyAcceptance,
  updateFormResponse,
  clearFormResponses,
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
export const selectRefundPolicyInfo = (state) => state.ticketPurchase.refundPolicyInfo;
export const selectFormResponses = (state) => state.ticketPurchase.formResponses;

export default ticketPurchaseSlice.reducer;