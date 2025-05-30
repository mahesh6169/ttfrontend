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
        return rejectWithValue(data.message || 'Failed to reserve seats');
      }
      
      return data;
    } catch (error) {
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

const initialState = {
  // Seat layout and availability
  seatingLayout: [],
  reservations: [],
  
  // User selections
  selectedSeats: [], // Array of seatIds like ["A-1", "B-3"]
  selectedTicketType: null,
  
  // Current reservation
  currentReservation: null,
  reservationTimer: null,
  
  // UI state
  isLoading: false,
  error: null,
  
  // Event context
  currentEventId: null,
  
  // Selection limits
  maxSeatsPerSelection: 10,
  
  // Session tracking
  sessionId: null
};

const seatSelectionSlice = createSlice({
  name: 'seatSelection',
  initialState,
  reducers: {
    // Seat selection actions
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
    
    toggleSeat: (state, action) => {
      const seatId = action.payload;
      
      if (state.selectedSeats.includes(seatId)) {
        state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
      } else if (state.selectedSeats.length < state.maxSeatsPerSelection) {
        state.selectedSeats.push(seatId);
      }
    },
    
    clearSelection: (state) => {
      state.selectedSeats = [];
    },
    
    // Ticket type selection
    setSelectedTicketType: (state, action) => {
      state.selectedTicketType = action.payload;
    },
    
    // Event context
    setCurrentEvent: (state, action) => {
      const { eventId, maxSeatsPerSelection = 10 } = action.payload;
      state.currentEventId = eventId;
      state.maxSeatsPerSelection = maxSeatsPerSelection;
      state.selectedSeats = [];
      state.currentReservation = null;
      state.error = null;
    },
    
    // Session management
    setSessionId: (state, action) => {
      state.sessionId = action.payload;
    },
    
    // Reservation timer
    setReservationTimer: (state, action) => {
      state.reservationTimer = action.payload;
    },
    
    updateReservationTimer: (state, action) => {
      if (state.currentReservation) {
        state.reservationTimer = action.payload;
      }
    },
    
    // Clear all state
    resetSeatSelection: (state) => {
      return { ...initialState, sessionId: state.sessionId };
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    // Update seat status locally (optimistic updates)
    updateSeatStatus: (state, action) => {
      const { seatId, status, reservedBy, reservedUntil } = action.payload;
      
      for (const row of state.seatingLayout) {
        const seat = row.seats.find(s => s.seatId === seatId);
        if (seat) {
          seat.status = status;
          seat.reservedBy = reservedBy || null;
          seat.reservedUntil = reservedUntil || null;
          break;
        }
      }
    }
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
        state.reservations = action.payload.reservations || [];
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
        state.isLoading = false;
        state.currentReservation = {
          reservationId: action.payload.reservationId,
          seatIds: action.payload.seatIds,
          reservedUntil: action.payload.reservedUntil
        };
        
        // Update seat statuses to 'selected'
        for (const seatId of action.payload.seatIds) {
          for (const row of state.seatingLayout) {
            const seat = row.seats.find(s => s.seatId === seatId);
            if (seat) {
              seat.status = 'selected';
              seat.reservedUntil = action.payload.reservedUntil;
            }
          }
        }
      })
      .addCase(reserveSeats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.selectedSeats = []; // Clear selection on failure
      });
    
    // Release reservation
    builder
      .addCase(releaseReservation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(releaseReservation.fulfilled, (state) => {
        state.isLoading = false;
        
        // Update seat statuses back to 'available'
        if (state.currentReservation) {
          for (const seatId of state.currentReservation.seatIds) {
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
        
        state.currentReservation = null;
        state.selectedSeats = [];
        state.reservationTimer = null;
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
        
        // Update seat statuses with new expiry
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

// Selectors
export const selectSeatingLayout = (state) => state.seatSelection.seatingLayout;
export const selectSelectedSeats = (state) => state.seatSelection.selectedSeats;
export const selectSelectedTicketType = (state) => state.seatSelection.selectedTicketType;
export const selectCurrentReservation = (state) => state.seatSelection.currentReservation;
export const selectReservationTimer = (state) => state.seatSelection.reservationTimer;
export const selectIsLoading = (state) => state.seatSelection.isLoading;
export const selectError = (state) => state.seatSelection.error;
export const selectCurrentEventId = (state) => state.seatSelection.currentEventId;
export const selectSessionId = (state) => state.seatSelection.sessionId;
export const selectMaxSeatsPerSelection = (state) => state.seatSelection.maxSeatsPerSelection;

// Derived selectors
export const selectSelectedSeatsCount = (state) => state.seatSelection.selectedSeats.length;
export const selectCanSelectMoreSeats = (state) => 
  state.seatSelection.selectedSeats.length < state.seatSelection.maxSeatsPerSelection;
export const selectHasActiveReservation = (state) => 
  state.seatSelection.currentReservation !== null;
export const selectReservationExpiry = (state) => 
  state.seatSelection.currentReservation?.reservedUntil;

// Seat status selectors
export const selectSeatById = (state, seatId) => {
  for (const row of state.seatSelection.seatingLayout) {
    const seat = row.seats.find(s => s.seatId === seatId);
    if (seat) return seat;
  }
  return null;
};

export const selectAvailableSeats = (state) => {
  const availableSeats = [];
  for (const row of state.seatSelection.seatingLayout) {
    for (const seat of row.seats) {
      if (seat.status === 'available') {
        availableSeats.push(seat);
      }
    }
  }
  return availableSeats;
};

export const selectOccupiedSeats = (state) => {
  const occupiedSeats = [];
  for (const row of state.seatSelection.seatingLayout) {
    for (const seat of row.seats) {
      if (seat.status === 'occupied') {
        occupiedSeats.push(seat);
      }
    }
  }
  return occupiedSeats;
};

// Export actions
export const {
  selectSeat,
  deselectSeat,
  toggleSeat,
  clearSelection,
  setSelectedTicketType,
  setCurrentEvent,
  setSessionId,
  setReservationTimer,
  updateReservationTimer,
  resetSeatSelection,
  clearError,
  updateSeatStatus
} = seatSelectionSlice.actions;

export default seatSelectionSlice.reducer;