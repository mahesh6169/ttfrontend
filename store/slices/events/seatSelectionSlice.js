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
const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/seats/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ seatIds, ticketTypeId, sessionId })
      });
      
      const data = await response.json();
      if (!response.ok) {
        // Don't log expected errors like seat unavailable
        if (!data.message?.includes('not available')) {
          console.error('❌ Reservation failed:', data);
        }
        return rejectWithValue(data.message || 'Failed to reserve seats');
      }
      
      // ✅ FIXED: Validate based on actual backend response structure
      if (!data.success || !data.seats || !Array.isArray(data.seats)) {
        console.error('❌ Invalid response format:', data);
        return rejectWithValue('Invalid response format from server');
      }
      
      return data;
    } catch (error) {
      // Only log actual network errors, not business logic errors
      if (error.name === 'TypeError' || error.name === 'NetworkError') {
        console.error('❌ Network error during reservation:', error);
      }
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
  seatingLayout: [], // saves the seating layout on initial load
  selectedSeats: [], // Array of seatIds like ["A-1", "B-3"]
  currentReservation: null, // Will store: {eventId, userId, sessionId, reservedUntil, seatIds, seatCount}
  
  // UI state
  isLoading: false,

  // Specific error states
fetchError: null,
reserveError: null,
releaseError: null,
extendError: null,
  
  // Event context
  currentEventId: null,
  maxSeatsPerSelection: 10,
  sessionId: null,
  
  // WebSocket connection state
  socketConnected: false,
  socketJoinedRoom: false
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
  state.fetchError = null;
  state.reserveError = null;
  state.releaseError = null;
  state.extendError = null;
    },
    
    // ✅ CORE: Session management
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    
    // WebSocket connection management
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    
    setSocketJoinedRoom: (state, action) => {
      state.socketJoinedRoom = action.payload;
    },
    
    // ✅ CORE: State reset
    resetSeatSelection: (state) => {
return { ...initialState, sessionId: state.sessionId };
    },
    
    // ✅ CORE: Restore seats from saved state
    restoreSeatsFromSaved: (state, action) => {
      const { selectedSeats, reservation } = action.payload;
      state.selectedSeats = selectedSeats || [];
      state.currentReservation = reservation || null;
    },
    
// ✅ CORE: Error handling
clearError: (state) => {
  state.fetchError = null;
  state.reserveError = null;
  state.releaseError = null;
  state.extendError = null;
},

// ✅ NEW: Clear specific errors
clearFetchError: (state) => {
  state.fetchError = null;
},
clearReserveError: (state) => {
  state.reserveError = null;
},
clearReleaseError: (state) => {
  state.releaseError = null;
},
clearExtendError: (state) => {
  state.extendError = null;
},
// ✅ ENHANCED: Updated to handle release events better
handleRemoteSeatUpdate: (state, action) => {
  const { seatId, status, userId, reservedBy, reservedUntil, timestamp, operationType } = action.payload;
// Find and update the seat in layout
  for (const row of state.seatingLayout) {
    const seat = row.seats.find(s => s.seatId === seatId);
    if (seat) {
      const oldStatus = seat.status;
      
      // Update seat properties
      seat.status = status;
      seat.reservedBy = reservedBy || null;
      seat.reservedUntil = reservedUntil || null;
      
      // ✅ NEW: Handle sessionId for releases
      if (status === 'available') {
        seat.sessionId = null;
      }
// ✅ ENHANCED: Better handling of seat conflicts and releases
      if (status === 'selected' && reservedBy && reservedBy !== userId && state.selectedSeats.includes(seatId)) {
state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
      }
      
      // ✅ NEW: Handle seats that become available (released by others or expired)
      if (status === 'available' && oldStatus !== 'available') {
// If this seat was in our reservation, update the reservation
        if (state.currentReservation?.seatIds?.includes(seatId)) {
const updatedSeatIds = state.currentReservation.seatIds.filter(id => id !== seatId);
          
          if (updatedSeatIds.length === 0) {
state.currentReservation = null;
          } else {
            state.currentReservation.seatIds = updatedSeatIds;
            state.currentReservation.seatCount = updatedSeatIds.length;
}
        }
        
        // ✅ NEW: Remove from selected seats if it was released
        if (state.selectedSeats.includes(seatId)) {
          state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
}
      }
      
      // ✅ NEW: Log operation context if available
      if (operationType) {
}
      
      break;
    }
  }
},

    // ✅ FIXED: Enhanced user disconnection handling
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

    // ✅ NEW: Handle seat cleanup events from backend
    handleSeatCleanup: (state, action) => {
      const { eventId, seatsReleased } = action.payload;
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
break;
        }
      }
    },
    // ✅ NEW: Set current reservation (for restoring from sessionStorage)
    setCurrentReservation: (state, action) => {
state.currentReservation = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch seat availability
    builder
      .addCase(fetchSeatAvailability.pending, (state) => {
        state.isLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchSeatAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.seatingLayout = action.payload.seatingLayout || [];
        state.currentEventId = action.payload.eventId;
})
      .addCase(fetchSeatAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.fetchError = action.payload;
        console.error('❌ Failed to load seat availability:', action.payload);
      });
    
    // ✅ FIXED: Reserve seats - Updated to handle new backend response
    builder
      .addCase(reserveSeats.pending, (state) => {
        state.isLoading = true;
         state.reserveError = null;
      })
      .addCase(reserveSeats.fulfilled, (state, action) => {
state.isLoading = false;
         state.reserveError = null;
        
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
} else {
          console.error('❌ Invalid reservation response:', action.payload);
          state.reserveError = 'Invalid reservation response from server';
        }
      })
      .addCase(reserveSeats.rejected, (state, action) => {
        state.isLoading = false;
        state.reserveError = action.payload;
        state.selectedSeats = [];
        // Don't log expected errors like seat unavailable
        if (!action.payload?.includes('not available')) {
          console.error('❌ Seat reservation failed:', action.payload);
        }
      });
    
// ✅ ENHANCED: Release reservation - Updated for better state management
builder
  .addCase(releaseReservation.pending, (state) => {
    state.isLoading = true;
    // ✅ NEW: Clear error state when starting release
    state.releaseError = null;
  })
  .addCase(releaseReservation.fulfilled, (state, action) => {
    state.isLoading = false;
    
    const { releasedSeats, success } = action.payload;
// ✅ ENHANCED: Update seat statuses in layout with better validation
    if (releasedSeats && Array.isArray(releasedSeats)) {
      let updatedCount = 0;
      
      for (const seatId of releasedSeats) {
        for (const row of state.seatingLayout) {
          const seat = row.seats.find(s => s.seatId === seatId);
          if (seat) {
            // ✅ NEW: Only update if seat was actually reserved/selected
            if (seat.status === 'selected' || seat.status === 'reserved') {
              seat.status = 'available';
              seat.reservedBy = null;
              seat.reservedUntil = null;
              seat.sessionId = null;
              updatedCount++;
}
          }
        }
      }
}
    
    // ✅ ENHANCED: Clear reservation and selection with validation
    if (success) {
      const previousReservation = state.currentReservation;
      state.currentReservation = null;
      
      // ✅ NEW: Clear selected seats that were actually released
      if (releasedSeats && Array.isArray(releasedSeats)) {
        const seatsToKeep = state.selectedSeats.filter(seatId => !releasedSeats.includes(seatId));
        state.selectedSeats = seatsToKeep;
} else {
        // Fallback: clear all selections
        state.selectedSeats = [];
      }
      
    }
  })
  .addCase(releaseReservation.rejected, (state, action) => {
    state.isLoading = false;
    state.releaseError = action.payload;
    console.error('❌ Failed to release reservation in Redux:', action.payload);
    
    // ✅ NEW: Don't automatically clear state on failure - let user retry
    // Only log the error, keep current state intact for potential retry
  });
    
    // ✅ FIXED: Extend reservation - Updated for new API
    builder
      .addCase(extendReservation.fulfilled, (state, action) => {
        const { extendedSeats, newExpiry } = action.payload;
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
        state.extendError = action.payload;
      });
  }
});

// ✅ Selectors
export const selectSeatingLayout = (state) => state.seatSelection.seatingLayout;
export const selectSelectedSeats = (state) => state.seatSelection.selectedSeats;
export const selectCurrentReservation = (state) => state.seatSelection.currentReservation;
export const selectIsLoading = (state) => state.seatSelection.isLoading;
export const selectFetchError = (state) => state.seatSelection.fetchError;
export const selectReserveError = (state) => state.seatSelection.reserveError;
export const selectReleaseError = (state) => state.seatSelection.releaseError;
export const selectExtendError = (state) => state.seatSelection.extendError;
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
  setSocketConnected,
  setSocketJoinedRoom,
  resetSeatSelection,
  restoreSeatsFromSaved,
  clearError,
  clearFetchError,
  clearReserveError,
  clearReleaseError,
  clearExtendError,
  handleRemoteSeatUpdate,
  handleUserDisconnected,
  handleSeatCleanup,
  updateSeatInLayout,
  syncSelectedSeatsWithReservation,
  setCurrentReservation

} = seatSelectionSlice.actions;

export default seatSelectionSlice.reducer;