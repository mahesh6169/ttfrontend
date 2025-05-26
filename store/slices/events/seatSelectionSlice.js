// store/slices/seatSelectionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchSeatAvailability = createAsyncThunk(
  'seatSelection/fetchAvailability',
  async (eventId) => {
    const response = await fetch(`/api/events/${eventId}/seats`);
    return response.json();
  }
);

export const reserveSeats = createAsyncThunk(
  'seatSelection/reserve',
  async ({ eventId, seatIds, sessionId }) => {
    const response = await fetch(`/api/events/${eventId}/seats/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds, sessionId })
    });
    return response.json();
  }
);

const seatSelectionSlice = createSlice({
  name: 'seatSelection',
  initialState: {
    seatingLayout: [],
    selectedSeats: [], // Array of seat IDs like ["A-1", "B-3"]
    reservationId: null,
    reservationExpiry: null,
    status: 'idle',
    error: null
  },
  reducers: {
    selectSeat: (state, action) => {
      const seatId = action.payload;
      if (!state.selectedSeats.includes(seatId)) {
        state.selectedSeats.push(seatId);
      }
    },
    deselectSeat: (state, action) => {
      const seatId = action.payload;
      state.selectedSeats = state.selectedSeats.filter(id => id !== seatId);
    },
    clearSelection: (state) => {
      state.selectedSeats = [];
      state.reservationId = null;
      state.reservationExpiry = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeatAvailability.fulfilled, (state, action) => {
        state.seatingLayout = action.payload.seatingLayout;
        state.status = 'succeeded';
      })
      .addCase(reserveSeats.fulfilled, (state, action) => {
        state.reservationId = action.payload.reservationId;
        state.reservationExpiry = action.payload.reservedUntil;
      });
  }
});

export const { selectSeat, deselectSeat, clearSelection } = seatSelectionSlice.actions;
export default seatSelectionSlice.reducer;