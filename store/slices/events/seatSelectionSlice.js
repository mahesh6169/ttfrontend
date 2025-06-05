import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchSeatAvailability = createAsyncThunk(
  'seats/fetchAvailability',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch seat availability');
      }
      
      return { eventId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const reserveSeats = createAsyncThunk(
  'seats/reserve',
  async ({ eventId, seatIds, ticketTypeId, sessionId }, { rejectWithValue }) => {
    try {
      console.log('🎫 Sending reservation request:', { eventId, seatIds, ticketTypeId, sessionId });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds, ticketTypeId, sessionId })
      });
      
      const data = await response.json();
      console.log('🎫 Reservation response received:', data);
      
      if (!response.ok) {
        console.error('❌ Reservation failed:', data);
        return rejectWithValue(data.message || 'Failed to reserve seats');
      }
      
      // Validate required fields before returning
      if (!data.success || !data.reservationId) {
        console.error('❌ Invalid response format:', data);
        return rejectWithValue('Invalid response format from server');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Network error during reservation:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const releaseReservation = createAsyncThunk(
  'seats/release',
  async ({ eventId, reservationId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve/${reservationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to release reservation');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const extendReservation = createAsyncThunk(
  'seats/extend',
  async ({ eventId, reservationId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve/${reservationId}/extend`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to extend reservation');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ✅ CLEANED UP: Removed unused properties
const initialState = {
  // Core seat data
  seatingLayout: [],
  selectedSeats: [], // Array of seatIds like ["A-1", "B-3"]
  currentReservation: null,
  
  // UI state
  isLoading: false,
  error: null,
  
  // Event context
  currentEventId: null,
  maxSeatsPerSelection: 10,
  sessionId: null
};

const seatSelectionSlice = createSlice({
  name: 'seatSelection',
  initialState,
  reducers: {
    // ✅ CORE: Seat selection actions (USED)
    selectSeat: (state, action) => {
      const seatId = action.payload;
      if (!state.selectedSeats.includes(seatId)) {
        if (state.selectedSeats.length < state.maxSeatsPerSelection) {
          state.selectedSeats.push(seatId);
        }
      }
    },
    
    deselectSeat: (state, action) => {
      const seatId = action.payload;
      state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
    },
    
    clearSelection: (state) => {
      state.selectedSeats = [];
    },
    
    // ✅ CORE: Event context (USED)
    setCurrentEvent: (state, action) => {
      const { eventId, maxSeatsPerSelection = 10 } = action.payload;
      state.currentEventId = eventId;
      state.maxSeatsPerSelection = maxSeatsPerSelection;
      state.selectedSeats = [];
      state.currentReservation = null;
      state.error = null;
    },
    
    // ✅ CORE: Session management (USED)
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    
    // ✅ CORE: State reset (USED)
    resetSeatSelection: (state) => {
      return { ...initialState, sessionId: state.sessionId };
    },
    
    // ✅ CORE: Error handling (USED)
    clearError: (state) => {
      state.error = null;
    },
    
    // ✅ CORE: Real-time updates (USED)
    handleRemoteSeatUpdate: (state, action) => {
      const { seatId, status, userId, reservedBy, reservedUntil } = action.payload;
      
      // Find and update the seat in layout
      for (const row of state.seatingLayout) {
        const seat = row.seats.find(s => s.seatId === seatId);
        if (seat) {
          seat.status = status;
          seat.reservedBy = reservedBy || null;
          seat.reservedUntil = reservedUntil || null;
          
          // If someone else selected a seat we had selected, remove from our selection
          if (status === 'selected' && state.selectedSeats.includes(seatId)) {
            state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
          }
          break;
        }
      }
    },

    // ✅ CORE: User disconnection handling (USED)
    handleUserDisconnected: (state, action) => {
      const { userId } = action.payload;
      
      // Release any seats that were reserved by disconnected user
      for (const row of state.seatingLayout) {
        for (const seat of row.seats) {
          if (seat.reservedBy === userId && seat.status === 'selected') {
            seat.status = 'available';
            seat.reservedBy = null;
            seat.reservedUntil = null;
          }
        }
      }
    },
  },
  
  extraReducers: (builder) => {
    // Fetch seat availability
    builder
      .addCase(fetchSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.seatingLayout = action.payload.seatingLayout || [];
        state.currentEventId = action.payload.eventId;
      })
      .addCase(fetchSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Reserve seats
    builder
      .addCase(reserveSeats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reserveSeats.fulfilled, (state, action) => {
        console.log('🎫 reserveSeats.fulfilled - Raw payload:', action.payload);
        
        state.isLoading = false;
        state.error = null;
        
        // Map backend response correctly to currentReservation
        const { reservationId, seatIds, reservedUntil, success } = action.payload;
        
        if (success && reservationId) {
          state.currentReservation = {
            reservationId: reservationId,
            seatIds: seatIds || state.selectedSeats,
            reservedUntil: reservedUntil,
            sessionId: state.sessionId,
            eventId: state.currentEventId
          };
          
          console.log('🎫 currentReservation set successfully:', state.currentReservation);
        } else {
          console.error('❌ Invalid reservation response:', action.payload);
          state.error = 'Invalid reservation response from server';
        }
      })
      .addCase(reserveSeats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.selectedSeats = [];
      });
    
    // Release reservation
    builder
      .addCase(releaseReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(releaseReservation.fulfilled, (state) => {
        state.isLoading = false;
        state.currentReservation = null;
        state.selectedSeats = [];
      })
      .addCase(releaseReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // Extend reservation
    builder
      .addCase(extendReservation.fulfilled, (state, action) => {
        if (state.currentReservation) {
          state.currentReservation.reservedUntil = action.payload.newExpiry;
        }
        
        // Update seat reservation times in layout
        if (state.currentReservation) {
          for (const seatId of state.currentReservation.seatIds) {
            for (const row of state.seatingLayout) {
              const seat = row.seats.find(s => s.seatId === seatId);
              if (seat) {
                seat.reservedUntil = action.payload.newExpiry;
              }
            }
          }
        }
      });
  }
});

// ✅ CLEANED UP: Only used selectors
export const selectSeatingLayout = (state) => state.seatSelection.seatingLayout;
export const selectSelectedSeats = (state) => state.seatSelection.selectedSeats;
export const selectCurrentReservation = (state) => state.seatSelection.currentReservation;
export const selectIsLoading = (state) => state.seatSelection.isLoading;
export const selectError = (state) => state.seatSelection.error;
export const selectCurrentEventId = (state) => state.seatSelection.currentEventId;
export const selectSessionId = (state) => state.seatSelection.sessionId;
export const selectMaxSeatsPerSelection = (state) => state.seatSelection.maxSeatsPerSelection;

// ✅ CLEANED UP: Only used actions
export const {
  selectSeat,
  deselectSeat,
  clearSelection,
  setCurrentEvent,
  setSessionId,
  resetSeatSelection,
  clearError,
  handleRemoteSeatUpdate,
  handleUserDisconnected
} = seatSelectionSlice.actions;

export default seatSelectionSlice.reducer;