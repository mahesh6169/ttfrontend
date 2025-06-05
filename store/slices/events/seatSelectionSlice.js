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
      
      // ✅ FIXED: Validate based on actual backend response structure
      if (!data.success || !data.seats || !Array.isArray(data.seats)) {
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

// ✅ FIXED: Updated to match backend API structure
export const releaseReservation = createAsyncThunk(
  'seats/release',
  async ({ eventId, seatIds, sessionId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds, sessionId })
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

// ✅ FIXED: Updated to match backend API structure
export const extendReservation = createAsyncThunk(
  'seats/extend',
  async ({ eventId, seatIds, sessionId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds, sessionId })
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

// ✅ CLEANED UP: Aligned with new backend structure
const initialState = {
  // Core seat data
  seatingLayout: [],
  selectedSeats: [], // Array of seatIds like ["A-1", "B-3"]
  currentReservation: null, // Will store: {eventId, userId, sessionId, reservedUntil, seatIds, seatCount}
  
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
    // ✅ CORE: Seat selection actions
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
      state.currentReservation = null;
    },
    
    // ✅ CORE: Event context
    setCurrentEvent: (state, action) => {
      const { eventId, maxSeatsPerSelection = 10 } = action.payload;
      state.currentEventId = eventId;
      state.maxSeatsPerSelection = maxSeatsPerSelection;
      state.selectedSeats = [];
      state.currentReservation = null;
      state.error = null;
    },
    
    // ✅ CORE: Session management
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    
    // ✅ CORE: State reset
    resetSeatSelection: (state) => {
      return { ...initialState, sessionId: state.sessionId };
    },
    
    // ✅ CORE: Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    // ✅ FIXED: Updated to handle new socket event structure
    handleRemoteSeatUpdate: (state, action) => {
      const { seatId, status, userId, reservedBy, reservedUntil, timestamp } = action.payload;
      
      console.log('🔄 Processing remote seat update:', action.payload);
      
      // Find and update the seat in layout
      for (const row of state.seatingLayout) {
        const seat = row.seats.find(s => s.seatId === seatId);
        if (seat) {
          const oldStatus = seat.status;
          
          // Update seat properties
          seat.status = status;
          seat.reservedBy = reservedBy || null;
          seat.reservedUntil = reservedUntil || null;
          
          console.log(`🪑 Updated seat ${seatId}: ${oldStatus} → ${status}`);
          
          // If someone else took a seat we had selected, remove from our selection
          if (status === 'selected' && reservedBy && reservedBy !== userId && state.selectedSeats.includes(seatId)) {
            console.log(`🚫 Seat ${seatId} taken by another user, removing from selection`);
            state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
          }
          
          // If a seat becomes available and we had it reserved, clear our reservation
          if (status === 'available' && state.currentReservation?.seatIds?.includes(seatId)) {
            console.log(`🔓 Seat ${seatId} released, updating reservation`);
            const updatedSeatIds = state.currentReservation.seatIds.filter(id => id !== seatId);
            if (updatedSeatIds.length === 0) {
              state.currentReservation = null;
            } else {
              state.currentReservation.seatIds = updatedSeatIds;
              state.currentReservation.seatCount = updatedSeatIds.length;
            }
          }
          
          break;
        }
      }
    },

    // ✅ FIXED: Enhanced user disconnection handling
    handleUserDisconnected: (state, action) => {
      const { userId } = action.payload;
      console.log(`👤 User ${userId} disconnected, releasing their seats`);
      
      // Release any seats that were reserved by disconnected user
      for (const row of state.seatingLayout) {
        for (const seat of row.seats) {
          if (seat.reservedBy === userId && seat.status === 'selected') {
            console.log(`🔓 Releasing seat ${seat.seatId} from disconnected user`);
            seat.status = 'available';
            seat.reservedBy = null;
            seat.reservedUntil = null;
          }
        }
      }
    },

    // ✅ NEW: Handle seat cleanup events from backend
    handleSeatCleanup: (state, action) => {
      const { eventId, seatsReleased } = action.payload;
      console.log(`🧹 Seat cleanup completed for event ${eventId}: ${seatsReleased} seats released`);
      
      // Could trigger a refresh or show a notification
      // For now, just log the cleanup
    },
    
    // ✅ NEW: Update seat in layout (for direct updates)
    updateSeatInLayout: (state, action) => {
      const { seatId, updates } = action.payload;
      
      for (const row of state.seatingLayout) {
        const seat = row.seats.find(s => s.seatId === seatId);
        if (seat) {
          Object.assign(seat, updates);
          console.log(`🪑 Updated seat ${seatId} in layout:`, updates);
          break;
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
        console.log('✅ Seat availability loaded:', state.seatingLayout.length, 'rows');
      })
      .addCase(fetchSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.error('❌ Failed to load seat availability:', action.payload);
      });
    
    // ✅ FIXED: Reserve seats - Updated to handle new backend response
    builder
      .addCase(reserveSeats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(reserveSeats.fulfilled, (state, action) => {
        console.log('🎫 reserveSeats.fulfilled - Raw payload:', action.payload);
        
        state.isLoading = false;
        state.error = null;
        
        // ✅ FIXED: Map backend response correctly to currentReservation
        const { eventId, userId, sessionId, reservedUntil, seats, seatCount, success } = action.payload;
        
        if (success && seats && Array.isArray(seats)) {
          // Extract seatIds from the seats array
          const seatIds = seats.map(seat => seat.seatId);
          
          state.currentReservation = {
            eventId: eventId,
            userId: userId,
            sessionId: sessionId,
            reservedUntil: reservedUntil,
            seatIds: seatIds,
            seatCount: seatCount,
            seats: seats // Keep full seat details for reference
          };
          
          // Update seat statuses in layout
          for (const reservedSeat of seats) {
            for (const row of state.seatingLayout) {
              const seat = row.seats.find(s => s.seatId === reservedSeat.seatId);
              if (seat) {
                seat.status = 'selected';
                seat.reservedBy = userId;
                seat.reservedUntil = reservedUntil;
              }
            }
          }
          
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
        console.error('❌ Seat reservation failed:', action.payload);
      });
    
    // ✅ FIXED: Release reservation - Updated for new API
    builder
      .addCase(releaseReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(releaseReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const { releasedSeats } = action.payload;
        console.log('🔓 Released seats:', releasedSeats);
        
        // Update seat statuses in layout
        if (releasedSeats && Array.isArray(releasedSeats)) {
          for (const seatId of releasedSeats) {
            for (const row of state.seatingLayout) {
              const seat = row.seats.find(s => s.seatId === seatId);
              if (seat) {
                seat.status = 'available';
                seat.reservedBy = null;
                seat.reservedUntil = null;
              }
            }
          }
        }
        
        // Clear reservation and selection
        state.currentReservation = null;
        state.selectedSeats = [];
      })
      .addCase(releaseReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.error('❌ Failed to release reservation:', action.payload);
      });
    
    // ✅ FIXED: Extend reservation - Updated for new API
    builder
      .addCase(extendReservation.fulfilled, (state, action) => {
        const { extendedSeats, newExpiry } = action.payload;
        console.log('⏰ Extended reservation:', extendedSeats);
        
        // Update current reservation expiry
        if (state.currentReservation) {
          state.currentReservation.reservedUntil = newExpiry;
        }
        
        // Update seat reservation times in layout
        if (extendedSeats && Array.isArray(extendedSeats)) {
          for (const extendedSeat of extendedSeats) {
            for (const row of state.seatingLayout) {
              const seat = row.seats.find(s => s.seatId === extendedSeat.seatId);
              if (seat) {
                seat.reservedUntil = extendedSeat.newExpiry || newExpiry;
              }
            }
          }
        }
      })
      .addCase(extendReservation.rejected, (state, action) => {
        console.error('❌ Failed to extend reservation:', action.payload);
        state.error = action.payload;
      });
  }
});

// ✅ Selectors
export const selectSeatingLayout = (state) => state.seatSelection.seatingLayout;
export const selectSelectedSeats = (state) => state.seatSelection.selectedSeats;
export const selectCurrentReservation = (state) => state.seatSelection.currentReservation;
export const selectIsLoading = (state) => state.seatSelection.isLoading;
export const selectError = (state) => state.seatSelection.error;
export const selectCurrentEventId = (state) => state.seatSelection.currentEventId;
export const selectSessionId = (state) => state.seatSelection.sessionId;
export const selectMaxSeatsPerSelection = (state) => state.seatSelection.maxSeatsPerSelection;

// ✅ NEW: Additional useful selectors
export const selectHasActiveReservation = (state) => {
  const reservation = state.seatSelection.currentReservation;
  if (!reservation || !reservation.reservedUntil) return false;
  return new Date(reservation.reservedUntil) > new Date();
};

export const selectReservationTimeLeft = (state) => {
  const reservation = state.seatSelection.currentReservation;
  if (!reservation || !reservation.reservedUntil) return 0;
  const now = new Date().getTime();
  const expiry = new Date(reservation.reservedUntil).getTime();
  return Math.max(0, expiry - now);
};

// ✅ Actions
export const {
  selectSeat,
  deselectSeat,
  clearSelection,
  setCurrentEvent,
  setSessionId,
  resetSeatSelection,
  clearError,
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  handleSeatCleanup,
  updateSeatInLayout
} = seatSelectionSlice.actions;

export default seatSelectionSlice.reducer;