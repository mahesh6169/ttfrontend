import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/fetchEventsByFilter`;

// ✅ Async Thunk to Fetch Eventss
export const fetchEventsByFilter = createAsyncThunk(
  'eventFilters/fetchEventsByFilter',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { category, location, proximity, page, limit, selectedMonth } = getState().eventFilters;

      const params = {
        ...(category && { category }),
        ...(location && { location }),
        ...(proximity && { proximity }),
        ...(selectedMonth && { month: selectedMonth }), // ⬅️ Include month if selected
        page,
        limit,
      };

      console.log("🔍 Event API Request Params:", params);

      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error("❌ Event API Fetch Error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || 'Failed to fetch events');
    }
  }
);

// ✅ Slice
const filterEventSlice = createSlice({
  name: 'eventFilters',
  initialState: {
    category: '',
    location: '',
    proximity: 10,
    page: 1,
    limit: 12,
    selectedMonth: '', // Format: "YYYY-MM"
    events: [],
    meta: {},
    status: 'idle',
    error: null,
  },
  reducers: {
    updateEventFilter: (state, action) => {
      Object.assign(state, action.payload);
    },
    resetEventFilters: (state) => {
      state.category = '';
      state.location = '';
      state.proximity = 10;
      state.page = 1;
      state.limit = 12;
      state.selectedMonth = '';
      state.events = [];
      state.meta = {};
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventsByFilter.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEventsByFilter.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.events = action.payload.events;
        state.meta = action.payload.meta;
      })
      .addCase(fetchEventsByFilter.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { updateEventFilter, resetEventFilters } = filterEventSlice.actions;
export default filterEventSlice.reducer;
